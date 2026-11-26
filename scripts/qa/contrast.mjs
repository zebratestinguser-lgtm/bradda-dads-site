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
  ['#1a1f1c', '#e6f0f5', 'body text on water blue (page)'],
  ['#4b5a51', '#e6f0f5', 'muted on water blue'],
  ['#1d3b2c', '#e6f0f5', 'links on water blue'],
  ['#1a1f1c', '#cfe3ee', 'body text on deep water (alternate sections)'],
  ['#4b5a51', '#cfe3ee', 'muted on deep water'],
  ['#1d3b2c', '#cfe3ee', 'links on deep water'],
  ['#6b4b00', '#cfe3ee', 'yellow-ink on deep water'],
  ['#4b5a51', '#eef5f9', 'muted on light surface (boxes in cards)'],
  // Category colours (global.css .cat-*): tiles, selected News buttons, topic labels
  ['#ffffff', '#1d3b2c', 'category green: selected News button / tile'],
  ['#1d3b2c', '#e4ece3', 'category green: topic label / News button'],
  ['#1d3b2c', '#ffffff', 'category green: label text on white cards'],
  ['#ffffff', '#4d6b35', 'category moss: selected News button / tile'],
  ['#35501f', '#e8efdd', 'category moss: topic label / News button'],
  ['#35501f', '#ffffff', 'category moss: label text on white cards'],
  ['#ffffff', '#24705f', 'category teal: selected News button / tile'],
  ['#17503f', '#dcefe9', 'category teal: topic label / News button'],
  ['#17503f', '#ffffff', 'category teal: label text on white cards'],
  ['#ffffff', '#2f6a8a', 'category brook: selected News button / tile'],
  ['#1e4d66', '#d9e9f2', 'category brook: topic label / News button'],
  ['#1e4d66', '#ffffff', 'category brook: label text on white cards'],
  ['#ffffff', '#6b4f80', 'category heather: selected News button / tile'],
  ['#4f3863', '#ece4f2', 'category heather: topic label / News button'],
  ['#4f3863', '#ffffff', 'category heather: label text on white cards'],
  ['#ffffff', '#9b3a48', 'category berry: selected News button / tile'],
  ['#7a2836', '#f5e0e3', 'category berry: topic label / News button'],
  ['#7a2836', '#ffffff', 'category berry: label text on white cards'],
  ['#ffffff', '#c4511a', 'category orange: selected News button / tile'],
  ['#8a3b12', '#fbe3d2', 'category orange: topic label / News button'],
  ['#8a3b12', '#ffffff', 'category orange: label text on white cards'],
  ['#ffffff', '#66716b', 'category stone: selected News button / tile'],
  ['#3d4641', '#e9edeb', 'category stone: topic label / News button'],
  ['#3d4641', '#ffffff', 'category stone: label text on white cards'],
  ['#6b4b00', '#f3d98f', 'category cream: selected News button / tile'],
  ['#6b4b00', '#fbe9b7', 'category cream: topic label / News button'],
  ['#6b4b00', '#ffffff', 'category cream: label text on white cards'],
  ['#ffffff', '#1458bf', 'news tile: white on Facebook blue ("From Facebook")', true],
  ['#34413a', '#e8f0f5', 'pill "Coming up"'],
  ['#4b5a51', '#e6f0f5', 'muted text on a done (outline) event card'],
  ['#34413a', '#e6f0f5', 'event name on a done (outline) event card'],
  // Event status pills (EventCard)
  ['#1a1f1c', '#f6c343', 'status "Open now" (yellow)'],
  ['#ffffff', '#c4511a', 'status "On now" (orange)'],
  ['#1d3b2c', '#ffffff', 'status "Coming up" / "Next up" (white, green)'],
  ['#3d4641', '#e9edeb', 'status "Closed" / "Done" (stone)'],
  ['#ffffff', '#3a554a', 'status "Bookings closed" on the green next card'],
  ['#dfe9e2', '#1d3b2c', 'deadline line on the green next card'],
  ['#4b5a51', '#e8f0f5', 'pill "Done"'],
  ['#ffffff', 'rgba(16,36,26,0.85)/#5b7a5a', 'date chip over a mid-tone photo (worst case)'],
  ['#c4511a', '#ffffff', 'focus ring on white (non-text, needs 3:1)', true],
  ['#c4511a', '#cfe3ee', 'focus ring on deep water (non-text, needs 3:1)', true],
  ['#f6c343', '#1d3b2c', 'yellow focus ring on green (non-text, needs 3:1)', true],
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
