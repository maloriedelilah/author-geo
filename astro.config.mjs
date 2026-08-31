import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { themeOverridePlugin } from './vite-plugins/theme-override.mjs';
import { themeStylesOverridePlugin } from './vite-plugins/theme-styles-override.mjs';

// Read env the way Astro/Vite do (merges .env files + the real process env),
// so this works whether TURNSTILE_SITE_KEY comes from a local .env or a
// Cloudflare build variable. Empty prefix ('') loads ALL vars, not just
// PUBLIC_-prefixed ones.
const { TURNSTILE_SITE_KEY } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');

// The contact form is OPT-IN. /contact is injected only when TURNSTILE_SITE_KEY
// (the public Turnstile site key the widget needs) is set at build time.
// Without it the page is simply not built — the build SUCCEEDS and logs why —
// so a fresh clone deploys with zero secrets configured. The page lives at
// src/pages/_contact.astro (underscore-prefixed so Astro doesn't auto-route
// it); this integration maps /contact to it when enabled. Turn the form on by
// setting TURNSTILE_SITE_KEY (a build variable) plus the Tier 2 runtime
// secrets — see README "Contact form". The header hides its /contact nav link
// under the same condition (src/components/Header.astro).
function contactRouteIntegration() {
  return {
    name: 'contact-route',
    hooks: {
      'astro:config:setup': ({ injectRoute, logger }) => {
        if (TURNSTILE_SITE_KEY) {
          injectRoute({
            pattern: '/contact',
            entrypoint: './src/pages/_contact.astro',
            prerender: true,
          });
        } else {
          logger.warn(
            'Contact form disabled: TURNSTILE_SITE_KEY is unset, so /contact was not built. ' +
              'Set it (a public Turnstile site key) plus the Tier 2 runtime secrets to enable it — see README "Contact form".',
          );
        }
      },
    },
  };
}

// `site` MUST be a real absolute URL — jsonld.ts builds every absolute @id
// (author, book, series) off `import.meta.env.SITE`. An unset/placeholder
// site silently produces broken @ids that pass `astro build` but are wrong.
// It's ALSO what @astrojs/sitemap and src/pages/robots.txt.ts key off of
// (via Astro.site) — so fixing this one value up top is what keeps JSON-LD
// @ids, the sitemap, and robots.txt's Sitemap: line all in agreement.
//
// Tier 2 (contact form, now subscribe later): deliberately KEEPING
// `output: 'static'` rather than flipping to `output: 'server'` (contra an
// earlier plan noted here). Astro's own docs: 'static' mode "prerenders all
// pages by default... if none opt out." With the Cloudflare adapter
// installed, an individual route can still opt into on-demand rendering via
// `export const prerender = false` (see src/pages/api/contact.ts). That
// gives the form endpoints a real server to run in WITHOUT quietly turning
// every book/series/theme/hub page into a per-request Workers render —
// this repo's whole value proposition (a static site, zero origin-server
// cost for content pages) stays intact; only /api/* pays the SSR cost,
// because only /api/* actually needs it.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  adapter: cloudflare({
    // This site never uses Astro's <Image>/astro:assets transforms (every
    // cover is a plain <img> at its already-final size) — 'passthrough'
    // stops the adapter auto-provisioning a Cloudflare Images "IMAGES"
    // binding for a feature nothing here actually calls.
    imageService: 'passthrough',
    // Default ('workerd') spins up a local workerd instance during `astro
    // build` to prerender static routes in an environment matching
    // production as closely as possible. None of this repo's prerendered
    // content uses any Cloudflare-specific runtime API (no bindings, no
    // `Astro.locals.runtime` on any prerendered page — only the two
    // on-demand /api/* routes touch that), so there's nothing workerd-
    // specific for prerendering to actually need here. 'node' prerenders
    // with plain Node instead, which sidesteps that local-workerd step
    // entirely — worth it since it also avoids the extra moving part
    // (a local server astro spins up and fetches from) some sandboxed/CI
    // environments' network restrictions can trip up.
    prerenderEnvironment: 'node',
  }),
  integrations: [sitemap(), contactRouteIntegration()],
  // Backs the `@theme/...` import alias (layouts + components import
  // presentation this way instead of a relative path) -- resolves to an
  // implementer's src/overrides/<rel> shadow if one exists, else falls back
  // to the upstream src/<rel> base file. See vite-plugins/theme-override.mjs
  // and src/overrides/README.md for the full contract. Deliberately NOT a
  // plain `resolve.alias` entry -- a static alias can't express the
  // override-if-present-else-base fallback this needs.
  //
  // themeStylesOverridePlugin backs the separate `@theme-styles/site.css`
  // virtual specifier -- the free-form CSS override slot (Tier B, THEMING.md)
  // -- which resolves to src/overrides/styles/site.css if it exists, else an
  // empty virtual stylesheet, so Base.astro can import it unconditionally
  // with no build break when the override is absent. See
  // vite-plugins/theme-styles-override.mjs for the full reasoning.
  vite: {
    plugins: [themeOverridePlugin(), themeStylesOverridePlugin()],
  },
});
