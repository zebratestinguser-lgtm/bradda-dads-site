// Calendar helpers: .ics entries (the /events.ics feed and one file per event), "Add to Google Calendar"
// links, and the Event details Google reads from each event page (schema.org JSON-LD).
import { endsAt, isPlaceholder, type EventEntry } from './events';

const TZ = 'Europe/London';
const DAY = 864e5;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
/** YYYYMMDD in UK time */
const dateOnly = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ }).replace(/-/g, '');
/** YYYY-MM-DD in UK time */
const isoDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** Location for calendars: the real place, or just "Bradwell" while it's still a placeholder */
const place = (e: EventEntry) => (isPlaceholder(e.data.location) ? 'Bradwell, Derbyshire' : `${e.data.location}, Bradwell, Derbyshire`);

/** Does the event have a date that hasn't finished yet? (Only then do we offer "Add to calendar".) */
export const canAddToCalendar = (e: EventEntry, now = new Date()) => {
  const end = endsAt(e);
  return Boolean(e.data.start && end && end > now && e.data.status !== 'done');
};

/** Start and end for calendars: exact times once confirmed, otherwise all-day (end = the day after the last day). */
function span(e: EventEntry) {
  const d = e.data;
  const start = d.start!;
  if (d.startTimeConfirmed) return { allDay: false, start, end: d.end ?? new Date(start.getTime() + 2 * 3600e3) };
  const last = endsAt(e) ?? start;
  return { allDay: true, start, end: new Date(last.getTime() + DAY / 2) };
}

/** The VEVENT lines for one event (must have a start date). */
export function icsEvent(e: EventEntry, pageUrl: string, now = new Date()): string[] {
  const d = e.data;
  const s = span(e);
  const lines = ['BEGIN:VEVENT', `UID:${e.id}-${d.start!.getFullYear()}@braddadads`, `DTSTAMP:${stamp(now)}`];
  if (s.allDay) lines.push(`DTSTART;VALUE=DATE:${dateOnly(s.start)}`, `DTEND;VALUE=DATE:${dateOnly(s.end)}`);
  else lines.push(`DTSTART:${stamp(s.start)}`, `DTEND:${stamp(s.end)}`);
  const note = d.startTimeConfirmed ? d.summary : `${d.summary} (Start time to be confirmed: see ${pageUrl})`;
  lines.push(`SUMMARY:${esc(d.name)}`, `LOCATION:${esc(place(e))}`, `DESCRIPTION:${esc(note)}`, `URL:${pageUrl}`, 'END:VEVENT');
  return lines;
}

/** A whole calendar file around some VEVENTs. */
export function icsCalendar(events: string[][], name = 'Bradda Dads'): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bradda Dads//Events//EN', `X-WR-CALNAME:${esc(name)}`, 'CALSCALE:GREGORIAN', ...events.flat(), 'END:VCALENDAR'];
  return lines.join('\r\n') + '\r\n';
}

/** "Add to Google Calendar" link (opens Google's own new-event form; nothing is sent until the person saves it). */
export function googleCalendarUrl(e: EventEntry, pageUrl: string): string {
  const s = span(e);
  const dates = s.allDay ? `${dateOnly(s.start)}/${dateOnly(s.end)}` : `${stamp(s.start)}/${stamp(s.end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.data.name,
    dates,
    details: `${e.data.summary}\n\n${pageUrl}`,
    location: place(e),
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * schema.org Event for Google (can show the date in search results). Only facts we actually have:
 * date-only start while the time isn't confirmed, no price unless one is set.
 */
export function eventJsonLd(e: EventEntry, opts: { pageUrl: string; imageUrl?: string; siteUrl: string; siteName: string; ctaUrl?: string }) {
  const d = e.data;
  if (!d.start) return undefined;
  const end = d.end ?? (d.startTimeConfirmed ? undefined : d.start);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: d.name,
    description: d.summary,
    startDate: d.startTimeConfirmed ? d.start.toISOString() : isoDate(d.start),
    ...(end ? { endDate: d.startTimeConfirmed ? end.toISOString() : isoDate(endsAt(e) ?? end) } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: isPlaceholder(d.location) ? 'Bradwell' : d.location,
      address: { '@type': 'PostalAddress', addressLocality: 'Bradwell', addressRegion: 'Derbyshire', addressCountry: 'GB' },
    },
    organizer: { '@type': 'Organization', name: opts.siteName, url: opts.siteUrl },
    url: opts.pageUrl,
  };
  if (opts.imageUrl) data.image = [opts.imageUrl];
  if (opts.ctaUrl && /^https:/.test(opts.ctaUrl)) {
    const price = d.price?.match(/£\s*(\d+(?:\.\d{1,2})?)/)?.[1];
    data.offers = { '@type': 'Offer', url: opts.ctaUrl, availability: 'https://schema.org/InStock', ...(price ? { price, priceCurrency: 'GBP' } : {}) };
  }
  return data;
}
