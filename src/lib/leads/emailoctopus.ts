// EmailOctopus adapter. API key + list id from the Pages Function env.
import type { LeadAdapter, Lead } from './types';
export const emailoctopus = (apiKey: string, listId: string): LeadAdapter => ({
  name: 'emailoctopus',
  async subscribe(lead: Lead) {
    const res = await fetch(`https://api.emailoctopus.com/lists/${listId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ email_address: lead.email,
        fields: { FirstName: lead.name }, status: 'PENDING' }),
    });
    if (!res.ok) throw new Error(`EmailOctopus ${res.status}: ${await res.text()}`);
    return { ok: true };
  },
});
