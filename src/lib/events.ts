import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;

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
