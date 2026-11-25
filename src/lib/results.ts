/**
 * Wolfspit results: reads the CSV next to each results/wolfspit/YYYY.md file
 * and works out the podium and finisher count.
 *
 * CSV header (exact): position,name,club,category,time
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';

/**
 * PODIUM RULES: the one place to change how categories are matched.
 * Categories are free text in the CSV (e.g. MO, FV40, U18).
 */
export const PODIUM_RULES = {
  /** A runner counts as a woman if their category starts with one of these. */
  womenPrefixes: ['F', 'W', 'L'],
  /** A runner counts as a junior if their category matches this pattern. */
  juniorPattern: /^(U\d+|J|JUN|JUNIOR|[MF]?U\d+|[MF]J)|\*$/i, // "MS*" = under 18 (2013 results)
};

export interface ResultRow {
  position: number;
  name: string;
  club: string;
  category: string;
  time: string;
}

const HEADER = 'position,name,club,category,time';

/** Minimal CSV parser: handles quoted fields with commas and "" escapes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseResultsCsv(text: string, label = 'CSV'): ResultRow[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines[0]?.trim().toLowerCase() !== HEADER) {
    throw new Error(`${label}: first line must be exactly "${HEADER}"`);
  }
  return lines.slice(1).map((line, i) => {
    const [position, name, club = '', category = '', time = ''] = parseCsvLine(line);
    const pos = Number(position);
    if (!Number.isInteger(pos) || !name) throw new Error(`${label} row ${i + 2}: needs a whole-number position and a name`);
    if (time && !/^\d+:\d{2}:\d{2}$/.test(time)) throw new Error(`${label} row ${i + 2}: time must look like H:MM:SS`);
    return { position: pos, name, club, category, time };
  });
}

export const isWoman = (r: ResultRow) =>
  PODIUM_RULES.womenPrefixes.some((p) => r.category.toUpperCase().startsWith(p));
export const isJunior = (r: ResultRow) => PODIUM_RULES.juniorPattern.test(r.category);

export function podium(rows: ResultRow[]) {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  return [
    { label: 'Overall winner', runner: sorted[0] },
    { label: 'First woman', runner: sorted.find(isWoman) },
    { label: 'First junior', runner: sorted.find(isJunior) },
  ];
}

/** All results years for one race (folder name), newest first, with rows loaded. */
export async function getRaceYears(race: string) {
  const entries = (await getCollection('results')).filter((e) => e.id.startsWith(`${race}/`));
  return entries
    .map((entry) => {
      const rel = `src/content/results/${race}/${entry.data.csv}`;
      const rows = parseResultsCsv(readFileSync(join(process.cwd(), rel), 'utf-8'), rel);
      return { ...entry.data, race, rows, finishers: entry.data.finishers ?? rows.length, csvPath: rel };
    })
    .sort((a, b) => b.year - a.year);
}

export const getWolfspitYears = () => getRaceYears('wolfspit');
