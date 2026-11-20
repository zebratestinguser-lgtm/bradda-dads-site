// Usage: node results2csv.mjs <legacy-results-dir> <out-dir>
// Converts the extracted PDF cells into position,name,club,category,time CSVs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [dir, outDir] = process.argv.slice(2);
const load = (f) => JSON.parse(readFileSync(join(dir, `${f}.cells.json`), 'utf-8'));
const txt = (l) => l.cells.map((c) => c.s).join(' ');
const report = [];

/** "37-56", "39.16", "1.09.57", "00:38:57", "5:21:22", "100-00" → H:MM:SS */
function toTime(raw) {
  // Spreadsheet exports drop trailing zeros: "46.4" = 46:40, "56" = 56:00, "1.00.3" = 1:00:30
  const bits = raw.split(/[-.:]/);
  if (bits.length === 1) bits.push('00');
  bits[bits.length - 1] = bits.at(-1).padEnd(2, '0');
  const parts = bits.map(Number);
  if (parts.some(Number.isNaN)) return null;
  let s;
  if (parts.length === 3) s = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) s = parts[0] * 60 + parts[1];
  else return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const CLUB_NONE = /^(u\/?a|unattached|n\/a|none|-)$/i;

function write(race, year, rows, extra = {}) {
  rows.sort((a, b) => a.position - b.position);
  const issues = [];
  rows.forEach((r, i) => {
    const tie = i > 0 && rows[i - 1].position === r.position;
    const expected = i === 0 ? 1 : tie ? rows[i - 1].position : i + 1;
    if (r.position !== expected) issues.push(`position gap/duplicate near ${r.position}`);
    if (!r.time) issues.push(`row ${r.position}: no time`);
    if (i > 0 && r.time && rows[i - 1].time && r.time < rows[i - 1].time && r.time.length === rows[i - 1].time.length)
      issues.push(`row ${r.position}: time ${r.time} is faster than row ${rows[i - 1].position} (${rows[i - 1].time}), as in the original`);
  });
  const lines = ['position,name,club,category,time', ...rows.map((r) => [r.position, r.name, CLUB_NONE.test(r.club) ? '' : r.club, r.category, r.time].map((v) => csvCell(String(v ?? ''))).join(','))];
  mkdirSync(join(outDir, race), { recursive: true });
  writeFileSync(join(outDir, race, `${year}.csv`), lines.join('\n') + '\n');
  const withClub = rows.filter((r) => r.club && !CLUB_NONE.test(r.club)).length;
  const withCat = rows.filter((r) => r.category).length;
  report.push({ race, year, finishers: rows.length, withClub, withCat, issues: [...new Set(issues)].slice(0, 12), ...extra });
}

// ---------- Wolf's Pit ----------
// Left-hand merged cells: "pos time" + "raceNo forename" (2022, 2024, 2025) or "pos raceNo time forename" (2026)
function wolfspitWide(year, { surname, club, cat, note, order = 'ptnf', clubPages }) {
  const L = load(`wolfspit-${year}`);
  const rows = [];
  const notes = [];
  for (const l of L) {
    if (clubPages && l.page >= clubPages) continue;
    const left = l.cells.filter((c) => c.x < surname[0]).map((c) => c.s).join(' ');
    const re = order === 'ptnf' ? /^(\d+) (\d+(?:[-.:]\d{1,2}){1,2}) (\d+) (\D.*)$/ : /^(\d+) (\d+) (\d+(?:[-.:]\d{1,2}){0,2}) (\D.*)$/;
    const m = left.match(re);
    if (!m) continue;
    const [pos, a, b, fore] = m.slice(1);
    const time = order === 'ptnf' ? a : b;
    const sur = l.cells.filter((c) => c.x >= surname[0] && c.x < surname[1]).map((c) => c.s).join(' ');
    const cl = club ? l.cells.filter((c) => c.x >= club[0] && c.x < club[1]).map((c) => c.s).join(' ') : '';
    const ct = cat ? l.cells.filter((c) => c.x >= cat).map((c) => c.s).join(' ') : '';
    const nt = note ? l.cells.filter((c) => c.x >= note).map((c) => c.s).join(' ') : '';
    if (nt) notes.push(`${pos}: ${nt}`);
    rows.push({ position: Number(pos), name: clean(`${fore} ${sur}`), club: clean(cl), category: clean(ct), time: toTime(time) });
  }
  if (clubPages) {
    // Club/category columns printed on later pages, one line per runner in position order
    const extraRows = L.filter((l) => l.page >= clubPages && !/^Club|Combined_Export|^Page/.test(txt(l)));
    extraRows.forEach((l, i) => {
      if (!rows[i]) return;
      rows[i].club = clean(l.cells.filter((c) => c.x < 200).map((c) => c.s).join(' '));
      rows[i].category = clean(l.cells.filter((c) => c.x >= 200).map((c) => c.s).join(' '));
    });
  }
  return { rows, notes };
}

{
  // 2022 PDF has no position 83 (goes 82 → 84); positions kept exactly as published.
  const { rows, notes } = wolfspitWide(2022, { surname: [330, 360], note: 360 });
  write('wolfspit', 2022, rows, { notes });
}
{
  const L = load('wolfspit-2023');
  const rows = [];
  for (const l of L) {
    const c = l.cells.map((x) => x.s);
    if (!/^\d+$/.test(c[0]) || !/^\d{2}:\d{2}:\d{2}$/.test(c.at(-1))) continue;
    const g = c[3];
    if (!/^[MF]$/.test(g)) { report.push({ warn: `2023 odd row: ${c.join(' | ')}` }); continue; }
    rows.push({ position: Number(c[0]), name: clean(`${c[1]} ${c[2]}`), category: c[4], club: clean(c.slice(5, -1).join(' ')), time: toTime(c.at(-1)) });
  }
  write('wolfspit', 2023, rows);
}
write('wolfspit', 2024, wolfspitWide(2024, { surname: [420, 495], club: [495, 570], cat: 570 }).rows);
write('wolfspit', 2025, wolfspitWide(2025, { surname: [330, 420], clubPages: 6 }).rows);
write('wolfspit', 2026, wolfspitWide(2026, { surname: [455, 535], club: [535, 610], cat: 610, order: 'pntf' }).rows);

// ---------- Tour of Bradwell ----------
function tour(file, race, year, courseName) {
  const L = load(file);
  const rows = [];
  for (const l of L) {
    const c = l.cells.map((x) => x.s);
    c[0] = c[0].replace(/^=/, ''); // ties are printed "=23"
    if (!/^\d+$/.test(c[0]) || !/^\d+:\d{2}:\d{2}$/.test(c.at(-1))) continue;
    const gi = c.findIndex((v, i) => i >= 3 && /^[MF]$/.test(v));
    if (gi < 0) { report.push({ warn: `${file} odd row: ${c.join(' | ')}` }); continue; }
    const first = c[2];
    const sur = c.slice(3, gi).join(' ');
    const catRaw = c[gi + 1];
    const courseIdx = c.findIndex((v) => v === courseName);
    const club = courseIdx >= 0 ? c.slice(courseIdx + 1, -1).join(' ') : '';
    rows.push({ position: Number(c[0]), name: clean(`${first} ${sur}`), category: `${c[gi]}${catRaw && catRaw !== courseName ? catRaw : ''}`, club: clean(club), time: toTime(c.at(-1)) });
  }
  write(race, year, rows);
}
tour('tob-long-2016', 'tour-of-bradwell-long', 2016, 'Long Tour');
tour('tob-half-2016', 'tour-of-bradwell-half', 2016, 'Half Tour');
tour('tob-long-2017', 'tour-of-bradwell-long', 2017, 'Long Tour');
tour('tob-half-2017', 'tour-of-bradwell-half', 2017, 'Half Tour');
tour('tob-2019', 'tour-of-bradwell', 2019, 'Tour of Bradwell');

writeFileSync(join(outDir, 'conversion-report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(JSON.stringify(r));
