import { getEntry } from 'astro:content';
import { url } from './url';

/**
 * Page wording that editors change in Pages CMS ("Page wording" forms). Each page has a file in
 * src/content/pages/ (e.g. donate.md) whose fields hold the headings, intros and paragraphs.
 *
 * Text can use a little formatting, so editors don't need HTML:
 *   - a blank line starts a new paragraph
 *   - lines starting "- " make a bullet list; a line starting "## " is a heading
 *   - [words](/contact/) makes a link (site pages start with "/"; other sites with "https://")
 *   - **words** makes bold text
 *   - {name} markers are filled in by the site (e.g. {count} with a number); each form says which exist
 */
export async function getWording(id: string) {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Page wording file src/content/pages/${id}.md is missing`);
  const data = entry.data as Record<string, unknown>;

  const raw = (key: string, vars: Record<string, string | number> = {}) => {
    const v = data[key];
    if (v === undefined || v === null || v === '') {
      console.warn(`[wording] "${key}" is empty in src/content/pages/${id}.md`);
      return '';
    }
    return String(v).replace(/\{(\w[\w-]*)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  };

  return {
    data,
    /** Plain text (for titles, attributes and short lines) */
    text: (key: string, vars?: Record<string, string | number>) => raw(key, vars),
    /** One line with links/bold, no paragraph */
    inline: (key: string, vars?: Record<string, string | number>) => inlineHtml(raw(key, vars)),
    /** Paragraphs and bullet lists */
    html: (key: string, vars?: Record<string, string | number>) => blockHtml(raw(key, vars)),
    /** A list field (e.g. steps, ways to help) */
    list: <T = Record<string, unknown>>(key: string) => (Array.isArray(data[key]) ? (data[key] as T[]) : []),
  };
}

export type Wording = Awaited<ReturnType<typeof getWording>>;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const href = (u: string) => (u.startsWith('/') ? url(u) : u);

/** Links and bold inside one line of text */
export function inlineHtml(text: string): string {
  return escape(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, words, u) => `<a href="${escape(href(u.replace(/&amp;/g, '&')))}">${words}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** Paragraphs (blank line between) and bullet lists ("- " at the start of a line) */
export function blockHtml(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      const heading = block.match(/^(#{2,3}) (.+)$/);
      if (heading && lines.length === 1) return `<h${heading[1].length}>${inlineHtml(heading[2])}</h${heading[1].length}>`;
      if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inlineHtml(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
      return `<p>${inlineHtml(lines.join(' '))}</p>`;
    })
    .join('\n');
}
