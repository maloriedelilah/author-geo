// The single seam between the two tiers. Templates + JSON-LD depend ONLY on this.
// Tier 1 implements it with astro:content (FileSource). Tier 2 implements it with D1 (D1Source).
export interface Author { name: string; bio: string; url: string; sameAs: string[]; photo?: string; alternateName?: string[]; email?: string; }
export interface Edition { format: string; isbn?: string; asin?: string; retailer: string; url: string; price?: string; currency: string; }
export interface Comp { name: string; hook: string; sameAs?: string[]; }
export interface Book { title: string; subtitle?: string; slug: string; description: string; cover: string; datePublished: Date; language: string; genres: string[]; editions: Edition[]; comps: Comp[]; seriesSlug?: string; seriesPosition?: number; }
export interface Series { name: string; slug: string; description: string; cover?: string; comps: Comp[]; }
export interface Hub { name: string; slug: string; description: string; about: { term: string; sameAs?: string }[]; bookSlugs: string[]; comps: Comp[]; }
export interface EventItem { name: string; slug: string; description: string; startDate: Date; endDate?: Date; location?: string; url?: string; eventAttendanceMode: string; }

export interface ContentSource {
  getAuthor(): Promise<Author>;
  getBooks(): Promise<Book[]>;
  getBook(slug: string): Promise<Book | undefined>;
  getSeries(): Promise<Series[]>;
  getSeriesBySlug(slug: string): Promise<Series | undefined>;
  getHubs(): Promise<Hub[]>;
  getHub(slug: string): Promise<Hub | undefined>;
  getEvents(): Promise<EventItem[]>;
}
