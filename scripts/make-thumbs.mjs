// Makes smaller copies of every photo in public/uploads/ (except /thumbs/ itself), as WebP:
//   public/uploads/albums/x/001.jpg  →  public/uploads/thumbs/albums/x/001.webp      (480px wide: grids, cards)
//                                    →  public/uploads/thumbs/960/albums/x/001.webp  (960px wide: headers, phones, photo viewer)
// Runs automatically before `npm run dev` and `npm run build`. Skips copies that are already up to date
// (same source file size as last time, recorded in thumbs/.manifest.json, so it also works after a fresh
// git checkout, where every file looks new). The copies are generated, not committed (see .gitignore).
// Use thumb() / srcset() from src/lib/url.ts to link to them.
import { readdirSync, statSync, existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname, '..', 'public', 'uploads');
const OUT = join(ROOT, 'thumbs');
const MANIFEST = join(OUT, '.manifest.json');
const SIZES = [
  { width: 480, quality: 68, dir: OUT },
  { width: 960, quality: 70, dir: join(OUT, '960') },
];
const EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (p === OUT) continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(name)) files.push(p);
  }
})(ROOT);

// Never publish blocked content (scripts/blocked-content.json): stop the build if any of it is back,
// whether under its old path or uploaded again under a new name (matched by file fingerprint).
const BLOCKED = JSON.parse(readFileSync(join(import.meta.dirname, 'blocked-content.json'), 'utf8'));
const PROJECT = join(import.meta.dirname, '..');
const blockedFound = BLOCKED.paths.filter((p) => existsSync(join(PROJECT, p)));
const blockedHashes = new Set(BLOCKED.sha256);
for (const f of files) {
  if (blockedHashes.has(createHash('sha256').update(readFileSync(f)).digest('hex'))) blockedFound.push(relative(PROJECT, f));
}
if (blockedFound.length) {
  console.error(`\nBLOCKED CONTENT FOUND. These must never be published (see scripts/blocked-content.json):\n  ${blockedFound.join('\n  ')}\n`);
  process.exit(1);
}

let manifest = {};
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch {
  /* first run */
}
const next = {};

let made = 0;
let skipped = 0;
let failed = 0;
const started = Date.now();
const queue = [...files];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const src = queue.shift();
      const rel = relative(ROOT, src).replace(/\\/g, '/');
      const { size } = statSync(src);
      const dests = SIZES.map((s) => ({ ...s, path: join(s.dir, rel.slice(0, -extname(rel).length) + '.webp') }));
      if (manifest[rel] === size && dests.every((d) => existsSync(d.path))) {
        next[rel] = size;
        skipped++;
        continue;
      }
      try {
        for (const d of dests) {
          mkdirSync(dirname(d.path), { recursive: true });
          await sharp(src).rotate().resize({ width: d.width, withoutEnlargement: true }).webp({ quality: d.quality }).toFile(d.path);
        }
        next[rel] = size;
        made++;
      } catch (err) {
        failed++;
        console.warn(`thumbs: could not process ${rel}: ${err.message}`);
      }
    }
  }),
);
// Remove copies whose original has gone (deleted photos must not linger in the build cache)
let pruned = 0;
const wanted = new Set(Object.keys(next).flatMap((rel) => SIZES.map((s) => join(s.dir, rel.slice(0, -extname(rel).length) + '.webp'))));
(function prune(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) prune(p);
    else if (name.endsWith('.webp') && !wanted.has(p)) {
      unlinkSync(p);
      pruned++;
    }
  }
  if (dir !== OUT && readdirSync(dir).length === 0) rmdirSync(dir);
})(OUT);
mkdirSync(OUT, { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(next));
console.log(`thumbs: ${made} made, ${skipped} up to date, ${pruned} removed, ${failed} failed (${((Date.now() - started) / 1000).toFixed(1)}s)`);
