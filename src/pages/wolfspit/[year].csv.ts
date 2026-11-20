// Serves each year's results CSV for download, e.g. /wolfspit/2026.csv
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWolfspitYears } from '../../lib/results';

export const getStaticPaths = (async () => {
  const years = await getWolfspitYears();
  return years.map((y) => ({ params: { year: String(y.year) }, props: { csvPath: y.csvPath } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, params }) => {
  const body = readFileSync(join(process.cwd(), props.csvPath as string), 'utf-8');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="wolfspit-${params.year}.csv"`,
    },
  });
};
