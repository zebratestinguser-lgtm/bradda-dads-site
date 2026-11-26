// Picking real photos for places that would otherwise show a stand-in: news stories without their own
// photo, event page headers, and album card covers. Choices are repeatable (same photo on every build)
// and skip scans of posters, invitations, results sheets and press cuttings where a real scene exists.
import type { CollectionEntry } from 'astro:content';
import { getAlbums, photoDateShort, EVENT_TAG, type Album } from './albums';

type NewsEntry = CollectionEntry<'news'>;
type Photo = { src: string; alt?: string };

/** Descriptions that mean "this is a document or graphic, not a photo of people or places" */
const NOT_A_SCENE = /poster|invitation|printed|cutting|newspaper|page of|drawing|poem|map view|logo|programme cover|list of|empty flatbed/i;

/** Imported photos without a real description yet: "Photo 3 of 23 from …" */
export const GENERIC = /^photo \d+ (of \d+ )?from /i;

/** True if a photo's description suggests a real scene rather than a scanned document */
export const isScene = (alt?: string) => Boolean(alt) && !NOT_A_SCENE.test(alt!);

/** The photo an album card should lead with: its cover, unless that's a scan and a described scene exists */
export function displayCover(album: Album): Photo | undefined {
  const pics = album.data.photos;
  const coverSrc = album.data.cover ?? pics[0]?.src;
  if (!coverSrc) return undefined;
  const cover = { src: coverSrc, alt: album.data.coverAlt ?? pics.find((p) => p.src === coverSrc)?.alt };
  if (isScene(cover.alt)) return cover;
  // Imported photos other than the cover mostly have generic descriptions ("Photo 3 from …"), so only
  // swap to one that has been properly described
  const better = pics.find((p) => p.src !== coverSrc && isScene(p.alt) && !GENERIC.test(p.alt ?? ''));
  return better ?? cover;
}

export type PickedPhoto = { src: string; alt: string; album: Album; label: string };

const asPicked = (album: Album, photo: Photo): PickedPhoto => ({
  src: photo.src,
  alt: photo.alt ?? '',
  album,
  label: photoDateShort(album),
});

/** Albums in a category whose lead photo is a real scene (falls back to any album with photos) */
async function sceneAlbums(filter: (a: Album) => boolean) {
  const albums = (await getAlbums()).filter((a) => a.data.photos.length > 0 && filter(a));
  const scenes = albums.filter((a) => isScene(displayCover(a)?.alt));
  return scenes.length ? scenes : albums;
}

/**
 * Photo for a news story: its own photo, when it's a real scene (not a logo, poster or press cutting).
 * Stories without one get the duck tile (NewsTile), never a borrowed archive photo, so a picture
 * always belongs to its story. (The avoid set is kept so callers don't need to change.)
 */
export async function storyPhoto(story: NewsEntry, _avoid = new Set<string>()): Promise<(PickedPhoto & { own: boolean }) | undefined> {
  // A photo uploaded without a description still counts; one described as a poster, logo or cutting doesn't
  if (!story.data.image || (story.data.imageAlt && !isScene(story.data.imageAlt))) return undefined;
  const albums = await getAlbums();
  const album = story.data.album ? albums.find((a) => a.id === story.data.album!.id) : undefined;
  return {
    src: story.data.image,
    alt: story.data.imageAlt ?? '',
    album: album!,
    label: album ? photoDateShort(album) : story.data.facebookId ? story.data.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Europe/London' }) : '',
    own: true,
  };
}

/** Photos for a list of stories, using a different archive album for each where possible */
export async function storyPhotos(stories: NewsEntry[]) {
  const used = new Set<string>();
  const out = [];
  for (const story of stories) out.push(await storyPhoto(story, used));
  return out;
}

/** Header photo for an event page: the most recent real scene from that event's albums */
export async function eventPhoto(eventId: string): Promise<PickedPhoto | undefined> {
  const tag = EVENT_TAG[eventId];
  const candidates = await sceneAlbums((a) => a.data.event?.id === eventId || (Boolean(tag) && a.data.category === tag));
  const album = candidates[0]; // getAlbums() is newest first
  const photo = album && displayCover(album);
  return album && photo ? asPicked(album, photo) : undefined;
}

/** A group photo of the dads for the members page (newest album whose cover shows the dads together) */
export async function dadsGroupPhoto(): Promise<PickedPhoto | undefined> {
  const albums = (await getAlbums()).filter((a) => a.data.photos.length > 0);
  // Best first: the dads lined up together, then the dads in their yellow T-shirts, then any get-together
  const wanted = [/dads in white shirts and yellow ties lined up/i, /bradda dads team lined up|dads .*lined up/i, /current bradda dads together|current members/i];
  const album = wanted.map((re) => albums.find((a) => re.test(displayCover(a)?.alt ?? ''))).find(Boolean);
  const photo = album && displayCover(album);
  return album && photo ? asPicked(album, photo) : undefined;
}

/**
 * A specific photo for a page header, found by its description (album cover descriptions are real).
 * Tries each pattern in turn, so list the favourite first. Falls back to the first real scene.
 */
export async function photoMatching(...patterns: RegExp[]): Promise<PickedPhoto | undefined> {
  const albums = (await getAlbums()).filter((a) => a.data.photos.length > 0);
  for (const re of patterns) {
    for (const album of albums) {
      const photo = album.data.photos.find((p) => re.test(p.alt ?? '')) ?? (re.test(displayCover(album)?.alt ?? '') ? displayCover(album) : undefined);
      if (photo) return asPicked(album, photo);
    }
  }
  const album = albums.find((a) => isScene(displayCover(a)?.alt));
  return album ? asPicked(album, displayCover(album)!) : undefined;
}

/** Best photo to represent a whole category (newest album whose lead photo is a real scene) */
export async function categoryPhoto(category: string): Promise<PickedPhoto | undefined> {
  const [album] = await sceneAlbums((a) => a.data.category === category);
  const photo = album && displayCover(album);
  return album && photo ? asPicked(album, photo) : undefined;
}

/** A photo from a given year, preferring albums whose category matches one of the hints */
export async function yearPhoto(year: string, hints: string[] = []): Promise<PickedPhoto | undefined> {
  const albums = (await getAlbums()).filter((a) => a.data.photos.length > 0 && !a.data.dateLabel && String(a.data.date.getFullYear()) === year && isScene(displayCover(a)?.alt));
  // Only a photo from the same kind of event: a random photo from that year could be from anything
  const album = albums.find((a) => hints.includes(a.data.category ?? ''));
  const photo = album && displayCover(album);
  return album && photo ? asPicked(album, photo) : undefined;
}
