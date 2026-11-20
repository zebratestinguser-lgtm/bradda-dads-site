import { getCollection, type CollectionEntry } from 'astro:content';

export type Member = CollectionEntry<'members'>;

/** Current members, committee roles first (by `order`), then by name. */
export async function getMembers() {
  return (await getCollection('members'))
    .filter((m) => m.data.current)
    .sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

/** "Member since 2015 · 11 years" (or a placeholder until the year is added). */
export function memberSince(m: Member, now = new Date()) {
  const j = m.data.joined;
  if (!j) return 'Member since [YEAR]';
  const years = now.getFullYear() - j;
  return years < 1 ? `Joined in ${j}` : `Member since ${j} · ${years} year${years === 1 ? '' : 's'}`;
}
