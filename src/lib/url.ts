/**
 * Build an internal link that respects the site's base path
 * (the site currently lives under /bradda-dads-site/ on GitHub Pages).
 * Always use this for internal links and /uploads/ image paths.
 *
 *   url('/news/')            -> /bradda-dads-site/news/
 *   url('/uploads/a.jpg')    -> /bradda-dads-site/uploads/a.jpg
 *   url('https://...')       -> unchanged
 */
/**
 * Small (480px) preview of an uploaded photo, made by scripts/make-thumbs.mjs.
 *   thumb('/uploads/albums/x/001.jpg') -> /bradda-dads-site/uploads/thumbs/albums/x/001.webp
 * Use for grids, cards and lists; link to url(src) for the full-size photo.
 */
export function thumb(src: string): string {
  const m = src.match(/^\/uploads\/(.+)\.(jpe?g|png|webp|avif|gif)$/i);
  return m && !src.startsWith('/uploads/thumbs/') ? url(`/uploads/thumbs/${m[1]}.webp`) : url(src);
}

export function url(path = '/'): string {
  if (/^([a-z]+:|#)/i.test(path)) return path; // external, mailto:, tel:, #anchor
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
