// Makes small preview images of every photo in public/uploads/ (except /thumbs/ itself).
//   public/uploads/albums/x/001.jpg  →  public/uploads/thumbs/albums/x/001.webp  (480px wide)
// Runs automatically before `npm run dev` and `npm run build`. Skips previews that are already up to date.
// The previews are generated, not committed (see .gitignore). Use thumb() from src/lib/url.ts to link to them.
import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname, '..', 'public', 'uploads');
const OUT = join(ROOT, 'thumbs');
const WIDTH = 480;
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

let made = 0;
let skipped = 0;
let failed = 0;
const started = Date.now();
const queue = [...files];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const src = queue.shift();
      const rel = relative(ROOT, src);
      const dest = join(OUT, rel.slice(0, -extname(rel).length) + '.webp');
      if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) {
        skipped++;
        continue;
      }
      try {
        mkdirSync(dirname(dest), { recursive: true });
        await sharp(src).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 68 }).toFile(dest);
        made++;
      } catch (err) {
        failed++;
        console.warn(`thumbs: could not process ${rel}: ${err.message}`);
      }
    }
  }),
);
console.log(`thumbs: ${made} made, ${skipped} up to date, ${failed} failed (${((Date.now() - started) / 1000).toFixed(1)}s)`);
