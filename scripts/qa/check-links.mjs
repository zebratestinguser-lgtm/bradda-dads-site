// Usage: node check-links.mjs <repo-dir>  — finds internal links/images in dist/ that point nowhere
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const repo = process.argv[2];
const root = join(repo, 'dist');
const base = '/bradda-dads-site/';
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const q = join(d, f);
    if (statSync(q).isDirectory()) walk(q);
    else if (q.endsWith('.html')) files.push(q);
  }
})(root);

const bad = new Map();
for (const f of files) {
  const html = readFileSync(f, 'utf-8');
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const u = m[1];
    if (!u.startsWith(base)) continue;
    const rel = decodeURIComponent(u.slice(base.length));
    let target = join(root, rel);
    if (rel === '' || rel.endsWith('/')) target = join(target, 'index.html');
    if (!existsSync(target)) {
      if (!bad.has(u)) bad.set(u, []);
      bad.get(u).push(relative(root, f));
    }
  }
}
console.log(`pages checked: ${files.length}, broken targets: ${bad.size}`);
for (const [u, from] of [...bad].slice(0, 25)) console.log(`${u}  <- ${from.length} page(s), e.g. ${from[0]}`);
