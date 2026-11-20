// Checks text/background colour pairs used on the site against WCAG AA.
// node scripts/qa/contrast.mjs
const pairs = [
  // [text, background, where, large?]
  ['#1a1f1c', '#ffffff', 'body text'],
  ['#4b5a51', '#ffffff', 'muted text'],
  ['#34413a', '#ffffff', 'muted-strong text'],
  ['#1d3b2c', '#ffffff', 'links / green on white'],
  ['#ffffff', '#1d3b2c', 'white on green (header, hero)'],
  ['#dfe9e2', '#1d3b2c', 'soft text on green (hero copy)'],
  ['#f6c343', '#1d3b2c', 'yellow on green (highlights, eyebrows)'],
  ['#c9d6cd', '#10241a', 'muted on deep green (footer, results band)'],
  ['#f6c343', '#10241a', 'yellow on deep green'],
  ['#1a1f1c', '#f6c343', 'dark on yellow (buttons, pills)'],
  ['#6b4b00', '#fbe9b7', 'yellow-ink on cream (tags, story)'],
  ['#3b3424', '#fbe9b7', 'body on cream panels'],
  ['#4b5a51', '#f1f4f2', 'muted on light surface'],
  ['#34413a', '#eef1ef', 'pill "Coming up"'],
  ['#4b5a51', '#eef1ef', 'pill "Done"'],
  ['#ffffff', '#2f6fa3', 'white on sky news tile', true],
  ['#ffffff', '#8a3b12', 'white on ember news tile', true],
  ['#ffffff', 'rgba(16,36,26,0.85)/#5b7a5a', 'date chip over a mid-tone photo (worst case)'],
  ['#e8702a', '#ffffff', 'orange focus ring (non-text, needs 3:1)', true],
];
const hex = (h) => {
  if (h.includes('/')) {
    // chip: rgba over photo → blend
    const [, a, under] = h.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)\/(#\w+)/) ? [null, h.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/), h.split('/')[1]] : [];
    const [r, g, b, al] = a.slice(1).map(Number);
    const u = hex(under);
    return u.map((c, i) => [r, g, b][i] * al + c * (1 - al));
  }
  const n = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
let fails = 0;
for (const [fg, bg, where, large] of pairs) {
  const a = lum(hex(fg));
  const b = lum(hex(bg));
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const need = large ? 3 : 4.5;
  const ok = ratio >= need;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1 (needs ${need})  ${where}`);
}
console.log(fails ? `${fails} pair(s) below AA` : 'All pairs meet WCAG AA');
