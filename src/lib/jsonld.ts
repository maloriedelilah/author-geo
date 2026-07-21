// Builds schema.org JSON-LD as ONE @graph with stable @ids so entities cross-reference
// instead of duplicating. Derived from ContentSource -> can't drift from visible content.
import type { Author, Book, Series, Hub } from './ContentSource';

const SITE = (path = '') => new URL(path, import.meta.env.SITE).toString();
export const authorId = () => SITE('#author');
export const bookId = (slug: string) => SITE(`/books/${slug}#book`);
export const seriesId = (slug: string) => SITE(`/series/${slug}#series`);

export function authorNode(a: Author) {
  return { '@type': 'Person', '@id': authorId(), name: a.name,
    alternateName: a.alternateName, description: a.bio, url: a.url,
    image: a.photo, sameAs: a.sameAs };
}

export function bookNode(b: Book, opts: { seriesSlug?: string } = {}) {
  return { '@type': 'Book', '@id': bookId(b.slug), name: b.title,
    ...(b.subtitle ? { alternateName: b.subtitle } : {}),
    author: { '@id': authorId() }, description: b.description,
    inLanguage: b.language, datePublished: b.datePublished.toISOString().slice(0, 10),
    genre: b.genres, image: b.cover,
    ...(opts.seriesSlug ? { isPartOf: { '@id': seriesId(opts.seriesSlug) },
         position: b.seriesPosition } : {}),
    workExample: b.editions.map((e) => ({ '@type': 'Book', bookFormat: e.format,
      isbn: e.isbn, potentialAction: undefined,
      offers: { '@type': 'Offer', url: e.url, price: e.price, priceCurrency: e.currency,
        availability: 'https://schema.org/InStock' } })) };
}

export function seriesNode(s: Series, memberIds: string[]) {
  return { '@type': 'BookSeries', '@id': seriesId(s.slug), name: s.name,
    description: s.description, author: { '@id': authorId() },
    hasPart: memberIds.map((id) => ({ '@id': id })) };
}

// Hub = CollectionPage.about[DefinedTerm] + mainEntity: ItemList of positioned books.
// Confirmed from live aeon14.com/themes pattern.
export function hubGraph(h: Hub, memberIds: string[]) {
  return { '@type': 'CollectionPage', name: h.name, description: h.description,
    about: h.about.map((t) => ({ '@type': 'DefinedTerm', name: t.term, sameAs: t.sameAs })),
    mainEntity: { '@type': 'ItemList', numberOfItems: memberIds.length,
      itemListElement: memberIds.map((id, i) => ({ '@type': 'ListItem',
        position: i + 1, item: { '@id': id } })) } };
}

export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
