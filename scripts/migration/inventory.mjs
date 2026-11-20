// Usage: node inventory.mjs <legacy-data-dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf-8'));
const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const imgs = (h = '') => [...h.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);

const items = [];
for (const [file, kind] of [['blogspot-posts.json', 'post'], ['blogspot-pages.json', 'page']]) {
  const feed = read(file).feed;
  for (const e of feed.entry ?? []) {
    const html = e.content?.$t ?? e.summary?.$t ?? '';
    items.push({
      site: 'blogspot', kind,
      date: e.published.$t.slice(0, 10),
      title: e.title.$t,
      url: (e.link.find((l) => l.rel === 'alternate') ?? {}).href,
      labels: (e.category ?? []).map((c) => c.term),
      words: strip(html).split(' ').length,
      images: imgs(html).length,
      text: strip(html),
    });
  }
}
for (const [file, kind] of [['wp-posts.json', 'post'], ['wp-pages.json', 'page']]) {
  const data = read(file);
  for (const p of data.posts ?? []) {
    items.push({
      site: 'wordpress', kind,
      date: p.date.slice(0, 10),
      title: strip(p.title),
      url: p.URL,
      labels: [...Object.keys(p.categories ?? {}), ...Object.keys(p.tags ?? {})].filter((l) => l !== 'Uncategorized'),
      words: strip(p.content).split(' ').length,
      images: imgs(p.content).length + (p.featured_image ? 1 : 0),
      text: strip(p.content),
    });
  }
  console.log(`${file}: found ${data.found} (fetched ${data.posts?.length})`);
}
const bs = read('blogspot-posts.json').feed;
console.log(`blogspot posts total: ${bs['openSearch$totalResults'].$t}`);

items.sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(join(dir, 'inventory.json'), JSON.stringify(items, null, 1));
for (const i of items) {
  console.log(`${i.date} | ${i.site.padEnd(9)} | ${i.kind} | ${String(i.words).padStart(5)}w | ${String(i.images).padStart(3)}img | ${i.title.slice(0, 70)} | ${i.labels.join(', ').slice(0, 50)}`);
}
