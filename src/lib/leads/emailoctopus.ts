// EmailOctopus adapter. API key + list id come from the Worker env via
// src/lib/leads/factory.ts (never client-side).
//
// API VERSION CHECK (done as part of wiring this adapter up for real): this
// already targets EmailOctopus's CURRENT v2 API, not the legacy v1
// (`/api/1.6/...`, api_key-as-query-param) that EmailOctopus's own docs now
// label "legacy... no longer actively maintained". v2 confirmed via
// emailoctopus.com/api-documentation/v2: base URL `https://api.emailoctopus.com`,
// Bearer-token auth (not an api_key body/query param), POST
// `/lists/{list_id}/contacts` with `email_address` + `fields` + `tags` +
// `status`. This adapter already had the right base URL and Bearer auth
// (nothing to fix there) but was silently NEVER sending `tags` -- lead.groups
// had nowhere to go before this pass, even though the Lead type has always
// carried it and MailerLite's sibling adapter already used it. Fixed here.
//
// STATUS ENUM CASE (confirmed directly against a live 422 from a real
// deployed site): EmailOctopus's v2 API only accepts LOWERCASE status
// values -- "pending" | "subscribed" | "unsubscribed" -- per the Create
// contact endpoint's documented enum. Uppercase 'PENDING'/'SUBSCRIBED'
// (what an earlier pass here used) is rejected with a 422:
// {"errors":[{"detail":"The value you selected is not a valid choice.",
// "pointer":"/status"}]}. That meant every signup through this adapter
// failed, silently surfaced to visitors as subscribe.ts's generic
// "Something went wrong" message -- nothing in a local build/test would
// have caught this without a real API call.
//
// ALREADY-SUBSCRIBED HANDLING (also confirmed against a live 409 from the
// same real deployed site): the Create contact endpoint this adapter calls
// is create-ONLY. Resubmitting the form for an email already on the list
// gets `409 {"detail":"List contact already exists.",...,"type":".../v2#
// already-exists"}`, which subscribe.ts was surfacing as a real 502 to a
// visitor who did nothing wrong. Deliberately NOT switched to EmailOctopus's
// upsert endpoint (PUT, same path) to fix this: that endpoint's `tags` field
// is a different shape (an object of tag -> true/false, not an array), and
// upserting would reset an already-CONFIRMED contact's status back to
// whatever this adapter's static config says ('pending'/'subscribed') on
// every resubmit, which is wrong for someone already active. Treating the
// 409 as an idempotent success is narrower and safer: it leaves the
// existing contact's status/tags untouched and just stops reporting "you're
// already on this list" as a failure.
import type { LeadAdapter, Lead } from './types';

export interface EmailOctopusOptions {
  // true (default): status 'pending' -- EmailOctopus sends its own
  // confirmation email before the contact counts as subscribed (double
  // opt-in). false: status 'subscribed' -- added immediately, no
  // confirmation step (single opt-in). Wired from siteConfig.leads.doubleOptIn
  // via factory.ts -- this was a declared-but-previously-unused config field.
  doubleOptIn?: boolean;
}

export const emailoctopus = (
  apiKey: string,
  listId: string,
  options: EmailOctopusOptions = {},
): LeadAdapter => ({
  name: 'emailoctopus',
  async subscribe(lead: Lead) {
    const res = await fetch(`https://api.emailoctopus.com/lists/${listId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        email_address: lead.email,
        fields: lead.name ? { FirstName: lead.name } : undefined,
        // EmailOctopus has no separate "group" concept within a list -- tags
        // are its segmentation mechanism, so lead.groups maps to `tags` here
        // (see mailerlite.ts, where the same field maps to real group IDs).
        tags: lead.groups && lead.groups.length > 0 ? lead.groups : undefined,
        status: options.doubleOptIn === false ? 'subscribed' : 'pending',
      }),
    });
    if (!res.ok) {
      // Already on this list -- not a failure from the visitor's point of
      // view, so don't make subscribe.ts report it as one. See the
      // ALREADY-SUBSCRIBED HANDLING note above for why this doesn't retry
      // as an upsert instead.
      if (res.status === 409) {
        console.log('[emailoctopus] contact already exists — treating resubmit as success');
        return { ok: true };
      }
      throw new Error(`EmailOctopus ${res.status}: ${await res.text()}`);
    }
    return { ok: true };
  },
});
