// One event as a calendar file (/events/duck-race.ics): "Add to calendar" for Apple, Outlook and others.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEvents, type EventEntry } from '../../lib/events';
import { icsEvent, icsCalendar } from '../../lib/calendar';

export const getStaticPaths = (async () => {
  const events = (await getEvents()).filter((e) => e.data.start);
  return events.map((event) => ({ params: { id: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, site }) => {
  const event = props.event as EventEntry;
  const base = new URL(import.meta.env.BASE_URL, site ?? 'http://localhost/');
  const body = icsCalendar([icsEvent(event, new URL(`events/${event.id}/`, base).href)], event.data.name);
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
