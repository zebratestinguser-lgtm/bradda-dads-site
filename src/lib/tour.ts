/** Tour of Bradwell results: race folders and their URL slugs. */
export const tourRaces = ['tour-of-bradwell-long', 'tour-of-bradwell-half', 'tour-of-bradwell'] as const;

/** "tour-of-bradwell-long", 2017 → "long-tour-2017"; "tour-of-bradwell", 2019 → "2019" */
export function tourSlug(race: string, year: number) {
  if (race === 'tour-of-bradwell-long') return `long-tour-${year}`;
  if (race === 'tour-of-bradwell-half') return `half-tour-${year}`;
  return String(year);
}
