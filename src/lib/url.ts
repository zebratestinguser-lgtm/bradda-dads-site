/**
 * Build an internal link that respects the site's base path
 * (the site currently lives under /bradda-dads-site/ on GitHub Pages).
 * Always use this for internal links and /uploads/ image paths.
 *
 *   url('/news/')            -> /bradda-dads-site/news/
 *   url('/uploads/a.jpg')    -> /bradda-dads-site/uploads/a.jpg
 *   url('https://...')       -> unchanged
 */
export function url(path = '/'): string {
  if (/^([a-z]+:|#)/i.test(path)) return path; // external, mailto:, tel:, #anchor
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
