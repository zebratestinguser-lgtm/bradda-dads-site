// Makes the app icons (home-screen / bookmark icons) from the duck logo: a yellow duck on the site's green,
// with a little brook-blue water line. Run once after changing the logo:  node scripts/make-icons.mjs
import sharp from 'sharp';

const duck = `<ellipse cx="30" cy="42" rx="22" ry="14" fill="#F6C343"/><circle cx="40" cy="24" r="12" fill="#F6C343"/><path d="M50 24 L60 27 L50 30 Z" fill="#E8702A"/><circle cx="43" cy="21" r="2.2" fill="#1a1f1c"/><path d="M14 40 Q22 34 30 40" stroke="#D9A21E" stroke-width="3" fill="none" stroke-linecap="round"/>`;
// Square artwork: green background, water at the bottom, duck in the middle (kept inside the "safe zone"
// so phones that crop icons into circles or rounded squares don't clip it)
const art = (bg = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${bg ? '<rect width="100" height="100" fill="#1D3B2C"/>' : ''}
  <path d="M0 74 C14 68 26 80 40 74 S66 68 80 74 S94 80 100 72 L100 100 L0 100 Z" fill="#8FB7D6"/>
  <g transform="translate(19 21) scale(0.95)">${duck}</g>
</svg>`;

const out = [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];
for (const [file, size] of out) {
  await sharp(Buffer.from(art())).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log('wrote', file);
}
