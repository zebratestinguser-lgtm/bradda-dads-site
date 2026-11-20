// Import posts + photos from the old Blogspot and WordPress sites.
// Usage: node import-legacy.mjs <legacy-data-dir> <project-dir> [--no-images]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [dataDir, projectDir] = process.argv.slice(2);
const NO_IMAGES = process.argv.includes('--no-images');
const read = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf-8'));

// ---------- helpers ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', pound: '£', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decode = (s = '') =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const strip = (h = '') => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  decode(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-[^-]*$/, (m) => (m.length < 4 ? '' : m)) || 'post';
const y = (v) => JSON.stringify(v); // JSON strings are valid YAML

function classify(title, labels, text) {
  const t = `${title} ${labels.join(' ')}`.toLowerCase();
  if (/duck|krazy|crazy kraft|crazy craft/.test(t)) return 'Duck race';
  if (/wolf'?s ?pit|wolfspit|wolf’s pit/.test(t)) return 'Wolfspit';
  if (/pensioner|christmas lunch/.test(t)) return "Pensioners' lunch";
  if (/bonfire|firework/.test(t)) return 'Bonfire';
  if (/christmas card/.test(t)) return 'Christmas card';
  if (/tour of bradwell|long tour|half tour/.test(t)) return 'Tour of Bradwell';
  if (/carnival|float/.test(t)) return 'Carnival';
  if (/golf|bowls|camping|birthday|reunion|social|cavern|chinese|meeting|summer holiday|retire|legend/.test(t)) return 'Social';
  return 'Village';
}
const EVENT_FOR_TAG = { 'Duck race': 'duck-race', Bonfire: 'bonfire', "Pensioners' lunch": 'pensioners-lunch', Wolfspit: 'wolfspit', 'Christmas card': 'christmas-card' };

/** Pull photo URLs out of a post, upgraded to 1200px. */
function photoUrls(html) {
  const urls = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    let u = decode(m[1]);
    if (u.startsWith('//')) u = 'https:' + u;
    if (/blogger\.googleusercontent\.com|bp\.blogspot\.com|blogspot\.com\/-/.test(u)) {
      u = u.replace(/\/s\d+(-[a-z0-9-]+)?\//i, '/s1200/').replace(/=s\d+(-[a-z0-9-]+)?$/i, '=s1200');
    } else if (/files\.wordpress\.com|wp\.com|wordpress\.com\/wp-content/.test(u)) {
      if (/gravatar|s\.w\.org|emoji|stats\.wp/.test(u)) continue;
      u = u.split('?')[0] + '?w=1200';
    } else continue; // trackers, icons, other hosts
    if (!urls.includes(u)) urls.push(u);
  }
  return urls;
}

/** Very small HTML → Markdown converter for old blog posts (images removed). */
function toMarkdown(html) {
  let h = html;
  // videos → links
  h = h.replace(/<iframe[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi, (_, src) => {
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    return yt ? `\n\n[Watch the video on YouTube](https://www.youtube.com/watch?v=${yt[1]})\n\n` : `\n\n(A video was embedded here on the old site.)\n\n`;
  });
  h = h.replace(/<object[\s\S]*?<\/object>|<embed[^>]*>/gi, '\n\n(A video was embedded here on the old site.)\n\n');
  h = h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  // drop images (and links that only wrap an image)
  h = h.replace(/<a[^>]*>\s*(<img[^>]*>\s*)+<\/a>/gi, '');
  h = h.replace(/<img[^>]*>/gi, '');
  // links
  h = h.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const t = strip(text);
    if (!t) return '';
    return /^https?:/.test(href) ? `[${t}](${decode(href)})` : t;
  });
  h = h.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => (strip(t) ? `**${strip(t)}**` : ''));
  h = h.replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => (strip(t) ? `_${strip(t)}_` : ''));
  h = h.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '');
  h = h.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, t) => `\n\n### ${strip(t)}\n\n`);
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<\/(p|div|ul|ol|table|tr|blockquote|figure)>/gi, '\n\n');
  h = h.replace(/<[^>]+>/g, '');
  h = decode(h).replace(/ /g, ' ');
  return h
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function summaryOf(text, title) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.split(' ').length < 6) return `Photos from the old Bradda Dads website: ${decode(title)}.`;
  if (t.length <= 180) return t;
  const cut = t.slice(0, 180);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

// ---------- gather ----------
const items = [];
for (const e of read('blogspot-posts.json').feed.entry) {
  const html = e.content?.$t ?? '';
  items.push({
    site: 'blogspot',
    kind: 'post',
    date: e.published.$t.slice(0, 10),
    title: decode(e.title.$t).trim() || 'Untitled',
    url: e.link.find((l) => l.rel === 'alternate')?.href,
    labels: (e.category ?? []).map((c) => c.term),
    html,
  });
}
for (const [file, kind] of [['wp-posts.json', 'post'], ['wp-pages.json', 'page']]) {
  for (const p of read(file).posts) {
    let html = p.content;
    if (p.featured_image && !html.includes(p.featured_image.split('?')[0])) html = `<img src="${p.featured_image}">` + html;
    items.push({ site: 'wordpress', kind, date: p.date.slice(0, 10), title: strip(p.title), url: p.URL, labels: [...Object.keys(p.categories ?? {}), ...Object.keys(p.tags ?? {})].filter((l) => l !== 'Uncategorized'), html });
  }
}
items.sort((a, b) => a.date.localeCompare(b.date));

// WordPress pages: only their photo galleries are imported (their text is merged by hand).
const PAGE_ALBUMS = { Carnival: 'Carnival photos (2017–2021)', 'Bonfire and Fireworks': 'Bonfire photos (2017–2019)', 'Wolf’s Pit': "Wolf's Pit photos", 'Duck races': 'Summer Duck Race 2016' };

// ---------- download ----------
async function download(url, dest, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'bradda-dads-site-migration' }, signal: AbortSignal.timeout(30000) });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.startsWith('image/')) throw new Error(`${res.status} ${type}`);
      const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : type.includes('webp') ? 'webp' : 'jpg';
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(`${dest}.${ext}`, buf);
      return { ext, bytes: buf.length };
    } catch (err) {
      if (i === tries - 1) return { error: String(err.message ?? err) };
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
async function pool(tasks, n = 8) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < tasks.length) {
        const k = i++;
        out[k] = await tasks[k]();
      }
    }),
  );
  return out;
}

// ---------- write ----------
const newsDir = join(projectDir, 'src/content/news');
const albumDir = join(projectDir, 'src/content/albums');
const uploads = join(projectDir, 'public/uploads/albums');
mkdirSync(newsDir, { recursive: true });
const used = new Set();
const manifest = [];
let totalBytes = 0;
const failures = [];

for (const it of items) {
  const isPage = it.kind === 'page';
  if (isPage && !PAGE_ALBUMS[it.title]) continue;
  const title = isPage ? PAGE_ALBUMS[it.title] : it.title;
  let id = `${it.date}-${slugify(title)}`;
  while (used.has(id)) id += '-2';
  used.add(id);

  const md = toMarkdown(it.html);
  const text = strip(it.html);
  const tag = classify(title, it.labels, text);
  const urls = photoUrls(it.html);

  // photos
  const photos = [];
  if (urls.length) {
    const dir = join(uploads, id);
    mkdirSync(dir, { recursive: true });
    const results = NO_IMAGES
      ? urls.map(() => ({ ext: 'jpg', bytes: 0 }))
      : await pool(urls.map((u, i) => () => download(u, join(dir, String(i + 1).padStart(3, '0')))));
    results.forEach((r, i) => {
      if (r.error) return failures.push({ id, url: urls[i], error: r.error });
      totalBytes += r.bytes;
      photos.push({ src: `/uploads/albums/${id}/${String(i + 1).padStart(3, '0')}.${r.ext}` });
    });
    photos.forEach((p, i) => (p.alt = `Photo ${i + 1} of ${photos.length} from ${title} (${it.date})`));
  }

  if (photos.length) {
    const ev = EVENT_FOR_TAG[tag];
    const fm = [
      '---',
      `title: ${y(title)}`,
      ev ? `event: ${ev}` : null,
      `date: ${it.date}`,
      `cover: ${photos[0].src}`,
      `coverAlt: ${y(photos[0].alt)}`,
      `source: ${it.url}`,
      'photos:',
      ...photos.flatMap((p) => [`  - src: ${p.src}`, `    alt: ${y(p.alt)}`]),
      '---',
      '',
      isPage ? md : '',
    ].filter((l) => l !== null);
    mkdirSync(join(albumDir, id), { recursive: true });
    writeFileSync(join(albumDir, id, 'index.md'), fm.join('\n') + '\n');
  }

  if (!isPage) {
    const fm = [
      '---',
      `title: ${y(title)}`,
      `date: ${it.date}`,
      `tag: ${y(tag)}`,
      `summary: ${y(summaryOf(text, title))}`,
      photos.length ? `image: ${photos[0].src}` : null,
      photos.length ? `imageAlt: ${y(photos[0].alt)}` : null,
      photos.length ? `album: ${id}` : null,
      `source: ${it.url}`,
      '---',
      '',
      md || `_Photos only. See the album._`,
      '',
      `_Originally published on the old Bradda Dads ${it.site === 'blogspot' ? 'Blogspot' : 'WordPress'} site: [view the original](${it.url})._`,
    ].filter((l) => l !== null);
    writeFileSync(join(newsDir, `${id}.md`), fm.join('\n') + '\n');
  }

  manifest.push({ id, site: it.site, kind: it.kind, date: it.date, title, tag, photos: photos.length, source: it.url, text });
  console.log(`${id}  [${tag}]  ${photos.length}/${urls.length} photos`);
}

writeFileSync(join(dataDir, 'import-manifest.json'), JSON.stringify({ manifest, failures, totalBytes }, null, 1));
console.log(`\nItems: ${manifest.length}, photos: ${manifest.reduce((a, m) => a + m.photos, 0)}, failures: ${failures.length}, size: ${(totalBytes / 1048576).toFixed(1)} MB`);
