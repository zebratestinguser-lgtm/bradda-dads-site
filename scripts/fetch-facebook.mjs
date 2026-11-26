// Facebook → website, at build time. Two jobs:
//  1. The "Latest on Facebook" row: the newest posts with text → src/data/facebook.json (+ photos in
//     public/uploads/facebook/). Both gitignored and made fresh each build.
//  2. News drafts: every Facebook post not seen before becomes a DRAFT news story in src/content/news/
//     (full text, photos, link back to the post). Drafts don't appear on the site until an editor unticks
//     "Draft" in Pages CMS, or deletes the story. src/data/facebook-seen.json remembers every post that has
//     been imported, so a deleted draft never comes back. The deploy workflow commits the new files.
//     First run (empty seen list): the page's whole history comes in as drafts, with one photo each to keep
//     the repository small; after that, new posts get all their photos (up to 12).
//
// Needs FB_PAGE_ID and FB_PAGE_TOKEN (GitHub: Settings → Secrets and variables → Actions; see
// docs/facebook-setup.md). Without them it does nothing. A failed fetch never fails the build.
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const API = 'https://graph.facebook.com/v27.0'; // Graph API versions last about two years; bump when Meta retires it
const ROW = 6; // posts kept for the "Latest on Facebook" row (the page shows 3)
const MAX_PHOTOS = 12; // photos per new post
const root = join(import.meta.dirname, '..');
const rowFile = join(root, 'src', 'data', 'facebook.json');
const rowImgDir = join(root, 'public', 'uploads', 'facebook');
const seenFile = join(root, 'src', 'data', 'facebook-seen.json');
const newsDir = join(root, 'src', 'content', 'news');
const photoDir = join(root, 'public', 'uploads', 'news', 'facebook');

const { FB_PAGE_ID: pageId, FB_PAGE_TOKEN: token } = process.env;
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::Facebook posts: ${msg}` : `Facebook posts: ${msg}`);
const saveRow = (posts) => writeFileSync(rowFile, JSON.stringify(posts, null, 2) + '\n');

if (!pageId || !token) {
  if (!existsSync(rowFile)) saveRow([]);
  console.log('Facebook posts: no FB_PAGE_ID / FB_PAGE_TOKEN set, skipping.');
  process.exit(0);
}

// ---------- helpers ----------
const FIELDS = 'id,message,created_time,permalink_url,full_picture,attachments{media_type,type,media,subattachments.limit(30){media_type,type,media}}';

async function graph(path) {
  // Testing aid: FB_FAKE=path/to/posts.json reads { "data": [...] } from a file instead of Facebook
  if (process.env.FB_FAKE) return JSON.parse(readFileSync(process.env.FB_FAKE, 'utf8'));
  const res = await fetch(path.startsWith('http') ? path : `${API}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  return body;
}

/** UK calendar date "2026-11-20" */
const ukDate = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const longDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });

/** Photo URLs in a post: its photo, or every photo of a multi-photo post. Link previews and videos are skipped. */
function photoUrls(p) {
  const out = [];
  for (const a of p.attachments?.data ?? []) {
    const subs = a.subattachments?.data ?? [];
    if (subs.length) for (const s of subs) if (s.media_type === 'photo' && s.media?.image?.src) out.push(s.media.image.src);
    if (!subs.length && a.media_type === 'photo' && a.media?.image?.src) out.push(a.media.image.src);
  }
  return [...new Set(out)];
}

async function savePhoto(src, file, width) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`photo HTTP ${res.status}`);
  await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(file); // re-encoding drops hidden photo data (location etc.)
}

/** Strip emoji and symbols, tame SHOUTING, keep it short: a starting point the editor can tidy */
function makeTitle(text, iso) {
  const first = text.split('\n').map((l) => l.trim()).find((l) => /[a-z]/i.test(l)) ?? '';
  let t = first
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/[*_#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const letters = t.replace(/[^a-z]/gi, '');
  if (letters.length > 3 && letters === letters.toUpperCase()) t = t.toLowerCase();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (t.length > 70) t = t.slice(0, 70).replace(/\s+\S*$/, '') + '…';
  t = t.replace(/[\s,;:–-]+$/, '');
  return t || `Facebook post, ${longDate(iso)}`;
}

function makeSummary(text) {
  const plain = text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  return plain.length <= 200 ? plain : plain.slice(0, 200).replace(/\s+\S*$/, '') + '…';
}

const TAGS = [
  [/duck race|ducks?\b|krazy|raft/i, 'Duck race'],
  [/bonfire|firework|guy fawkes/i, 'Bonfire'],
  [/christmas card|community card/i, 'Christmas card'],
  [/pensioner|christmas lunch/i, "Pensioners' lunch"],
  [/wolf'?s ?pit|fell race/i, "Wolf's Pit"],
  [/carnival|gala|float|parade/i, 'Carnival'],
  [/tour of bradwell/i, 'Tour of Bradwell'],
];
const guessTag = (text) => TAGS.find(([re]) => re.test(text))?.[1] ?? 'Village';

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '') || 'facebook-post';

/** Facebook text → Markdown paragraphs (single line breaks kept) */
function toMarkdown(text) {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split('\n')
        .map((l) => l.trim().replace(/^([#>])/, '\\$1').replace(/^(\d+)\. /, '$1\\. '))
        .join('  \n'),
    )
    .join('\n\n');
}

const q = (s) => JSON.stringify(s); // JSON strings are valid YAML double-quoted strings

// ---------- 1. the "Latest on Facebook" row ----------
let latest = [];
try {
  latest = (await graph(`${encodeURIComponent(pageId)}/posts?fields=${FIELDS}&limit=25`)).data ?? [];
  rmSync(rowImgDir, { recursive: true, force: true });
  mkdirSync(rowImgDir, { recursive: true });
  const row = [];
  for (const p of latest) {
    if (!p.message?.trim() || !p.permalink_url) continue;
    let image;
    const src = photoUrls(p)[0] ?? p.full_picture;
    if (src) {
      const name = `${String(p.id).replace(/[^0-9_]/g, '')}.jpg`;
      try {
        await savePhoto(src, join(rowImgDir, name), 1200);
        image = `/uploads/facebook/${name}`;
      } catch {
        // no photo is fine
      }
    }
    row.push({ id: p.id, date: p.created_time, text: p.message.trim(), url: p.permalink_url, image });
    if (row.length === ROW) break;
  }
  saveRow(row);
  console.log(`Facebook posts: ${row.length} for the "Latest on Facebook" row.`);
} catch (err) {
  saveRow([]);
  warn(`couldn't fetch (${err.message}). The site will build without them; the token may need renewing.`);
  process.exit(0);
}

// ---------- 2. new posts → draft news stories ----------
try {
  const seen = existsSync(seenFile) ? JSON.parse(readFileSync(seenFile, 'utf8')) : {};
  const firstRun = Object.keys(seen).length === 0;
  let posts = latest;
  if (firstRun) {
    // The whole history (newest first), following Facebook's pages
    posts = [];
    let next = `${encodeURIComponent(pageId)}/posts?fields=${FIELDS}&limit=100`;
    while (next && posts.length < 3000) {
      const page = await graph(next);
      posts.push(...(page.data ?? []));
      next = page.paging?.next;
    }
  }
  mkdirSync(photoDir, { recursive: true });
  const existing = new Set(readdirSync(newsDir));
  const recent = Date.now() - 30 * 864e5;
  let added = 0;
  for (const p of posts) {
    if (seen[p.id] || !p.message?.trim() || !p.permalink_url) continue;
    const date = ukDate(p.created_time);
    const title = makeTitle(p.message, p.created_time);
    // The first line becomes the headline, so the story and summary start after it (unless it was cut short)
    const lines = p.message.trim().split('\n');
    const rest = lines.slice(lines.findIndex((l) => /[a-z]/i.test(l)) + 1).join('\n').trim();
    const text = rest && !title.endsWith('…') ? rest : p.message.trim();
    let file = `${date}-fb-${slugify(title)}.md`;
    for (let n = 2; existing.has(file); n++) file = `${date}-fb-${slugify(title)}-${n}.md`;
    existing.add(file);

    // Photos: all of them for new posts; only the first for the history import (keeps the repo small)
    const allPhotos = photoUrls(p);
    const urls = firstRun && new Date(p.created_time).getTime() < recent ? allPhotos.slice(0, 1) : allPhotos.slice(0, MAX_PHOTOS);
    const photos = [];
    for (const [i, src] of urls.entries()) {
      const name = `${date}-${String(p.id).split('_').pop()}-${i + 1}.jpg`;
      try {
        await savePhoto(src, join(photoDir, name), 1600);
        photos.push({ src: `/uploads/news/facebook/${name}`, alt: `Photo ${i + 1} of ${allPhotos.length} from the Facebook post of ${longDate(p.created_time)}` });
      } catch {
        // skip a photo that won't download
      }
    }
    const more = allPhotos.length > photos.length ? `\n\n_${allPhotos.length - photos.length} more photo${allPhotos.length - photos.length === 1 ? '' : 's'} with [the original post on Facebook](${p.permalink_url})._` : '';
    const front = [
      '---',
      `title: ${q(title)}`,
      `date: ${date}`,
      `tag: ${q(guessTag(p.message))}`,
      `summary: ${q(makeSummary(text))}`,
      ...(photos[0] ? [`image: ${photos[0].src}`, `imageAlt: ${q(photos[0].alt)}`] : []),
      ...(photos.length > 1 ? ['photos:', ...photos.slice(1).flatMap((ph) => [`  - src: ${ph.src}`, `    alt: ${q(ph.alt)}`])] : []),
      'draft: true',
      `facebookId: ${q(p.id)}`,
      `source: ${p.permalink_url}`,
      '---',
      '',
    ].join('\n');
    const body = `${toMarkdown(text)}${more}\n\n_Originally posted on [the Bradda Dads Facebook page](${p.permalink_url})._\n`;
    writeFileSync(join(newsDir, file), front + body);
    seen[p.id] = { file, date };
    added++;
  }
  writeFileSync(seenFile, JSON.stringify(seen, null, 2) + '\n');

  // Tidy up: photos from drafts an editor has deleted
  const allNews = readdirSync(newsDir).map((f) => readFileSync(join(newsDir, f), 'utf8')).join('\n');
  let removed = 0;
  for (const f of readdirSync(photoDir)) if (!allNews.includes(`/uploads/news/facebook/${f}`)) (unlinkSync(join(photoDir, f)), removed++);
  console.log(`Facebook posts: ${added} new draft stor${added === 1 ? 'y' : 'ies'}${firstRun ? ' (first run: whole history)' : ''}${removed ? `, ${removed} unused photos removed` : ''}.`);
} catch (err) {
  warn(`couldn't import posts as drafts (${err.message}).`);
}
