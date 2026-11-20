// Calendar feed of every event that has a start date: /events.ics
import type { APIRoute } from 'astro';
import { getEvents } from '../lib/events';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateOnly = (d: Date) =>
  d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }).replace(/-/g, ''); // YYYYMMDD
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export const GET: APIRoute = async ({ site }) => {
  const events = (await getEvents()).filter((e) => e.data.start);
  const now = stamp(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bradda Dads//Events//EN', 'X-WR-CALNAME:Bradda Dads', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const d = e.data;
    const start = d.start!;
    lines.push('BEGIN:VEVENT', `UID:${e.id}-${start.getFullYear()}@braddadads`, `DTSTAMP:${now}`);
    if (d.startTimeConfirmed) {
      lines.push(`DTSTART:${stamp(start)}`);
      lines.push(`DTEND:${stamp(d.end ?? new Date(start.getTime() + 2 * 3600e3))}`);
    } else {
      // Time not confirmed yet: add as an all-day event
      const next = new Date(start.getTime() + 24 * 3600e3);
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(start)}`, `DTEND;VALUE=DATE:${dateOnly(next)}`);
    }
    lines.push(`SUMMARY:${esc(d.name)}`, `LOCATION:${esc(d.location)}`, `DESCRIPTION:${esc(d.summary)}`);
    if (site) lines.push(`URL:${new URL(import.meta.env.BASE_URL, site).href}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
