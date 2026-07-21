# author-geo

A teaching-oriented starter for building an author website with first-class,
machine-readable structured data (JSON-LD / schema.org) — so an author's books,
series, and identity are legible to search engines and LLMs ("GEO": Generative
Engine Optimization).

## Stack

- **Astro 7** (pinned to `^7`) — static-first, content-collections driven
- **Content Layer** — Zod-validated collections (Author, Book, Series, Hub, Comp, Event)
- **JSON-LD** — a `@graph` builder emits validated schema.org structured data
- **Deploy** — Cloudflare (Workers/Pages) via `@astrojs/cloudflare`
- **Lead capture** — pluggable adapter (MailerLite / EmailOctopus)

## Structure (engine / content split)

- `src/` — the engine (layouts, components, JSON-LD builder, schemas). Pull upstream to update.
- `src/content/` — the author's content (Markdown/data). Yours to edit; stays conflict-free on upstream pulls.

## Getting started

```sh
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

Requires **Node >= 22.12**.
