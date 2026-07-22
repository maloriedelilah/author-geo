// The ONE file a cloning author edits for behavior (content lives in src/content).
//
// Site chrome (theme / nav / footer) lives HERE, not in src/content/, on purpose:
// it isn't a schema.org entity with its own JSON-LD identity (unlike author/books/
// series/hubs/events) — it's presentational config, same tier as `leads` below.
// An AI building a site for an author should ask them light/dark + tweak the
// accent, then edit this block. No code changes required.
export interface NavItem {
  label: string;
  href: string;
}

export const siteConfig = {
  siteUrl: 'https://example.com',

  // --- Theme -----------------------------------------------------------
  // `mode` picks one of the two built-in palettes (see src/styles/theme.css).
  // `accent` is optional — override just the accent color without touching CSS.
  // This is an AUTHOR-TIME choice baked in at build (no visitor-facing toggle,
  // no JS/localStorage) — ask the author which they want, set it here.
  theme: {
    mode: 'dark' as 'dark' | 'light',
    accent: undefined as string | undefined, // e.g. '#ffb454' — omit to use the mode's default
  },

  // --- Header nav --------------------------------------------------------
  // Rendered left-to-right in the header, after the site wordmark (the primary
  // author's name, linking to /). /contact ships as a static form (Tier 1);
  // it doesn't actually deliver mail until the /api/contact endpoint is wired
  // in Tier 2 — see README "Contact form". Remove this nav entry if you'd
  // rather hide the page until that's live.
  nav: [
    { label: 'Series', href: '/series' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ] as NavItem[],

  // --- Footer --------------------------------------------------------------
  footer: {
    tagline: undefined as string | undefined, // short line under the copyright, optional
    // Extra links alongside the auto-added Privacy Policy / Terms of Use.
    links: [] as NavItem[],
  },

  leads: {
    provider: 'mailerlite' as 'mailerlite' | 'emailoctopus',
    doubleOptIn: true,        // config option — single vs double opt-in
    groups: [] as string[],
  },
};
