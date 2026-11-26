// Facebook stories with several photos → a photo album, so the photos are on the Photos page too.
// Runs before every build. Only for stories an editor has published (drafts never get an album, so
// nothing appears on the Photos page before it's been checked). The album takes the story's photos,
// title, topic (as its category) and date; the story is linked to it and shows a preview strip instead
// of the full gallery. Edit the album afterwards in the editor ("Photo albums") like any other.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const newsDir = join(root, 'src', 'content', 'news');
const albumDir = join(root, 'src', 'content', 'albums');
const MIN_PHOTOS = 3;
const q = (s) => JSON.stringify(s);
const field = (fm, key) => {
  const v = fm.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1]?.trim();
  if (v === undefined) return undefined;
  return v.startsWith('"') ? JSON.parse(v) : v;
};

let made = 0;
for (const f of readdirSync(newsDir)) {
  const path = join(newsDir, f);
  const s = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const m = s.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) continue;
  let [, fm, body] = m;
  if (!/^facebookId:/m.test(fm) || /^draft: true$/m.test(fm) || /^album:/m.test(fm)) continue;
  const image = field(fm, 'image');
  const gallery = [...fm.matchAll(/^ {2}- src: (\S+)\n {4}alt: (.*)$/gm)].map(([, src, alt]) => ({ src, alt: alt.startsWith('"') ? JSON.parse(alt) : alt }));
  const photos = [...(image ? [{ src: image, alt: field(fm, 'imageAlt') || 'Photo from the Facebook post' }] : []), ...gallery];
  if (photos.length < MIN_PHOTOS) continue;

  const id = f.replace(/\.md$/, '');
  const albumFile = join(albumDir, `${id}.md`);
  if (existsSync(albumFile)) continue;
  const album = [
    '---',
    `title: ${q(field(fm, 'title'))}`,
    `category: ${q(field(fm, 'tag'))}`,
    `date: ${field(fm, 'date')}`,
    `cover: ${photos[0].src}`,
    `coverAlt: ${q(photos[0].alt)}`,
    'photos:',
    ...photos.flatMap((p) => [`  - src: ${p.src}`, `    alt: ${q(p.alt)}`]),
    ...(field(fm, 'source') ? [`source: ${field(fm, 'source')}`] : []),
    '---',
    '',
  ].join('\n');
  writeFileSync(albumFile, album);
  // The story now links to the album (a preview strip with "See all N photos") instead of holding the gallery
  fm = fm.replace(/^photos:\n(?: {2}- src: .*\n {4}alt: .*(?:\n|$))+/m, '').replace(/\n+$/, '');
  fm = /^draft:/m.test(fm) ? fm.replace(/^draft:/m, `album: ${id}\ndraft:`) : `${fm}\nalbum: ${id}`;
  writeFileSync(path, `---\n${fm}\n---\n${body}`);
  made++;
}
if (made) console.log(`Facebook albums: made ${made} new photo album${made === 1 ? '' : 's'} from published stories.`);
