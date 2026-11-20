// Hides "[PLACEHOLDER: …]" reminder notes from the published site.
// They stay visible in `npm run dev` (so you can see what's still missing) and are all listed in
// TODO-content.md. Runs after the build, so it covers Markdown bodies, front matter and templates alike.
// Short field placeholders such as [YEAR] or [MEMBER NAME] are handled by the pages themselves.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOTE = /\s*\[PLACEHOLDER[^\]<]*\]/g;
// Paragraphs or list items left empty once a note is removed
const EMPTY = /<(p|li|span|dd)(\s[^>]*)?>\s*<\/\1>/g;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

export default function hidePlaceholders() {
  return {
    name: 'hide-placeholders',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let pages = 0;
        let notes = 0;
        for await (const file of htmlFiles(fileURLToPath(dir))) {
          const html = await readFile(file, 'utf8');
          const found = html.match(NOTE);
          if (!found) continue;
          notes += found.length;
          pages++;
          await writeFile(file, html.replace(NOTE, '').replace(EMPTY, ''));
        }
        logger.info(`Hid ${notes} placeholder notes on ${pages} pages (see TODO-content.md)`);
      },
    },
  };
}
