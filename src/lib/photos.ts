// Picking real photos for places that would otherwise show a stand-in: news stories without their own
// photo, event page headers, and album card covers. Choices are repeatable (same photo on every build)
// and skip scans of posters, invitations, results sheets and press cuttings where a real scene exists.
import type { CollectionEntry } from 'astro:content';
import { getAlbums, photoDateShort, EVENT_TAG, type Album } from './albums';
import { pick } from './seed';

type NewsEntry = CollectionEntry<'news'>;
type Photo = { src: string; alt?: string };

/** Descriptions that mean "this is a document or graphic, not a photo of people or places" */
const NOT_A_SCENE = /poster|invitation|printed|cutting|newspaper|page of|drawing|poem|map view|logo|programme cover|list of|empty flatbed/i;

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
  const better = pics.find((p) => p.src !== coverSrc && isScene(p.alt) && !/^photo \d+ from/i.test(p.alt ?? ''));
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
 * Photo for a news story: its own photo if it has one, otherwise an archive photo from the same kind
 * of event (labelled with when it was taken, so nobody mistakes it for this year's).
 */
export async function storyPhoto(story: NewsEntry, avoid = new Set<string>()): Promise<(PickedPhoto & { own: boolean }) | undefined> {
  const albums = await getAlbums();
  if (story.data.image) {
    const album = story.data.album ? albums.find((a) => a.id === story.data.album!.id) : undefined;
    return {
      src: story.data.image,
      alt: story.data.imageAlt ?? '',
      album: album!,
      label: album ? photoDateShort(album) : '',
      own: true,
    };
  }
  const all = await sceneAlbums((a) => a.data.category === story.data.tag);
  const fresh = all.filter((a) => !avoid.has(a.id));
  const album = pick(fresh.length ? fresh : all, story.id);
  if (album) avoid.add(album.id);
  const photo = album && displayCover(album);
  return album && photo ? { ...asPicked(album, photo), own: false } : undefined;
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
