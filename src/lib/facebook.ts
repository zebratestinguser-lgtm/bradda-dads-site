// Latest Facebook posts: fetched at build time by scripts/fetch-facebook.mjs (src/data/facebook.json),
// otherwise the hand-picked ones in Site settings → Facebook posts (if they're real, not placeholders).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSite } from './site';
import { isPlaceholder } from './events';

export interface FacebookPost {
  id?: string;
  date?: Date;
  dateText?: string;
  text: string;
  url: string;
  image?: string;
  imageAlt?: string;
}

export async function getFacebookPosts(): Promise<FacebookPost[]> {
  const file = join(process.cwd(), 'src', 'data', 'facebook.json');
  if (existsSync(file)) {
    try {
      const posts = JSON.parse(readFileSync(file, 'utf8')) as { id: string; date: string; text: string; url: string; image?: string }[];
      if (posts.length) return posts.map((p) => ({ id: p.id, date: new Date(p.date), text: p.text, url: p.url, image: p.image }));
    } catch {
      // fall through to the hand-picked posts
    }
  }
  const site = await getSite();
  return site.facebookPosts
    .filter((p) => !isPlaceholder(p.text) && !isPlaceholder(p.date))
    .map((p) => ({ dateText: p.date, text: p.text, url: p.url, image: p.image, imageAlt: p.imageAlt }));
}
