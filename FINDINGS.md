# Slice-01 — Findings & Design Notes

This vertical slice (engine core + one book page) is **built and validated**:
`astro build` passes under Astro 7.1.3; the emitted JSON-LD validates against
`validator.schema.org` with **0 errors, 0 warnings**, and every cross-reference
resolves (`Book->author->Person`, `Book->workExample->Book` x2,
`WebSite->publisher->Person`).

Two things surfaced that the build **cannot** catch. Neither blocks merging this
slice — the single page it builds resolves cleanly today — but both propagate to
the full Tier-1 scaffold, so they are recorded here.

## Finding #1 — `site` is still the placeholder

`astro.config.mjs` has `site: 'https://example.com'`. `jsonld.ts` builds absolute
`@id`s from `import.meta.env.SITE`, so every `@id` in the payload is currently on
the placeholder domain. Fine for a slice (it proves the mechanism); **must be set
to the real production URL before deploy**, or the canonical `@id`s are wrong.

## Finding #2 — split JSON-LD emission can dangle `publisher` — RESOLVED by DD-001

**The observation.** JSON-LD emission is split: `Base.astro` emits the `WebSite`
node (with `publisher: {@id: .../#author}`) on **every** page, while the
**page template** emits the `Person` node carrying that `@id`. On this book page
both fire, so `WebSite.publisher -> #author` resolves (validator confirms it).
But on any page that injects **no** author (a future About-less page, 404, plain
content page), `Base` still emits the `publisher` reference while nothing supplies
the `#author` node — the reference **dangles**, and consumers silently drop it.
That silently removes the machine-readable "who published this site" signal —
which is the whole point of this product for answer engines — on some pages.

**The resolution — DD-001 (Canonical-URI entity identity).** Recorded in the
project design docs (`author-geo-website` doc, `design-decisions` section):

1. **Define once, at the home page.** Each `Person` (author or co-author) has
   **one canonical `@id`** anchored to their About/profile page
   (`{site}/about#author`). The **full** `Person` node — name, description,
   `sameAs`, image — is emitted **once**, there.
2. **Reference by URI everywhere else.** `WebSite.publisher` and every
   `Book.author` carry that canonical `@id` — a stable URI pointing at the
   canonical definition, **not** a promise that "this page emits the node."
3. **Author belongs to the Book, not site chrome.** Books can have **co-authors**,
   so `author` is a per-book fact: `Book.author` may be an **array** of refs.
   This retires the tempting "bake one sitewide author into `Base.astro`" fix.
4. **Named stub at every reference site.** Wherever a `Person` is referenced by
   `@id`, also emit a minimal inline stub — `{@type: Person, @id, name}` — so each
   page's JSON-LD is valid and useful **standalone** (a crawler seeing only the
   book page still gets a *named* author) while the shared `@id` unifies it with
   the canonical definition for whole-site consumers.

**Scaffold impact (to apply when the full scaffold + About page land):**
- `jsonld.ts` — author refs become canonical-`@id` + named stub (not full
  re-emission, not a bare `@id`).
- `content.config.ts` — `Book` gets `author`/co-author as a **reference array**;
  an `Author`/`Person` collection owns the canonical URL/`@id`.
- About-page template emits the full `Person` node(s).

This is the general model for **all six entities** (Author, Book, Series, Hub,
Comp, Event): define-once-at-home-page, reference-by-`@id`-plus-named-stub
everywhere else.
