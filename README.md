# author-geo

**An author website that machines can read.** A clone-and-edit starter for a
book-focused author site whose books, series, themes, and identity are emitted as
first-class, validated **JSON-LD / schema.org** structured data — so search engines
and LLMs can understand who you are and what you've written. ("GEO" =
Generative Engine Optimization.)

You bring the content (Markdown files describing your books and yourself); the
engine turns it into a fast static site with correct, cross-linked structured data
baked into every page.

- **Tier 1 (this repo):** a pure static site, deployed to **Cloudflare Pages**.
- **Tier 2 (deferred, seam in place):** live server endpoints for the newsletter
  signup and contact forms. Both forms ship now and go live when Tier 2 lands —
  see [Tier 2](#tier-2--whats-deferred).

> **Editing this site with an AI agent?** Point it at **[`SKILL.md`](./SKILL.md)** —
> a self-contained authoring procedure (the content contract, the per-type recipes,
> and the validation gate to run before committing). This README is the *reference*;
> `SKILL.md` is the *loop*.

---

## Table of contents

- [Quickstart](#quickstart)
- [How it's organized](#how-its-organized-engine-vs-content)
- [Adding your content](#adding-your-content) — the frontmatter contract
- [Configuration](#configuration) — site URL, leads, theme/nav/footer
- [Theming guide](#theming-guide) — every CSS variable, what it controls, how to do a full palette swap
- [Legal pages](#legal-pages-privacy--terms) — Privacy Policy & Terms of Use
- [Contact form](#contact-form) — the static form + how to wire it to actually send email
- [Validating your structured data](#validating-your-structured-data)
- [Deploying to Cloudflare Pages](#deploying-to-cloudflare-pages)
- [Tier 2 — what's deferred](#tier-2--whats-deferred)
- [For developers / AI editors](#for-developers--ai-editors) — architecture & the contract
- [The design decisions (DDs)](#the-design-decisions-that-govern-this-repo)

---

## Quickstart

```sh
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build -> dist/
npm run preview  # serve the built dist/ locally
```

Requires **Node >= 22.12**.

Out of the box the site builds with **example content** (a fictional author,
three sample books, one series, one theme). Everything under `src/content/` is
placeholder — delete it and drop in your own. See [Adding your content](#adding-your-content).

---

## How it's organized (engine vs. content)

The repo is split into two zones on purpose:

| Zone | Path | Who owns it |
|------|------|-------------|
| **Engine** | `src/` (layouts, components, `lib/`, page templates, schemas) | The template. Pull upstream to get fixes/features. |
| **Content** | `src/content/` + `src/config.ts` | **You.** Your books, series, and identity. Stays conflict-free on upstream pulls. |

The one rule: **edit your content and `src/config.ts`; leave the rest to the engine.**
If you find yourself changing engine code to make content work, that's usually a
sign a field belongs in the schema instead — see [For developers](#for-developers--ai-editors).

---

## Adding your content

All content lives in `src/content/`, one folder per collection. Each file is
Markdown with a YAML frontmatter block (the structured part) and optional body
text below. **The frontmatter is validated by a Zod schema** (`src/content.config.ts`)
— an invalid or missing field **fails the build with a clear error**, by design.
That schema is the single source of truth; the tables below mirror it, but if the
two ever disagree, **the schema wins**.

> **Note for AI editors:** do not guess field names. Read `src/content.config.ts`,
> match it exactly, and then run the [validation gate](#validating-your-structured-data).
> A build can pass while emitting subtly wrong structured data (e.g. a canonical
> URL on the wrong node) — the gate, not the build, is what proves correctness.

### Author — `src/content/author/<slug>.md`

Your identity. This is where the **canonical `Person` node** lives (at
`{siteUrl}/about#<slug>`); every book references it by `@id`, never re-defining it.
Co-authors each get their own file here.

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | ✅ | Drives the canonical `@id` (`{siteUrl}/about#<slug>`). Stable — don't change it casually. |
| `name` | ✅ | Display / legal author name. |
| `alternateName` | | Array of pen names / initials, e.g. `["S. Voss"]`. |
| `bio` | ✅ | Prose bio; also feeds the About page and the (truncated) homepage blurb. |
| `photo` | | Path to an image, e.g. `./sera.jpg`. Optional. |
| `url` | ✅ | Your canonical author URL (usually your site root). |
| `sameAs` | | Array of URLs that disambiguate you: Wikipedia/Wikidata, Goodreads author page, socials. Strongly recommended for GEO. |
| `email` | | Optional contact email. |

### Book — `src/content/books/<slug>.md` (or `<slug>/index.md` with a local cover)

```yaml
---
title: "The Long Dark Between"
subtitle: "A Novel of the Drift"        # optional
slug: "the-long-dark-between"
description: "When the last generation ship loses its ansible link..."  # the blurb — required
cover: "./cover.png"                     # required — every book has a cover
authors:                                 # ARRAY, min 1 — co-author-safe (DD-001)
  - "malorie"                            #   each entry is an author SLUG (references src/content/author/)
series: "the-cinder-cycle"               # optional — a series slug
seriesPosition: 2                        # optional — order within the series
datePublished: "2024-03-05"
language: "en"                           # default: en
genres: ["science fiction", "hard sci-fi"]
editions:                                # ARRAY, min 1 — at least one buy link
  - format: "ebook"                      #   ebook | paperback | hardcover | audiobook
    retailer: "Amazon"
    url: "https://.../buy/ebook"         #   the BUY LINK lives on the edition (-> schema Offer.url), NOT on the book (DD-005)
    price: "4.99"                        #   optional
    currency: "USD"                      #   default USD
    isbn: "978..."                       #   optional
    asin: "B0..."                        #   optional
comps:                                   # optional — "comparable titles", rendered inline on the book page
  - name: "The Expanse"
    hook: "found-family crew under existential ship-systems pressure"  # REQUIRED, min 20 chars — never a bare name
    sameAs: ["https://en.wikipedia.org/wiki/The_Expanse_novel_series"] # optional — disambiguates the real work
---
Optional long-form body copy about the book goes here.
```

Two rules the schema enforces that matter for structured data:
- **`authors` is always an array** (min 1). A solo book is `["you"]`; a two-hander
  is `["you", "coauthor"]`. This is DD-001 — the model is co-author-safe everywhere.
- **`editions` is always an array** (min 1), and each edition's `url` is its
  **buy link**. This becomes a schema.org `Offer.url`, *not* the Book's `url`.
  The Book's own canonical `url` is its page on your site (the engine sets it). This
  is DD-005 — a retailer link in `Book.url` would falsely claim the retailer as the
  canonical home of the work.

### Series — `src/content/series/<slug>.md`

A named sequence of books. Membership is **derived from the books** (any book with
`series: "<this-slug>"`), so you don't list books here — you tag them on the book.

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | Display name, e.g. "The Cinder Cycle". |
| `slug` | ✅ | Used in the URL (`/series/<slug>`) and referenced by books. |
| `description` | ✅ | |
| `authors` | ✅ | Array of author slugs (min 1). |
| `cover` | | Optional image. |
| `comps` | | Same shape as book comps. |

### Theme (hub) — `src/content/hubs/<slug>.md`

A curated collection of books "about" a topic (a `CollectionPage` in schema.org).
Route is `/themes/<slug>` (the collection folder is named `hubs`; the URL says
`themes`).

```yaml
---
name: "Human-AI Partnership"
slug: "human-ai-partnership"
description: "Books exploring what it means when minds depend on each other..."
about:                                   # ARRAY, min 1 — the DefinedTerm(s) this hub is about
  - term: "Artificial intelligence in fiction"
    sameAs: "https://en.wikipedia.org/wiki/Artificial_intelligence_in_fiction"  # optional but recommended
  - term: "Human–AI collaboration"
books:                                   # ARRAY, min 1 — ORDERED list of book slugs (becomes an ItemList)
  - "the-cinder-reach"
  - "the-long-dark-between"
---
```

Unlike a series (membership derived from books), a hub's `books` list is **explicit
and ordered** — you're hand-curating a themed reading list.

### Event — `src/content/events/<slug>.md`

Appearances, launches, signings. All events render on `/events`.

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | |
| `slug` | ✅ | |
| `description` | ✅ | |
| `startDate` | ✅ | ISO date/datetime. |
| `endDate` | | Optional. |
| `location` | | Free text (venue / city). |
| `url` | | Event page / ticket link. |
| `eventAttendanceMode` | | `online` \| `offline` \| `mixed` (default `offline`). |

> The `events/` folder ships empty (just a `.gitkeep`). Add a file to populate `/events`.

---

## Configuration

A few things worth setting before deploying. The first is the classic
silent-failure trap — the build passes with placeholders, but your structured data
is wrong.

### 1. Your site URL (set it in TWO places)

Every canonical `@id` in the JSON-LD is built from your site URL. Left as
`https://example.com`, the build **succeeds** but emits `@id`s on the placeholder
domain — valid-looking, silently wrong. Set your real production URL in **both**:

- **`astro.config.mjs`** → `site: 'https://yourdomain.com'`
- **`src/config.ts`** → `siteConfig.siteUrl: 'https://yourdomain.com'`

Keep them identical.

### 2. Site slogan — `src/config.ts`

```ts
slogan: undefined,   // e.g. 'Hard science fiction for readers who like their futures plausible.'
```

A short line shown at the very top of the homepage, above "Latest release" —
plain display text, not a schema.org entity, so it lives in config rather than
`src/content/`. Optional — leave `undefined` to skip it. (Not to be confused
with `footer.tagline` below, which is a separate, shorter line under the footer
links.)

### 3. Lead-capture provider — `src/config.ts`

```ts
leads: {
  provider: 'mailerlite',   // 'mailerlite' | 'emailoctopus'
  doubleOptIn: true,        // single vs. double opt-in
  groups: [],               // provider list/group IDs
}
```

This selects which adapter the newsletter form uses. The signup **endpoint** is
Tier 2 (see below); the choice is wired now so it's ready.

### 4. Site chrome — theme, header, nav, footer (`src/config.ts`)

Also in `src/config.ts`, alongside `siteUrl` and `leads`:

```ts
theme: {
  mode: 'dark',        // 'dark' | 'light' — the two built-in palettes
  accent: undefined,   // e.g. '#ffb454' — override just the accent color, optional
},
header: {
  logo: {
    src: undefined,    // e.g. '/logo.svg' — a path under public/. Omit for a text wordmark.
    alt: undefined,    // defaults to the author's name if unset
  },
  layout: 'left',      // 'left' (brand left, nav right) | 'centered' (brand centered, nav underneath)
},
nav: [
  { label: 'Series', href: '/series' },
  { label: 'About', href: '/about' },
  // add { label: 'Contact', href: '/contact' } once you have a contact page
],
footer: {
  tagline: undefined,  // optional one-line blurb under the footer links
  links: [],           // extra footer links beyond the built-in Privacy/Terms
},
```

This is an **author-time** choice, not a visitor-facing toggle — if you're an AI
building this site for an author, ask them light or dark, set `theme.mode`, and
optionally tweak `theme.accent` to taste. No CSS editing required. The palettes
themselves live in `src/styles/theme.css` as CSS custom properties, if you do
want to go further (e.g. add a third palette).

**Logo:** if the author has brand artwork, drop it in `public/` (e.g.
`public/logo.svg`) and point `header.logo.src` at it (`'/logo.svg'` — Astro serves
`public/` at the site root). Leaving `logo.src` unset is the default and needs no
asset at all — the header falls back to the author's name as a plain text
wordmark. Either way, `header.layout` controls whether the brand sits to the left
with the nav on the right (`'left'`, the classic look) or centered with the nav
stacked underneath it (`'centered'`).

`/privacy` and `/terms` are built in and always linked from the footer — see
[Legal pages](#legal-pages-privacy--terms) below to edit their text.

For anything beyond an accent tweak — a full palette swap, a third theme, or
changing the fonts — see [Theming guide](#theming-guide) below.

**A few things the engine handles automatically, with no config needed:**
- **Cover images are capped at 400px tall** (`.cover` in `theme.css`) wherever a
  full book/series cover renders — the raw source art is print-resolution and
  would otherwise blow out the layout. Series-list thumbnails are capped
  separately at 150px tall (`.book-thumb`).
- **Any book cover shown on the homepage or the series list page is clickable**,
  linking to the book's page — same destination as the adjacent title link (the
  cover's own link is marked `aria-hidden`/non-tabbable so screen readers don't
  announce the same link twice back to back).
- **A book that belongs to a series gets a breadcrumb** back to that series' page,
  rendered above the title (`Base.astro`'s `breadcrumbs` slot). Books with no
  series show no breadcrumb.
- **Every off-site link opens in a new tab** with `rel="noopener noreferrer"` —
  retailer buy links, `sameAs` social/Wikipedia/Goodreads links, event ticket
  links. Internal links (nav, footer legal links, breadcrumbs) are untouched.
  The rule (`src/lib/links.ts`) is a simple one: any `http(s)://` absolute URL
  counts as off-site; every internal route in this repo is a root-relative path,
  so it never misfires.
- **Series listings (`/series` and a series' own `/series/<slug>` page) show
  each book as a row**: a clickable 150px thumbnail, the title, a "Book N"
  label (from the book's `seriesPosition`, omitted if unset), and the first
  ~70 words of the description with a "more" link to the book's own page for
  the rest. One shared component (`src/components/BookListItem.astro`) drives
  both surfaces, so they can't drift out of sync.
- **The author's `photo`** (if set — see the Author table above) renders at up
  to 220px tall next to their bio, in the same cover-left/body-right layout as
  a book card, on both the homepage's "About the author" teaser and their own
  section on `/about`. It's also already emitted as the schema.org `Person`'s
  `image` (`src/lib/jsonld.ts`) — no extra config needed for structured data,
  just add the `photo` field to the author's frontmatter.

### 5. Secrets — `.env` (Tier 2)

Copy `.env.example` to `.env` and fill in the block for your chosen provider
(`MAILERLITE_API_KEY`, or `EMAILOCTOPUS_API_KEY` + `EMAILOCTOPUS_LIST_ID`). These
are only consumed once Tier 2's endpoint is live. **Never commit real values** —
set them as Cloudflare Pages secrets in production.

---

## Theming guide

`theme.mode` + `theme.accent` in `src/config.ts` (see [Configuration](#configuration)
above) cover the two things an author is likely to want without touching CSS at
all. Everything below is for going further — a full palette swap, a third theme,
or different fonts.

Both palettes live in **`src/styles/theme.css`** as CSS custom properties, scoped
under `:root[data-theme="dark"]` and `:root[data-theme="light"]`. `Base.astro` sets
`data-theme` on `<html>` from `siteConfig.theme.mode`, and inlines `--accent`/
`--accent-contrast` overrides in a `<style>` tag in `<head>` if `theme.accent` is
set — so an accent override always wins over the palette default, and nothing
else needs to change.

### The variables

| Variable | Controls | Dark default | Light default |
|---|---|---|---|
| `--bg` | Page background | `#0b0e14` | `#fbfaf7` |
| `--bg-elevated` | Header/footer bg, `.card` bg (book/series cards, etc.) | `#12161f` | `#ffffff` |
| `--text` | Body text, headings, wordmark | `#e8eaf0` | `#1b1f27` |
| `--text-muted` | Subtitles, footer text, legal "last updated" line | `#9aa3b5` | `#5b6472` |
| `--accent` | Links, nav hover, wordmark hover | `#5fd3ff` | `#1c5cff` |
| `--accent-contrast` | Text color drawn *on top of* an accent-colored fill (currently unused by any filled component, but kept so a future button/badge has a correct contrast color ready) | `#04141a` | `#ffffff` |
| `--border` | Header/footer border, `.card` border | `#232838` | `#e3e1da` |
| `--shadow` | Cover image drop shadow (`.card img`, `.cover`) | `0 8px 24px rgba(0,0,0,0.4)` | `0 8px 24px rgba(20,20,20,0.08)` |

### Doing a full palette swap

Edit the values inside the relevant `:root[data-theme="..."] { ... }` block in
`theme.css` directly — e.g. to retheme dark mode around a purple accent instead
of cyan, change `--accent` and `--accent-contrast` together (contrast must stay
readable against the new accent, since nothing currently auto-computes it).
Keep `--bg` vs `--bg-elevated` and `--text` vs `--text-muted` each a step apart in
contrast — that's what gives the header/footer/cards visual separation from the
page body.

### Adding a third theme

The two palettes aren't hardcoded elsewhere — `Base.astro` just writes whatever
string is in `theme.mode` into `data-theme`. To add e.g. a `"sepia"` theme:

1. Add a `:root[data-theme="sepia"] { ... }` block to `theme.css` defining all
   eight variables above.
2. Loosen the `theme.mode` type in `src/config.ts` (and its Zod/TS type if one
   constrains it to `'dark' | 'light'`) to include `'sepia'`.
3. Set `theme.mode: 'sepia'`.

No component code needs to change — components only ever reference the CSS
variables, never a mode name directly.

### Fonts

Not yet a `config.ts` setting — change the two `font-family` stacks directly in
`theme.css`: the `body` rule (UI/body text — currently a system-font stack) and
the `h1, h2, h3, h4` rule (headings — currently Georgia/serif, deliberately
distinct from body for a "book" feel). If you want this configurable without a
CSS edit, that's a reasonable follow-up: add `theme.fontBody`/`theme.fontHeading`
to `config.ts` and inline them the same way `Base.astro` already inlines the
accent override.

---

## Legal pages (Privacy & Terms)

`/privacy` and `/terms` ship built in, sourced from a `legal` content collection
(`src/content/legal/privacy.md`, `src/content/legal/terms.md`) — edit them like
any other content, no engine changes needed. They're plain long-form pages: no
JSON-LD is emitted for them (they aren't a schema.org entity), and their frontmatter
contract is just `title`, `slug` (`'privacy'` or `'terms'` — fixed, one file each),
and `updated` (a date, so a stale unreviewed policy is visible, not silent).

**Both ship with generic, GDPR-aware starter text and an explicit banner saying
so.** They are not legal advice and have not been reviewed by a lawyer — have them
reviewed for your jurisdiction and actual data practices (what your lead-capture
provider collects, your hosting provider, any analytics you add later) before
relying on them. Update the `updated` frontmatter date whenever you revise the text.

Both pages are always linked from the site footer automatically — nothing else to wire up.

---

## Contact form

`/contact` ships now (Tier 1) as a static page with a real form — see
`src/components/ContactForm.astro`. It does **not** send email yet: the form
POSTs to `/api/contact`, which doesn't exist until you wire Tier 2, same
deferred status as `/api/subscribe` (see [Configuration](#configuration)
above and [Tier 2](#tier-2--whats-deferred) below).

**Why there's no `mailto:` link or visible email address anywhere on the
page:** any address in the page source gets scraped by spam bots within days.
The whole design point of routing this through a server-side endpoint is that
the destination inbox is a **secret**, never rendered to the browser and never
committed to the repo.

**Cloudflare's actual answer to "can a static Pages site email a form
submission":** yes, via a Cloudflare Pages Function (a small Worker that runs
at `/api/*` once you flip to Tier 2's server output). Cloudflare doesn't send
mail itself, so the Function calls a transactional email API. Concretely:

1. **Flip to Tier 2** — `output: 'server'` + the Cloudflare adapter in
   `astro.config.mjs` (see [Tier 2](#tier-2--whats-deferred)).
2. **Write `src/pages/api/contact.ts`** as a Pages Function: read the form
   POST, reject silently if the honeypot (`company`) field is filled, then
   call an email API with the message and the visitor's supplied name/email
   as the reply-to.
3. **Pick an email API and verify a sending domain** — MailChannels' free
   integration for Workers/Pages **ended June 2024**; don't follow older
   tutorials that assume it's still free. The currently-supported paths
   Cloudflare's own docs point to are **Resend** or **Postmark**. Resend is
   the simpler onboarding (free tier, DKIM/DMARC setup via a few DNS records
   on your existing Cloudflare-managed domain) and has a published DPA/SCCs
   for GDPR — reasonable for a starter template, though its account
   metadata/logs are US-stored even if you send from an EU region. If full EU
   data residency matters for your author's situation, that's worth a look
   before committing.
4. **Set secrets, don't commit them** — `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`
   (a verified sender on your domain), `CONTACT_TO_EMAIL` (the real inbox —
   this is the value that must never appear in `config.ts` or any page). Set
   these as Cloudflare Pages **secrets** in the dashboard (or `wrangler pages
   secret put`), and locally in `.env` (see `.env.example`) — never commit
   real values.
5. **Add spam gating beyond the honeypot** once this is a live endpoint —
   Cloudflare Turnstile is the natural pairing (free, no CAPTCHA puzzle for
   real users, verified server-side in the same Function before you call the
   email API). `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` placeholders are
   already in `.env.example` for when you add it.

None of the above is required for Tier 1 — the page and form render and
validate fine without it. It's only needed once you actually want submissions
to reach an inbox.

---

## Validating your structured data

The build catches *schema* errors (a missing required field). It does **not**
catch *structured-data* errors — a dangling reference, a canonical URL on the wrong
node, an author `@id` that resolves nowhere. Those pass `astro build` silently and
are exactly what breaks GEO.

The enforcement is a **SHACL validation gate** (see the companion `schema-validator`
setup). The workflow:

1. `npm run build`
2. For each built page in `dist/`, collect **all** `<script type="application/ld+json">`
   blocks on that page and merge them (a crawler reads them together — the page's
   `WebSite` node and its entity node live in separate blocks).
3. POST the merged per-page graph to the validator.
4. It must return **SUCCESS** with **zero dangling references** on every page type
   (home, about, book, series, theme, events).

The gate enforces the two rules that make this product work:
- **DD-001:** every `author`/`publisher` reference resolves to a `Person` (a named
  stub `{@type, @id, name}` is accepted — see the DDs).
- **DD-005:** the primary Book carries its own canonical `url`; retailer links are
  `Offer.url` on editions.

> If you change engine code that touches JSON-LD, **the gate is your proof**, not
> a green build. It is designed to fail loudly on the silent-failure classes above.

---

## Deploying to Cloudflare Pages

Tier 1 is a **static** site (`output: 'static'`), so it deploys to Cloudflare
Pages as plain built assets — no Worker runtime, no bindings.

**Before you deploy:** set your real site URL in both places (see
[Configuration](#configuration)).

### Option A — Git integration (recommended for clone-and-edit)

Cloudflare builds and deploys on every push.

1. Push this repo to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
   pick the repo.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** set an env var `NODE_VERSION` = `22.12` (or newer) so the
     build host matches the project's requirement.
4. **Save and Deploy.** Cloudflare builds `dist/` and serves it. Every push to the
   production branch redeploys; other branches get preview URLs.
5. Add your custom domain under the project's **Custom domains** tab.

`wrangler.toml` already declares `pages_build_output_dir = "./dist"` for this flow.

### Option B — Direct upload with Wrangler (manual / CI)

```sh
npm install -g wrangler      # or npx wrangler
npm run build
wrangler pages deploy dist   # first run prompts to create/select the Pages project
```

Use this for local one-off deploys or a custom CI pipeline.

---

## Tier 2 — what's deferred

Two **forms** ship in Tier 1 as static markup and POST to endpoints that don't
exist yet: the newsletter form (`SubscribeForm` → `/api/subscribe`) and the
contact form (`ContactForm` → `/api/contact`, see [Contact form](#contact-form)
for the fuller Cloudflare-specific writeup). Both **endpoints** are intentionally
deferred: they're server routes (`prerender = false`; subscribe additionally
imports `cloudflare:workers`) and require SSR, which Tier 1's static build
deliberately doesn't enable. Until Tier 2 lands, both forms are inert.

To bring them online (Tier 2):
1. In `astro.config.mjs`, switch to `output: 'server'` + `adapter: cloudflare()`
   (the commented block is right there).
2. In `wrangler.toml`, uncomment the Workers/D1 block.
3. Add `src/pages/api/subscribe.ts` (the lead-capture adapters under
   `src/lib/leads/` are already present) and `src/pages/api/contact.ts` (a
   Pages Function calling Resend/Postmark — see [Contact form](#contact-form)).
4. Set the provider secrets as Cloudflare Pages/Workers secrets — for the
   contact form specifically: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`,
   `CONTACT_TO_EMAIL`, and optionally `TURNSTILE_SECRET_KEY`.

At that point Tier 1 stops being a pure static deploy and becomes an SSR/hybrid
Cloudflare deploy — which is why it's a deliberate tier boundary, not a default.

---

## For developers / AI editors

The engine is small and layered. If you're modifying the code (or you're an AI
asked to), this is the map — and the contract you must not break.

```
src/
  content.config.ts     # THE CONTRACT: Zod schemas for every collection. Source of truth.
  config.ts             # author-editable behavior (site URL, leads provider, theme/nav/footer)
  styles/theme.css       # the two built-in palettes (CSS custom properties) + base layout/type
  lib/
    ContentSource.ts     # the seam: the interface templates + JSON-LD depend on
    sources/FileSource.ts# reads content collections -> ContentSource (co-author aware)
    jsonld.ts            # THE ENGINE: builds the schema.org @graph (nodes + named stubs)
    leads/               # MailerLite / EmailOctopus adapters (Tier 2)
  layouts/Base.astro     # emits the sitewide WebSite node (+ publisher named stub); wraps
                         #   every page in Header/Footer and applies theme.mode/accent
  components/            # JsonLd, SubscribeForm, ContactForm, CompsBlock, Header, Footer
  pages/                 # route templates: index, about, books/[slug], series/[slug],
                         #   series/index (nav landing page), themes/[slug], events/index,
                         #   privacy, terms (legal collection, no JSON-LD), contact (static
                         #   form shell, no JSON-LD; /api/contact is Tier 2, not yet written)
```

**The rules that make the structured data correct** (violating them is a silent
failure the build won't catch — run the gate):

1. **One canonical definition, referenced everywhere else (DD-001).** Each entity
   (a `Person`, a `Book`) is fully defined **once**, at its canonical `@id`. Every
   other reference to it is a **named stub** — `{@type, @id, name}` — never a bare
   `@id` (which dangles for consumers that don't chase `@id`), and never a second
   full definition (which creates two competing authorities). The canonical `Person`
   lives on `/about`; the homepage shows the author blurb as **display text only** and
   emits no second Person node.

2. **Authors are always an array** (co-author-safe), everywhere — schema, seam,
   and emission.

3. **Canonical URL discipline (DD-005).** A Book's `url` is its page on this site.
   Retailer buy-links are `Offer.url` on editions, never `Book.url`.

4. **`site` is load-bearing.** `jsonld.ts` builds every absolute `@id` from
   `import.meta.env.SITE`. A wrong/placeholder `site` produces wrong `@id`s that
   pass the build.

5. **Prove changes with the gate, not the build.** Merge all `ld+json` blocks per
   page and validate; require SUCCESS + zero dangling refs across every page type.

**When you pull upstream:** engine changes land in `src/` (outside `src/content/`);
your content stays untouched. If an upstream schema change requires a content
migration, it'll be called out — re-run the gate after migrating.

---

## The design decisions that govern this repo

The authoritative design decisions (DD-001 … DD-005) are recorded in the project's
documentation. Two you'll meet immediately:

- **DD-001 — Identity model.** Canonical `Person` at `/about#<slug>`; reference by
  `@id` + **named stub** everywhere else; authors are arrays (co-author-safe).
- **DD-005 — Editions & offers.** Primary Book owns the single on-site canonical
  `url`; editions carry `bookFormat`/`isbn` and `offers`, with the retailer link as
  `Offer.url`.

Where a DD and any older doc/scaffold disagree, **the DD wins.**

---

## License

See [LICENSE](LICENSE).
