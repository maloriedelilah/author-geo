# Scaffold spec

This directory holds the **Tier-1 scaffold manifest** — a build *specification*, not
shipped site code. It enumerates every file in the Tier-1 Astro starter (path + full
contents) so a coding agent can materialize the real `src/…` tree deterministically.

- `manifest.json` — 23-file manifest. Source of truth for the scaffold.

## For the agent materializing this

1. Read `manifest.json`. Each entry is `{ path, contents | note }`.
2. Materialize the tree into the repo root (NOT under `scaffold/`), preserving the
   engine/content split so author upstream pulls stay conflict-free.
3. Stack decisions already locked (do not re-litigate):
   - Astro **7**, pinned `^7` in `package.json`; **commit `package-lock.json`**.
   - Pin `@astrojs/cloudflare` new enough for `import { env } from 'cloudflare:workers'`
     (the old `Astro.locals.runtime.env` API is removed).
   - `content.config.ts` API confirmed current for v7 (defineCollection / glob / file /
     z from astro/zod / reference()).
4. **Non-negotiable validation:** the JSON-LD emitted by `jsonld.ts` MUST be validated
   against a schema.org validator. A green `astro build` does NOT prove correct
   structured data — that failure is silent, and valid structured data is the whole
   point of the product.
5. **Delivery:** branch off `main`, PR into `main`. No stacking. Verify your own merge
   is reachable from `main` (fresh `git log main`) — do not trust the merged badge.

This `scaffold/` directory is meta and may be removed from `main` once the tree is
materialized and merged.
