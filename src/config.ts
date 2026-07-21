// The ONE file a cloning author edits for behavior (content lives in src/content).
export const siteConfig = {
  siteUrl: 'https://example.com',
  leads: {
    provider: 'mailerlite' as 'mailerlite' | 'emailoctopus',
    doubleOptIn: true,        // config option — single vs double opt-in
    groups: [] as string[],
  },
};
