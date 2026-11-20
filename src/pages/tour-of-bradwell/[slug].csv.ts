// CSV download for each Tour of Bradwell results year, e.g. /tour-of-bradwell/long-tour-2017.csv
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRaceYears } from '../../lib/results';
import { tourRaces, tourSlug } from '../../lib/tour';

export const getStaticPaths = (async () => {
  const all = (await Promise.all(tourRaces.map((r) => getRaceYears(r)))).flat();
  return all.map((y) => ({ params: { slug: tourSlug(y.race, y.year) }, props: { csvPath: y.csvPath } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, params }) =>
  new Response(readFileSync(join(process.cwd(), props.csvPath as string), 'utf-8'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tour-of-bradwell-${params.slug}.csv"`,
    },
  });
