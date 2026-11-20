/** Date helpers. Everything is shown in UK time. */
const TZ = 'Europe/London';

/** "Saturday 26 December" */
export const formatEventDay = (d: Date) =>
  d.toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

/** "11:00am" */
export const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '');

/** "20 November 2026" */
export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

/** "20 Nov" */
export const formatShortDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' });

/** Very small **bold** support for one-line fields (escapes everything else). */
export function inlineBold(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
