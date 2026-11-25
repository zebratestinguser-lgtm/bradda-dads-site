// Calendar feed of every event that has a start date: /events.ics
import type { APIRoute } from 'astro';
import { getEvents } from '../lib/events';
import { icsEvent, icsCalendar } from '../lib/calendar';

export const GET: APIRoute = async ({ site }) => {
  const base = new URL(import.meta.env.BASE_URL, site ?? 'http://localhost/');
  const events = (await getEvents()).filter((e) => e.data.start);
  const body = icsCalendar(events.map((e) => icsEvent(e, new URL(`events/${e.id}/`, base).href)));
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
