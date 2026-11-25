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

/**
 * Responsive image sources for an uploaded photo: the 480px and 960px WebP copies plus the original
 * (up to 1200px). Pair with a `sizes` attribute so phones download the smaller copies.
 *   <img src={url(src)} srcset={srcset(src)} sizes="100vw" />
 */
export function srcset(src: string): string | undefined {
  const m = src.match(/^\/uploads\/(.+)\.(jpe?g|png|webp|avif|gif)$/i);
  if (!m || src.startsWith('/uploads/thumbs/')) return undefined;
  return `${url(`/uploads/thumbs/${m[1]}.webp`)} 480w, ${url(`/uploads/thumbs/960/${m[1]}.webp`)} 960w, ${url(src)} 1200w`;
}

/** 320px preview (phone grids, small thumbnails); falls back to the original for non-photos */
export function small(src: string): string {
  const m = src.match(/^\/uploads\/(.+)\.(jpe?g|png|webp|avif|gif)$/i);
  return m && !src.startsWith('/uploads/thumbs/') ? url(`/uploads/thumbs/320/${m[1]}.webp`) : url(src);
}

/** srcset for grid/card images: 320px and 480px previews (pair with a sizes attribute) */
export function thumbSet(src: string): string | undefined {
  const s = small(src);
  const t = thumb(src);
  return s === t ? undefined : `${s} 320w, ${t} 480w`;
}

export function url(path = '/'): string {
  if (/^([a-z]+:|#)/i.test(path)) return path; // external, mailto:, tel:, #anchor
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/**
 * AVIF versions of the preview images (made by scripts/make-thumbs.mjs next to the WebP ones), for a
 * <picture> <source type="image/avif">. 'grid' = 320/480px (cards, grids), 'large' = 480/960px (headers).
 */
export function avifSet(src: string, kind: 'grid' | 'large'): string | undefined {
  const m = src.match(/^\/uploads\/(.+)\.(jpe?g|png|webp|gif)$/i);
  if (!m || src.startsWith('/uploads/thumbs/')) return undefined;
  const a = (dir: string) => url(`/uploads/thumbs/${dir}${m[1]}.avif`);
  return kind === 'grid' ? `${a('320/')} 320w, ${a('')} 480w` : `${a('')} 480w, ${a('960/')} 960w`;
}
