---
# ============================================================================
# EXAMPLE CONTENT — a PREORDER book, exercising every field in the `books`
# schema (see src/content.config.ts) so a builder (human or AI) has one file
# that shows what's possible, not just what's required.
#
# What makes this a preorder: NOTHING is toggled explicitly. It's purely that
# `datePublished` below is a future date. That one fact alone drives, at
# build time: Offer.availability -> schema.org/PreOrder in the JSON-LD,
# exclusion from the homepage "Latest release" slot, a slot in the
# "Coming soon" row, a slide in the hero slideshow, and a PRE-ORDER badge
# on series listings and this book's own page. See src/lib/date.ts
# (isFutureRelease) for the single source of truth.
#
# NOTE for whoever maintains this repo: the date below will eventually pass
# and this book will quietly become "released" like any other — that's fine,
# it's expected, and it's actually a decent way to confirm the preorder->
# released transition works. Bump the date forward again if you want a live
# preorder example to keep demonstrating that state.
# ============================================================================

title: "The Ember Horizon"
subtitle: "Book Three of the Cinder Cycle"
slug: "the-ember-horizon"

# The blurb. Required, min 1 char, no max — the homepage/series listings
# truncate long blurbs themselves (see BookListItem.astro / truncateWords),
# so write this as the FULL back-cover-style description, not pre-shortened.
description: "The Ember Horizon has been dark for forty years — a colony beacon gone silent the same week the Cinder Reach swallowed its ark ships. When salvage captain Wren Talia picks up its signal again, reactivated and broadcasting a countdown, she has to decide whether she's answering a distress call or walking into the trap that killed everyone who answered the first one. A hard-SF thriller about legacy, false rescue, and the reach of a war three generations old."

# `cover` is REQUIRED — image() from astro:content, resolved relative to
# this file. No book ships coverless. Using a subfolder (index.md + cover.png
# together) rather than a flat `slug.md` + `slug-cover.png` pair — both
# layouts work with the glob loader, pick whichever keeps a book's own
# folder tidy when it has more assets (this one just has the cover).
cover: "./cover.png"

# One or more authors. Always an array, even for a single author — the
# schema is co-author-safe by design (DD-001). Values are content-collection
# slugs referencing src/content/author/*, not free text.
authors:
  - "malorie"

# Optional: series membership + position. Omit both entirely for a
# standalone book (see signal-and-ash for that case). This one is Book 3
# of the-cinder-cycle, following the-cinder-reach (1) and
# the-long-dark-between (2).
series: "the-cinder-cycle"
seriesPosition: 3

# THE field that makes this a preorder. Must be a real, parseable date
# (z.coerce.date()) — bare YYYY-MM-DD is parsed as UTC midnight, which is
# why src/lib/date.ts formats dates in UTC too (avoids a same-day-early
# local-time rollback for readers west of UTC). Set this in the PAST and
# this book behaves exactly like every other released title — no other
# field changes required.
datePublished: "2026-12-01"

language: "en"

# Free-text genre tags. No controlled vocabulary enforced — keep them
# lowercase and consistent with other books' tags so they read cleanly
# wherever genres get listed together.
genres:
  - "science fiction"
  - "hard sci-fi"
  - "space opera"
  - "military science fiction"

# At least one edition required. This example deliberately uses FOUR
# formats and both optional identifier fields (isbn / asin) — neither is
# used by the two existing example books, so this is the only place in the
# repo that shows their shape. Set a preorder book's edition `url` to
# wherever the actual preorder listing lives (Amazon preorder page, etc.);
# nothing schema-wise distinguishes a "preorder link" from a normal buy
# link — the PreOrder signal comes entirely from datePublished, not here.
editions:
  - format: "ebook"
    retailer: "Amazon"
    url: "https://example.com/buy/the-ember-horizon-ebook"
    price: "6.99"
    currency: "USD"
    asin: "B0EXAMPLE01"
  - format: "paperback"
    retailer: "Amazon"
    url: "https://example.com/buy/the-ember-horizon-paperback"
    price: "18.99"
    currency: "USD"
    isbn: "978-0-00-000000-1"
  - format: "hardcover"
    retailer: "Barnes & Noble"
    url: "https://example.com/buy/the-ember-horizon-hardcover"
    price: "27.99"
    currency: "USD"
    isbn: "978-0-00-000000-2"
  - format: "audiobook"
    retailer: "Audible"
    url: "https://example.com/buy/the-ember-horizon-audio"
    price: "19.99"
    currency: "USD"
    asin: "B0EXAMPLE02"

# Optional "if you like X" comps, rendered on the book page. `hook` is
# REQUIRED (min 20 chars) — a bare comp name with no descriptive hook fails
# the build. This example uses two, matching the pattern set by
# the-cinder-reach.md.
comps:
  - name: "Dark-signal / distress-beacon thrillers"
    hook: "a decades-silent beacon switching back on mid-countdown, in the vein of Alastair Reynolds' Revelation Space-style derelict mysteries"
    sameAs:
      - "https://en.wikipedia.org/wiki/Alastair_Reynolds"
  - name: "Legacy-of-war military SF"
    hook: "a conflict three generations gone that still books the appointments of the living, echoing the multigenerational fallout in Old Man's War"
    sameAs:
      - "https://en.wikipedia.org/wiki/Old_Man%27s_War"
---

Full back-cover copy / long description would go here in a real site. This
paragraph is the body content of the page, separate from the `description`
frontmatter field used for the blurb/JSON-LD — the schema and templates
don't require this body to contain anything in particular right now, but
it's here for a future long-form "excerpt" or "chapter one" treatment.
