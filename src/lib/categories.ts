import { getCollection } from 'astro:content';

/**
 * Categories for news stories and photo albums. Editors manage the list in Pages CMS ("Categories");
 * stories, albums and events store a category's name (e.g. "Bonfire").
 */
export async function getCategories() {
  return (await getCollection('categories')).sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

/** Category names in the editor's order */
export async function categoryNames() {
  return (await getCategories()).map((c) => c.data.name);
}

/** The settings for one category (undefined if a story uses a name that isn't in the list) */
export async function getCategory(name: string | undefined) {
  if (!name) return undefined;
  return (await getCategories()).find((c) => c.data.name === name);
}
