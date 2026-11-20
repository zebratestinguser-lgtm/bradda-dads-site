// Shrinks big photos in public/uploads/ to web size, so phone photos (5–10MB) uploaded through the
// editor don't bloat the repo or slow the site down.
//
//   node scripts/resize-uploads.mjs
//
// Any JPEG/PNG/WebP wider or taller than MAX px, or bigger than MAX_BYTES, is resized to fit MAX px on
// its longest side, turned the right way up (phone rotation), and saved without its hidden metadata
// (which can include the GPS location where the photo was taken). Already-small photos are left alone.
// Runs automatically in the GitHub deploy workflow, which commits any resized photos back to the repo.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/uploads';
const SKIP = new Set(['thumbs']); // generated previews (scripts/make-thumbs.mjs)
const MAX = 1600;
const MAX_BYTES = 600 * 1024;
const TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) yield* walk(join(dir, e.name));
    } else if (TYPES.has(extname(e.name).toLowerCase())) yield join(dir, e.name);
  }
}

let checked = 0;
let resized = 0;
for await (const file of walk(ROOT)) {
  checked++;
  const { size } = await stat(file);
  const meta = await sharp(file).metadata();
  // EXIF orientation 5–8 means the stored pixels are rotated 90°, so width and height swap
  const [w, h] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  if (w <= MAX && h <= MAX && size <= MAX_BYTES) continue;

  const ext = extname(file).toLowerCase();
  let img = sharp(await readFile(file)).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  img = ext === '.png' ? img.png({ compressionLevel: 9, palette: true }) : ext === '.webp' ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true });
  const out = await img.toBuffer();
  if (out.length >= size && w <= MAX && h <= MAX) continue; // couldn't make it smaller
  await writeFile(file, out);
  resized++;
  console.log(`resized ${file}: ${w}×${h}, ${Math.round(size / 1024)}KB → ${Math.round(out.length / 1024)}KB`);
}
console.log(`Checked ${checked} photos, resized ${resized}.`);
