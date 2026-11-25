// Every year's Wolf's Pit results in one compact file, loaded by the results band and the all-years
// search after the page appears (keeps the page itself small): { "2026": [[pos, name, club, category, time], …] }
import type { APIRoute } from 'astro';
import { getWolfspitYears } from '../../lib/results';

export const GET: APIRoute = async () => {
  const years = await getWolfspitYears();
  const data = Object.fromEntries(years.map((y) => [y.year, y.rows.map((r) => [r.position, r.name, r.club, r.category, r.time])]));
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
