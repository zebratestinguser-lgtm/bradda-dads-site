// Fetches the latest posts from the Bradda Dads Facebook page at build time, so the site can show them as
// normal content: visitors never load anything from Facebook (no tracking, no embed).
//
// Needs two environment variables (GitHub: Settings → Secrets and variables → Actions):
//   FB_PAGE_ID     the Page's numeric id
//   FB_PAGE_TOKEN  a long-lived Page access token (a Page admin creates it; see docs/facebook-setup.md)
// Without them it does nothing, and the site simply doesn't show the Facebook row.
//
// Writes src/data/facebook.json and public/uploads/facebook/<post>.jpg (both gitignored, made fresh each build).
// A failed fetch (e.g. an expired token) never fails the build: it logs a warning and shows no posts.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const API = 'https://graph.facebook.com/v27.0'; // Graph API versions last about two years; bump when Meta retires it
const KEEP = 3; // posts to show
const root = join(import.meta.dirname, '..');
const dataFile = join(root, 'src', 'data', 'facebook.json');
const imgDir = join(root, 'public', 'uploads', 'facebook');

const { FB_PAGE_ID: pageId, FB_PAGE_TOKEN: token } = process.env;
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::Facebook posts: ${msg}` : `Facebook posts: ${msg}`);

function save(posts) {
  writeFileSync(dataFile, JSON.stringify(posts, null, 2) + '\n');
}

if (!pageId || !token) {
  if (!existsSync(dataFile)) save([]);
  console.log('Facebook posts: no FB_PAGE_ID / FB_PAGE_TOKEN set, skipping.');
  process.exit(0);
}

try {
  const fields = 'id,message,created_time,permalink_url,full_picture';
  const res = await fetch(`${API}/${encodeURIComponent(pageId)}/posts?fields=${fields}&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);

  rmSync(imgDir, { recursive: true, force: true });
  mkdirSync(imgDir, { recursive: true });
  const posts = [];
  for (const p of body.data ?? []) {
    if (!p.message?.trim() || !p.permalink_url) continue; // skip photo-only shares and cover changes
    let image;
    if (p.full_picture) {
      try {
        const img = await fetch(p.full_picture);
        if (img.ok) {
          const name = `${String(p.id).replace(/[^0-9_]/g, '')}.jpg`;
          await sharp(Buffer.from(await img.arrayBuffer()))
            .rotate()
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(join(imgDir, name)); // re-encoding also drops any hidden photo data
          image = `/uploads/facebook/${name}`;
        }
      } catch {
        // no photo is fine
      }
    }
    posts.push({ id: p.id, date: p.created_time, text: p.message.trim(), url: p.permalink_url, image });
    if (posts.length === KEEP) break;
  }
  save(posts);
  console.log(`Facebook posts: saved ${posts.length}.`);
} catch (err) {
  save([]);
  warn(`couldn't fetch (${err.message}). The site will build without them; the token may need renewing.`);
}
