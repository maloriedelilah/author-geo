// MailerLite adapter. API key comes from the Pages Function env (never client-side).
import type { LeadAdapter, Lead } from './types';
export const mailerlite = (apiKey: string): LeadAdapter => ({
  name: 'mailerlite',
  async subscribe(lead: Lead) {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ email: lead.email, fields: { name: lead.name },
        groups: lead.groups }),
    });
    if (!res.ok) throw new Error(`MailerLite ${res.status}: ${await res.text()}`);
    return { ok: true };
  },
});
