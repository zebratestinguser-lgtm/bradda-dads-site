import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;

const TZ = 'Europe/London';
const DAY = 864e5;

/** 23:59:59 (UK) on the same calendar day as `d`. */
function endOfDay(d: Date) {
  const [y, m, day] = d.toLocaleDateString('en-CA', { timeZone: TZ }).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day, 23, 59, 59));
}

/**
 * When the event finishes. Multi-day events (e.g. a gala weekend) set `end`; a date-only `end`
 * means "the whole of that day". Without `end`, an event lasts until the end of its start day.
 */
export function endsAt(e: EventEntry): Date | undefined {
  const { start, end } = e.data;
  if (!start) return undefined;
  if (end) return end.getUTCHours() === 0 && end.getUTCMinutes() === 0 ? endOfDay(end) : end;
  return endOfDay(start);
}

/** Is the event happening right now (between its start and end)? */
export const isHappening = (e: EventEntry, now = new Date()) => {
  const start = e.data.start;
  const end = endsAt(e);
  return Boolean(start && end && start <= now && now <= end && e.data.status !== 'done');
};

/** Does it run over more than one day? */
export const isMultiDay = (e: EventEntry) => {
  const end = endsAt(e);
  return Boolean(e.data.start && end && end.getTime() - e.data.start.getTime() > DAY);
};

/** Is the event taking entries right now? (status "open" and the closing time, if set, hasn't passed) */
export const isOpen = (e: EventEntry, now = new Date()) =>
  e.data.status === 'open' && !e.data.entriesClosed && (!e.data.entriesClose || e.data.entriesClose > now);

/** Words for each kind of deadline: the deadline line, and the pill while open / once closed */
const DEADLINE_WORDS = {
  'Entries close': { open: 'Open now', closed: 'Entries closed' },
  'Book by': { open: 'Booking open', closed: 'Bookings closed' },
  'Orders close': { open: 'Orders open', closed: 'Orders closed' },
} as const;

type Deadline = { label: EventEntry['data']['deadlineLabel']; openText: string; closedText: string } & ({ passed: false; date: Date } | { passed: true; date?: Date });

/** The event's deadline, if it's this year's: { label: "Book by", date, passed, closedText }.
 *  "Closed now" (entriesClosed) counts as passed, with no date, until the event itself is over. */
export function deadlineFor(e: EventEntry, now = new Date()): Deadline | undefined {
  const words = DEADLINE_WORDS[e.data.deadlineLabel];
  const base = { label: e.data.deadlineLabel, openText: words.open, closedText: words.closed };
  if (e.data.entriesClosed && e.data.status !== 'done' && !hasPassed(e, now)) return { ...base, passed: true, date: e.data.entriesClose };
  const date = e.data.entriesClose;
  if (!date || e.data.status !== 'open') return undefined;
  if (date.getFullYear() < now.getFullYear() && date < now) return undefined; // last year's
  return date <= now ? { ...base, passed: true, date } : { ...base, passed: false, date };
}

/** Can people still sign up / book? Upcoming events: yes unless closed; open: before the deadline; done: no. */
export const takingBookings = (e: EventEntry, now = new Date()) =>
  e.data.status === 'open' ? isOpen(e, now) : e.data.status === 'upcoming' && !deadlineFor(e, now)?.passed;

/** "Fri 27 Nov" (UK time) */
export const shortDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });

/** The status pill for an event. */
export function statusFor(e: EventEntry, isNext: boolean, now = new Date()) {
  if (isHappening(e, now)) return { label: 'On now', kind: 'next' };
  const dl = deadlineFor(e, now);
  if (isOpen(e, now)) return { label: dl?.openText ?? 'Open now', kind: 'open' };
  // Deadline gone but the event itself is still to come (e.g. lunch bookings closed, lunch next week)
  if (dl?.passed && e.data.start && e.data.start > now) return { label: dl.closedText, kind: isNext ? 'next' : 'upcoming' };
  if (isNext) return { label: 'Next up', kind: 'next' };
  // Dates from a previous year mean this year's hasn't happened yet: it's coming round again
  const lastYear = (d?: Date) => Boolean(d && d.getFullYear() < now.getFullYear());
  if (e.data.status === 'open') return lastYear(e.data.entriesClose) ? { label: 'Coming up', kind: 'upcoming' } : { label: dl?.closedText ?? 'Entries closed', kind: 'done' };
  if (e.data.status === 'done') return { label: 'Done for this year', kind: 'done' };
  if (hasPassed(e, now)) return lastYear(endsAt(e)) ? { label: 'Coming up', kind: 'upcoming' } : { label: 'Done for this year', kind: 'done' };
  return { label: 'Coming up', kind: 'upcoming' };
}

/** This year's has already finished (dated event whose end has gone by). */
const hasPassed = (e: EventEntry, now: Date) => {
  const end = endsAt(e);
  return Boolean(end && end < now);
};

/** True for text that's still a [PLACEHOLDER]. The homepage hides these so the concept reads as finished. */
export const isPlaceholder = (s?: string) => !s || /\[[^\]]+\]/.test(s);

/**
 * Sort key for a rolling year (events repeat annually):
 *  1. open for entries now                    → first
 *  2. happening now (between start and end)   → next
 *  3. has a start date still to come           → that date
 *  4. no date yet                              → the 1st of its usual month, this year or next
 *  Events that have finished for this year ("done", entries closed, or past their end) go to next year's slot.
 */
export function nextOccurrence(e: EventEntry, now = new Date()) {
  if (isOpen(e, now)) return new Date(now.getTime() - 2 * DAY);
  if (isHappening(e, now)) return new Date(now.getTime() - DAY);
  if (e.data.start && e.data.start > now && e.data.status !== 'done') return e.data.start;
  const month = e.data.month ?? (e.data.start ? e.data.start.getMonth() + 1 : 12);
  const thisYear = new Date(now.getFullYear(), month - 1, 1);
  const nextYear = new Date(now.getFullYear() + 1, month - 1, 1);
  const finished = e.data.status === 'done' || e.data.status === 'open' || hasPassed(e, now);
  if (finished) return thisYear > now ? thisYear : nextYear;
  // Upcoming with no date yet: counts as this year's slot until its month has passed
  const monthEnd = new Date(now.getFullYear(), month, 1);
  return now < monthEnd ? thisYear : nextYear;
}

/** All events in rolling-year order: open/on now first, then upcoming, with this year's finished ones last. */
export async function getEvents(now = new Date()) {
  return (await getCollection('events')).sort(
    (a, b) => nextOccurrence(a, now).getTime() - nextOccurrence(b, now).getTime() || a.data.order - b.data.order,
  );
}

/**
 * The "Next up" event for the homepage hero: one happening now, otherwise the soonest with a start date
 * still to come (at build time; the site rebuilds daily so this moves on by itself).
 */
export function pickNextEvent(events: EventEntry[], now = new Date()) {
  const happening = events.find((e) => isHappening(e, now));
  if (happening) return happening;
  return events
    .filter((e) => e.data.start && e.data.status !== 'done' && e.data.start > now)
    .sort((a, b) => a.data.start!.getTime() - b.data.start!.getTime())[0];
}

/** "Saturday 26 December" or, for multi-day events, "Friday 24 – Sunday 26 July" (adds months/years as needed). */
export function formatEventDates(e: EventEntry, withYear = false): string | undefined {
  const start = e.data.start;
  if (!start) return undefined;
  const opts: Intl.DateTimeFormatOptions = { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) };
  const end = endsAt(e)!;
  if (!isMultiDay(e)) return start.toLocaleDateString('en-GB', opts);
  const sameMonth = start.toLocaleDateString('en-GB', { timeZone: TZ, month: 'long', year: 'numeric' }) === end.toLocaleDateString('en-GB', { timeZone: TZ, month: 'long', year: 'numeric' });
  const startText = start.toLocaleDateString('en-GB', sameMonth ? { timeZone: TZ, weekday: 'long', day: 'numeric' } : { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
  return `${startText} – ${end.toLocaleDateString('en-GB', opts)}`;
}
