import { getEntry } from 'astro:content';

/** Site-wide settings from src/data/site.yaml */
export async function getSite() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('src/data/site.yaml must have a top-level "site:" key');
  return entry.data;
}
