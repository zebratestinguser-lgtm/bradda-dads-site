import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDate } from './format';

export type Album = CollectionEntry<'albums'>;

/** All albums, newest photos first. */
export async function getAlbums() {
  return (await getCollection('albums')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** When the photos were taken, for display: the dateLabel if set, else "12 December 2007". */
export const photoDate = (a: Album) => a.data.dateLabel ?? formatDate(a.data.date);

/** Short form for chips on cards: "Dec 2007" (or the dateLabel). */
export const photoDateShort = (a: Album) =>
  a.data.dateLabel ?? a.data.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Europe/London' });

/** The year an album is filed under on the photos page. */
export const photoYear = (a: Album) =>
  a.data.dateLabel ? (a.data.dateLabel.match(/\d{4}(?!.*\d{4})/)?.[0] ?? 'Other') : String(a.data.date.getFullYear()); // ranges file under their last year

/** URL slug for a photo category: "Pensioners' lunch" → "pensioners-lunch" */
export const categorySlug = (c: string) =>
  c
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Friendly order for photo categories */
export const CATEGORY_ORDER = ['Carnival', 'Duck race', 'Bonfire', "Pensioners' lunch", 'Christmas card', "Wolf's Pit", 'Tour of Bradwell', 'Social', 'Village'];

/** News tag that matches each event, for "related news" on event pages. */
export const EVENT_TAG: Record<string, string> = {
  'duck-race': 'Duck race',
  bonfire: 'Bonfire',
  'pensioners-lunch': "Pensioners' lunch",
  wolfspit: "Wolf's Pit",
  'christmas-card': 'Christmas card',
};
