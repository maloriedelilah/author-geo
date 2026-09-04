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

  // --- Slogan ----------------------------------------------------------
  // A short line describing the site, shown at the very top of the homepage
  // (above "Latest release") — e.g. "Hard science fiction for readers who
  // like their futures plausible." Plain display text, not a schema.org
  // entity, so it lives here rather than in src/content/. Optional — leave
  // undefined to skip it entirely.
  slogan: undefined as string | undefined,

  // --- Theme -----------------------------------------------------------
  // `mode` picks one of the two built-in palettes (see src/styles/theme.css).
  // `accent` is optional — override just the accent color without touching CSS.
  // This is an AUTHOR-TIME choice baked in at build (no visitor-facing toggle,
  // no JS/localStorage) — ask the author which they want, set it here.
  theme: {
    mode: 'dark' as 'dark' | 'light',
    accent: undefined as string | undefined, // e.g. '#ffb454' — omit to use the mode's default
  },

  // --- Header --------------------------------------------------------------
  // `logo.src` is a path under public/ (e.g. '/logo.svg') for authors who want
  // a wordmark image instead of plain text — omit it (leave undefined) to fall
  // back to the author's name as a text wordmark, which is the default and
  // needs no asset at all. `logo.alt` defaults to the author's name if unset.
  //
  // `layout` picks how the brand (logo/wordmark) and nav sit relative to each
  // other: 'left' is the classic header — brand on the left, nav on the right,
  // one row. 'centered' stacks them — brand centered on its own row, nav
  // centered underneath. Ask the author which they'd like, same as theme.mode.
  header: {
    logo: {
      src: undefined as string | undefined, // e.g. '/logo.svg'
      alt: undefined as string | undefined,
    },
    layout: 'left' as 'left' | 'centered',
  },

  // --- Homepage hero slideshow ---------------------------------------------
  // The homepage's top section (Latest release, then one slide per upcoming
  // preorder book, soonest first) auto-advances every `intervalSeconds`,
  // pauses while the mouse/keyboard focus is over it, and always has arrows.
  // Only relevant when there's more than one slide to rotate through.
  heroSlideshow: {
    intervalSeconds: 7,
  },

  // --- Header nav --------------------------------------------------------
  // Rendered in the header per `header.layout` above, after the brand
  // (logo/wordmark). The /contact link is shown ONLY when the contact form is
  // enabled (TURNSTILE_SITE_KEY set at build) — the header auto-hides it
  // otherwise, in lockstep with the page itself not being built (see
  // astro.config.mjs), so you can leave this entry here whether or not the
  // contact form is live yet.
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
    // 'mailerlite' | 'emailoctopus' ship as reference adapters (src/lib/leads/).
    // A fork can add a third (fourth, ...) provider by dropping ONE file at
    // src/overrides/providers/<name>.ts (see src/lib/leads/factory.ts's own
    // header comment + README's "Adding a custom provider" section) and
    // setting provider to that same <name> here -- no upstream file edited.
    // The `(string & {})` union member keeps 'mailerlite'/'emailoctopus'
    // autocompleting as before while still accepting any custom name.
    // Unset by default so a fresh deploy needs zero secrets: with no provider
    // chosen, the homepage newsletter signup is not rendered at all (opt-in).
    // Set this to 'mailerlite' or 'emailoctopus' (and fill the matching .env
    // key) to turn the signup on.
    provider: undefined as 'mailerlite' | 'emailoctopus' | (string & {}) | undefined,
    // Single (false) vs double (true) opt-in. DEFAULT IS SINGLE, and this is a
    // decision to raise WITH THE AUTHOR while building, not silently keep --
    // see SKILL.md Phase 1, item 3. For EmailOctopus this sets the contact's
    // status ('subscribed' vs 'pending') and it MUST agree with the list's own
    // "Double opt-in email" toggle in the EmailOctopus dashboard: `true` here
    // with the toggle OFF creates contacts stuck in Pending forever (no
    // confirmation email is ever sent, and they're hidden from the list's
    // default Subscribed view, so it looks like signups vanished). MailerLite
    // has no per-call equivalent -- it's a group-level dashboard setting there.
    doubleOptIn: false,
    groups: [] as string[],   // provider list/group IDs (MailerLite group IDs directly;
                               // for EmailOctopus these become contact tags)
  },

  // --- Social sharing --------------------------------------------------
  // Purely cosmetic attribution for Twitter/X's `twitter:site` meta tag on
  // link-preview cards (see Base.astro's OG/Twitter Card block). Optional —
  // Open Graph and Twitter Card previews render correctly without it; this
  // just adds "via @handle" credit on X. Include or omit the leading '@',
  // either works.
  social: {
    twitterHandle: undefined as string | undefined,
  },
};
