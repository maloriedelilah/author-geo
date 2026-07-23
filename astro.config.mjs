import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Tier 1 (this slice): static output for Cloudflare Pages.
// `site` MUST be a real absolute URL — jsonld.ts builds every absolute @id
// (author, book, series) off `import.meta.env.SITE`. An unset/placeholder
// site silently produces broken @ids that pass `astro build` but are wrong.
// It's ALSO what @astrojs/sitemap and src/pages/robots.txt.ts key off of
// (via Astro.site) — so fixing this one value up top is what keeps JSON-LD
// @ids, the sitemap, and robots.txt's Sitemap: line all in agreement.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [sitemap()],

  // --- Tier 2 switch (deferred; NOT part of this slice) ---
  // Flip to server output + the Cloudflare adapter when lead-capture /
  // dynamic routes (src/pages/api/subscribe.ts) come online:
  //
  // import cloudflare from '@astrojs/cloudflare';
  // export default defineConfig({
  //   site: 'https://example.com',
  //   output: 'server',
  //   adapter: cloudflare(),
  //   integrations: [sitemap()],
  // });
});
