// Usage: node pdf2cells.mjs <file.pdf> <out.json>
// Writes [{page, y, cells:[{x, s}]}] with every text item and its x position.
import { readFileSync, writeFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [file, out] = process.argv.slice(2);
const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true, isEvalSupported: false, verbosity: 0 }).promise;
const lines = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const { items } = await page.getTextContent();
  const rows = new Map();
  for (const it of items) {
    if (!it.str.trim()) continue;
    const yKey = Math.round(it.transform[5] / 2) * 2;
    if (!rows.has(yKey)) rows.set(yKey, []);
    rows.get(yKey).push({ x: Math.round(it.transform[4]), w: Math.round(it.width), s: it.str.trim() });
  }
  for (const [y, cells] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
    lines.push({ page: p, y, cells: cells.sort((a, b) => a.x - b.x) });
  }
}
writeFileSync(out, JSON.stringify(lines));
