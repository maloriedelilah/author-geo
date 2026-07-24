/// <reference types="astro/client" />

// Tier 2: on-demand rendering for /api/* routes on Cloudflare Workers (see
// astro.config.mjs / wrangler.toml — the rest of the site stays static).
//
// `Astro.locals.runtime.env` was REMOVED in this adapter's current major
// (v13+, "Astro v6"-era) — env vars/secrets are read via
// `import { env } from 'cloudflare:workers'` instead (see src/pages/api/
// contact.ts). This declares that module's shape so `env.RESEND_API_KEY`
// etc. get real type-checking instead of `any`.
//
// These are ALL set as Cloudflare Worker environment variables or secrets
// in the Cloudflare dashboard (Settings -> Variables and Secrets) — never
// committed here, never read from a local .env for production. A missing
// one should fail loud in the route that needs it, not silently no-op (see
// the README "Contact form" section for the full list + which are secret
// vs plain).
interface WorkerEnv {
  // Resend (transactional email) — see src/lib/email/resend.ts
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;

  // Cloudflare Turnstile (spam gating on /contact) — secret key only;
  // the site key is public and goes through TURNSTILE_SITE_KEY (a
  // build-time import.meta.env var, read in ContactForm.astro's
  // frontmatter — not a Workers runtime secret) instead.
  TURNSTILE_SECRET_KEY: string;
}

declare module 'cloudflare:workers' {
  export const env: WorkerEnv;
}

// Build-time env vars (import.meta.env), distinct from the Workers runtime
// env above — see .env.example. Astro merges this into its own
// ImportMetaEnv; only PUBLIC_-prefixed vars would ever reach client-side
// <script> bundles, but this one is only ever read in server-rendered
// frontmatter (ContactForm.astro), so no prefix is needed.
interface ImportMetaEnv {
  readonly TURNSTILE_SITE_KEY: string;
}
