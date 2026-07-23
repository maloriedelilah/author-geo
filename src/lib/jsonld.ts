// Builds schema.org JSON-LD as ONE @graph with stable @ids so entities cross-reference
// instead of duplicating. Derived from ContentSource -> can't drift from visible content.
//
// Identity spine (DD-001): every entity has ONE canonical @id anchored to its own
// home page, where its FULL node is defined exactly once. Everywhere else it is
// referenced by that @id PLUS a minimal named stub (namedStub) — never a bare @id
// (which dangles the moment the referencing page doesn't also happen to supply the
// full node) and never a re-inlined full node (which would duplicate + drift).
import type { Author, Book, Series, Hub, EventItem } from './ContentSource';
import { isFutureRelease } from './date';

const SITE = (path = '') => new URL(path, import.meta.env.SITE).toString();
// Per-author, About-anchored — the About page is the canonical Person home (DD-001).
export const authorId = (slug: string) => SITE(`/about#${slug}`);
export const bookId = (slug: string) => SITE(`/books/${slug}#book`);
export const seriesId = (slug: string) => SITE(`/series/${slug}#series`);

// Minimal cross-reference: `{@type, @id, name}`. Just enough that the page's JSON-LD
// is valid + useful STANDALONE, while the shared @id unifies with the full node at
// its canonical home for a consumer that reads the whole site. Used for every
// reference site (WebSite.publisher, Book.author, Series.author, ...) — never a bare @id.
export function namedStub(id: string, name: string, type = 'Person') {
  return { '@type': type, '@id': id, name };
}

// FULL Person node — emitted EXACTLY ONCE, on the About page (each author/co-author's
// canonical home per DD-001). Every other reference site uses namedStub(authorId(slug), name)
// instead of calling this again.
export function authorNode(a: Author) {
  return { '@type': 'Person', '@id': authorId(a.slug), name: a.name,
    alternateName: a.alternateName, description: a.bio, url: a.url,
    image: a.photo, sameAs: a.sameAs };
}

export function bookNode(
  b: Book,
  opts: { series?: { slug: string; name: string }; authors: { slug: string; name: string }[] },
) {
  return { '@type': 'Book', '@id': bookId(b.slug), name: b.title,
    // DD-005/#3: the primary Book owns the single on-site CANONICAL url (its own
    // page). Editions do NOT carry url — their retailer buy-links live in Offer.url.
    url: SITE(`/books/${b.slug}`),
    ...(b.subtitle ? { alternateName: b.subtitle } : {}),
    // Co-author-safe: an ARRAY of named stubs, one per author (DD-001) — never a
    // bare @id, never the full Person node re-inlined here.
    author: opts.authors.map((a) => namedStub(authorId(a.slug), a.name)),
    description: b.description,
    inLanguage: b.language, datePublished: b.datePublished.toISOString().slice(0, 10),
    genre: b.genres, image: b.cover,
    // isPartOf references the series by a NAMED STUB (@type+@id+name), not a bare
    // @id — DD-001: must resolve standalone on the book page (the full BookSeries
    // node lives once on its own /series/<slug> page).
    ...(opts.series ? { isPartOf: namedStub(seriesId(opts.series.slug), opts.series.name, 'BookSeries'),
         position: b.seriesPosition } : {}),
    workExample: b.editions.map((e) => ({ '@type': 'Book', bookFormat: e.format,
      isbn: e.isbn, potentialAction: undefined,
      // Preorder support: derived from datePublished, never a separate field
      // (see isFutureRelease's doc comment in lib/date.ts) — a future-dated
      // book automatically emits PreOrder here and flips to InStock on its
      // own the moment the site rebuilds after that date passes.
      offers: { '@type': 'Offer', url: e.url, price: e.price, priceCurrency: e.currency,
        availability: isFutureRelease(b.datePublished)
          ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock' } })) };
}

export function seriesNode(
  s: Series,
  memberIds: string[],
  authors: { slug: string; name: string }[],
) {
  return { '@type': 'BookSeries', '@id': seriesId(s.slug), name: s.name,
    description: s.description,
    author: authors.map((a) => namedStub(authorId(a.slug), a.name)),
    hasPart: memberIds.map((id) => ({ '@id': id })) };
}

// Hub = CollectionPage.about[DefinedTerm] + mainEntity: ItemList of positioned books.
// Confirmed from live aeon14.com/themes pattern.
// members carry {id, name} so each ItemList entry emits a NAMED STUB (@type+@id+
// name), never a bare @id — DD-001: the reference must resolve standalone on this
// page (the full Book node lives once on its own /books/<slug> page).
export function hubGraph(h: Hub, members: { id: string; name: string }[]) {
  return { '@type': 'CollectionPage', name: h.name, description: h.description,
    about: h.about.map((t) => ({ '@type': 'DefinedTerm', name: t.term, sameAs: t.sameAs })),
    mainEntity: { '@type': 'ItemList', numberOfItems: members.length,
      itemListElement: members.map((m, i) => ({ '@type': 'ListItem',
        position: i + 1, item: namedStub(m.id, m.name, 'Book') })) } };
}

// Events currently have no standalone per-event page (Tier-1 scope: one listing
// page at /events), so each Event's canonical @id is anchored to that listing
// page rather than its own route — same "one canonical home" discipline as the
// other builders (DD-001), just with a shared home instead of a per-entity one.
export const eventId = (slug: string) => SITE(`/events#${slug}`);

// FULL Event node. location is a plain string on EventItem (no separate content
// collection to key a Place off of), so it is embedded directly. If a future
// revision adds an organizer/performer Person reference, it MUST use
// namedStub(authorId(slug), name) — never a bare @id or a second full Person node.
export function eventNode(e: EventItem) {
  return { '@type': 'Event', '@id': eventId(e.slug), name: e.name,
    description: e.description,
    startDate: e.startDate.toISOString(),
    ...(e.endDate ? { endDate: e.endDate.toISOString() } : {}),
    ...(e.location ? { location: { '@type': 'Place', name: e.location } } : {}),
    ...(e.url ? { url: e.url } : {}),
    eventAttendanceMode: `https://schema.org/${
      e.eventAttendanceMode === 'online' ? 'OnlineEventAttendanceMode'
        : e.eventAttendanceMode === 'mixed' ? 'MixedEventAttendanceMode'
          : 'OfflineEventAttendanceMode'
    }` };
}

export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
