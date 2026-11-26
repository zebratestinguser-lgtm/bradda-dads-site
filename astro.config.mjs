// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import hidePlaceholders from './src/integrations/hide-placeholders.mjs';
import { readdirSync, readFileSync } from 'node:fs';

// Sitemap: leave out pages search engines shouldn't list (they also carry a noindex tag):
// the search results page, and Meet the dads until at least one member has a real name.
const membersReady = readdirSync('src/content/members').some((f) => {
  const name = readFileSync(`src/content/members/${f}`, 'utf8').match(/^name:\s*"?([^"\n]*)/m)?.[1] ?? '';
  return name && !name.startsWith('[');
});
const keepInSitemap = (/** @type {string} */ page) => !/\/search\/$/.test(page) && (membersReady || !/\/members\//.test(page));

// Hosting: GitHub Pages (concept phase). If the site moves to its own domain
// (or Netlify/Cloudflare), change `site` to the new address and remove `base`.
export default defineConfig({
  site: 'https://zebratestinguser-lgtm.github.io',
  base: '/bradda-dads-site',
  trailingSlash: 'always',
  // Speed: put the (small) stylesheet inside each page, so the first paint doesn't wait for a separate CSS file
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: keepInSitemap }), hidePlaceholders()],
});
