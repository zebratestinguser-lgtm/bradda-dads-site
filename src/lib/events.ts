import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;

/** Is the event taking entries right now? (status "open" and the closing time, if set, hasn't passed) */
export const isOpen = (e: EventEntry, now = new Date()) =>
  e.data.status === 'open' && (!e.data.entriesClose || e.data.entriesClose > now);

/** The status pill for an event. */
export function statusFor(e: EventEntry, isNext: boolean, now = new Date()) {
  if (isNext) return { label: 'Next up', kind: 'next' };
  if (isOpen(e, now)) return { label: 'Open now', kind: 'open' };
  if (e.data.status === 'open') return { label: 'Entries closed', kind: 'done' };
  if (e.data.status === 'done') return { label: 'Done for this year', kind: 'done' };
  return { label: 'Coming up', kind: 'upcoming' };
}

/** True for text that's still a [PLACEHOLDER]. The homepage hides these so the concept reads as finished. */
export const isPlaceholder = (s?: string) => !s || /\[[^\]]+\]/.test(s);

/** All events in homepage order. */
export async function getEvents() {
  return (await getCollection('events')).sort((a, b) => a.data.order - b.data.order);
}

/**
 * The "Next up" event: the soonest event with a start date still in the future
 * (at build time; the site rebuilds daily so this moves on by itself).
 * Events without a start date can't be counted down to, so they're skipped.
 */
export function pickNextEvent(events: EventEntry[], now = new Date()) {
  // A start with no confirmed time counts until the end of that day.
  const endOf = (e: EventEntry) => {
    const s = e.data.start!;
    return e.data.startTimeConfirmed ? s : new Date(s.getTime() + 24 * 3600 * 1000);
  };
  return events
    .filter((e) => e.data.start && e.data.status !== 'done' && endOf(e) > now)
    .sort((a, b) => a.data.start!.getTime() - b.data.start!.getTime())[0];
}
