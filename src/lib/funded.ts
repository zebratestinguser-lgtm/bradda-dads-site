import { getCollection } from 'astro:content';

/** Most it shows: the projects ticked "Show on the homepage" (editor: Where the money goes), newest first */
const SHOW = 5;
const lastYear = (y: string) => Math.max(0, ...(y.match(/\d{4}/g) ?? []).map(Number));

/** The featured projects for the homepage and Donate page, plus how many others there are */
export async function featuredProjects() {
  const all = (await getCollection('funded')).sort((a, b) => a.data.name.localeCompare(b.data.name));
  const shown = all
    .filter((f) => f.data.onHomepage)
    .sort((a, b) => lastYear(b.data.year) - lastYear(a.data.year) || a.data.name.localeCompare(b.data.name))
    .slice(0, SHOW);
  return { all, shown, more: all.length - shown.length };
}
