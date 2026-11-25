// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import hidePlaceholders from './src/integrations/hide-placeholders.mjs';

// Hosting: GitHub Pages (concept phase). If the site moves to its own domain
// (or Netlify/Cloudflare), change `site` to the new address and remove `base`.
export default defineConfig({
  site: 'https://zebratestinguser-lgtm.github.io',
  base: '/bradda-dads-site',
  trailingSlash: 'always',
  // Speed: put the (small) stylesheet inside each page, so the first paint doesn't wait for a separate CSS file
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap(), hidePlaceholders()],
});
