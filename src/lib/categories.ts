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

/** CSS class with a category's colours (cat-green, cat-heather…; defined in global.css). Unknown names get none. */
export async function categoryClasses() {
  const map = new Map((await getCategories()).map((c) => [c.data.name, `cat-${c.data.colour}`]));
  return (name: string | undefined) => (name ? (map.get(name) ?? '') : '');
}

/** The settings for one category (undefined if a story uses a name that isn't in the list) */
export async function getCategory(name: string | undefined) {
  if (!name) return undefined;
  return (await getCategories()).find((c) => c.data.name === name);
}
