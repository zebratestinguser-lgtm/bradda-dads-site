# Bradda Dads website: project brief

This file is the handover for building the new Bradda Dads website. Read it fully before writing code. The visual design is in `design/homepage-mockup.dc.html` (see "The design file" below).

## About the group

- Bradda Dads is a volunteer group of dads in Bradwell, Derbyshire (Peak District), run as a CIC. It raises money for, and helps, people and organisations in the village.
- First fundraiser: the Boxing Day Duck Race down the brook, 1999.
- Annual activities: village Bonfire & Fireworks (November), village Christmas card (£5 per family message), free pensioners' Christmas lunch, Boxing Day Duck Race (26 December), and the Wolfspit Race (date TBC).
- Also funds local projects, e.g. lighting and stage equipment for school productions, grants to local groups.
- Facebook: https://www.facebook.com/BraddaDads/ (main day-to-day channel)
- Old sites (both to be migrated, see "Content migration" milestone): **https://braddadads.blogspot.com/** (oldest) and **https://braddadads.wordpress.com/** (newest). Parish listing: bradda.org/village_organisation/bradda-dads/
- Facts found on the old sites (dates, history, results, photos) are real content and can replace placeholders, but record the source URL for each one in `TODO-content.md` or the entry's front matter so Peter can check it.
- Payments are taken through an existing **SumUp** account (online store + payment links).

**Never invent facts** (dates, prices, totals, names, race results, history). Anything unknown stays a visible `[PLACEHOLDER]` and is listed in `TODO-content.md`.

## Decisions already made

1. **Static site, own domain, own hosting.** Not WordPress.
2. **Stack:** Astro (latest stable), TypeScript, plain CSS (custom properties) or scoped component styles. No heavy UI framework. Minimal client JS (countdown, results search/filter, year tabs, map).
3. **Hosting:** ~~Netlify~~ **Changed 2026-11-20: GitHub Pages for the concept phase** (Peter has hit Netlify free-tier limits before). Repo: `github.com/zebratestinguser-lgtm/bradda-dads-site`, site at `https://zebratestinguser-lgtm.github.io/bradda-dads-site/`, deployed by `.github/workflows/deploy.yml`. Consequences: no `netlify.toml`; Netlify Forms are unavailable, so the Christmas card form is built but not wired up (later: Formspree/Google Form, or move host); no redirects/headers. Keep the site host-agnostic: always link via `url()` in `src/lib/url.ts` so moving to a custom domain or another host is just `site`/`base` in `astro.config.mjs`. Note: Netlify Identity was deprecated in 2025, so phase 2 logins should plan on DecapBridge (works with GitHub).
4. **Phasing:** (phase 2 now uses Pages CMS, see "Phase 2: team editing" below)
   - **Phase 1 (now): Peter maintains it alone.** All content lives as Markdown/YAML/CSV files in the repo. Peter edits files (or asks Claude Code to), commits, GitHub Actions rebuilds.
   - **Phase 2 (later): other committee members can edit** via Decap CMS at `/admin`, logging in with email through Netlify Identity + Git Gateway (or DecapBridge as fallback). No GitHub accounts needed for editors.
5. **Phase 1 must be "Decap-ready"** so phase 2 is configuration only, not a restructure (see Content model rules).

## Content model (Astro content collections)

Use the content layer with `glob` loaders. Validate with Zod schemas. Every field below must be something a non-technical editor could fill in a form later.

| Collection | Location | Fields |
|---|---|---|
| `news` | `src/content/news/YYYY-MM-DD-slug.md` | `title`, `date`, `tag` (enum: Bonfire, Christmas card, Pensioners' lunch, Duck race, Wolfspit, Village), `image` (optional), `imageAlt`, `summary`, `featured` (bool), body (Markdown) |
| `events` | `src/content/events/slug.md` | `name`, `start` (datetime, Europe/London), `end` (optional), `location`, `summary`, `status` (upcoming / open / done), `ctaLabel`, `ctaUrl` (usually a SumUp link), `order`, body |
| `albums` | `src/content/albums/slug.md` + images in same folder or `public/uploads/albums/slug/` | `title`, `event` (reference to events), `date`, `cover`, `photos` (list of `{src, alt, caption?}`) |
| `results` | `src/content/results/wolfspit/YYYY.md` + `YYYY.csv` | md: `year`, `date`, `courseNotes`, `finishers` (computed if absent), `csv` (file path); CSV columns below |
| `timeline` | `src/content/timeline/YYYY-slug.md` | `year` (string, allows "[YEAR]"), `title`, `text`, `image` (optional) |
| `funded` | `src/content/funded/slug.md` | `name`, `lat`, `lng`, `year`, `amount` (optional), `summary`, `image` (optional) — drives the "where the money goes" map |
| settings | `src/data/site.yaml` | site name, Facebook URL, contact email, CIC name/number, SumUp store URL, donation links `{amount, url, label}` ×3, donation QR image, total raised, groups helped, meeting info |

**Content model rules (for Decap later):**
- One file per entry, front matter + Markdown body. No content hard-coded in components.
- Images referenced by path in front matter; keep one predictable media folder (`public/uploads/...` or `src/assets/uploads/...` — pick one and stick to it).
- Dates ISO 8601. Booleans and enums only where a form widget can express them.

### Wolfspit results CSV

Header row (exact): `position,name,club,category,time`
- `time` as `H:MM:SS`. `category` free text (e.g. MO, FV40, U18). Blank club allowed.
- The site derives: podium (overall winner, first woman, first junior — category matching rules configurable in one place), finisher count, searchable/filterable table, CSV download link, year tabs from the files present.
- Add a results page per year (`/wolfspit/2026/`) plus `/wolfspit/` landing that defaults to the latest year. Runner search across all years is a nice-to-have.

## Pages

- `/` homepage (the design file is the spec)
- `/news/` list + `/news/[slug]/`
- `/events/[slug]/` (each event: details, last year's photos, CTA)
- `/christmas-card/` (explains it, links to SumUp payment; see Payments)
- `/photos/` albums grid + `/photos/[slug]/` with lightbox (keyboard accessible)
- `/wolfspit/` and `/wolfspit/[year]/`
- `/our-story/` full timeline
- `/where-the-money-goes/` full map
- `/get-involved/`, `/donate/`, `/contact/`, `/privacy/`
- 404 page

## Homepage sections (top to bottom, per the design)

1. Header: duck logo (original inline SVG in the design file), nav: Events, News, Photos, Wolfspit results, Our story, Get involved (pill button).
2. Hero: "Next up" event, auto-picked as the next upcoming `events` entry by `start`. Live countdown (days/hours/mins). Primary CTA (SumUp link) + "All events".
3. "The Bradda Dads year": event cards from `events`, status tag, CTA.
4. News: one featured story + three recent.
5. Christmas card banner (only shown while the card event is `open`).
6. Wolfspit results band (dark): year tabs, podium, search, category filter, table (first 6 rows), "see all", download CSV, "Enter [next year]".
7. Photos: album grid + "Share your photos" button (phase 1: mailto or Facebook link; phase 2+: an upload form).
8. Our story: intro + archive photo + timeline.
9. Where the money goes: map with pins from `funded` + stats from settings.
10. Donate: £5 / £10 / £20 buttons (SumUp reusable payment links from settings), QR code, link to SumUp store, "Secure payments by SumUp".
11. Join us + latest Facebook posts (phase 1: link out or 3 manually curated posts; don't add a heavy Facebook embed without asking).
12. Footer: name, "Raising money for Bradwell, Derbyshire, since 1999", CIC details, links.

## Design tokens (from the mockup)

- Colours: green `#1D3B2C`, deep green (footer/results) `#10241A`, duck yellow `#F6C343`, warm yellow panel `#FBE9B7`, orange accent `#E8702A`, text `#1A1F1C`, muted text `#4B5A51` / `#34413A`, light surface `#F1F4F2`, border `#E3E8E4`, on-dark muted `#C9D6CD` / `#DFE9E2`.
- Type: headings **Bricolage Grotesque** (500/700/800), body **Inter** (400/500/600). Self-host the fonts (no Google Fonts CDN, for privacy).
- Shapes: pill buttons (`border-radius: 999px`), cards 18–32px radius, min touch target 44px.
- Tone: friendly, local, a bit playful. Rubber duck motif. No stock-photo feel.

## Payments (SumUp)

- Phase 1: **links only.** Buttons point to SumUp store product pages or SumUp reusable payment links stored in `site.yaml` / event front matter. No API keys in the repo.
- Christmas card: needs the family's message as well as £5. Phase 1 approach: a Netlify Form collects name + message, then the thank-you page sends them to the £5 SumUp link. Treasurer reconciles. (Phase 3 option: SumUp Payment Widget with a Netlify Function creating checkouts so message and payment are linked; requires a SumUp API key in Netlify env vars.)

## Map

- Leaflet with OpenStreetMap tiles (correct attribution). Pins from `funded`. Lazy-load the map script. Provide a text list fallback for accessibility.

## Quality bar

- Accessible: semantic HTML, real buttons/links/labels, visible focus, colour contrast ≥ 4.5:1, alt text required in schemas, lightbox and tabs keyboard-operable, `prefers-reduced-motion` respected.
- Mobile first; the design must work at 360px wide.
- Performance: Astro `<Image>` for responsive images, compress uploads, no layout shift, Lighthouse ≥ 90 across the board.
- Privacy: no tracking by default. If analytics are wanted, use a cookieless option and ask first. Privacy page placeholder.
- SEO basics: titles, descriptions, Open Graph image, sitemap, `robots.txt`.

## Repo layout

```
/design/homepage-mockup.dc.html   # reference only, not built
/src/content/...                  # collections above
/src/data/site.yaml
/src/components/...
/src/layouts/...
/src/pages/...
/public/uploads/...
/TODO-content.md                  # every [PLACEHOLDER] still to fill
/docs/how-to-update.md            # phase 1: Peter's guide; phase 2: editors' guide
/.github/workflows/deploy.yml     # GitHub Pages build (replaces netlify.toml for now)
```

## Implementation notes (added during build)

- Astro 7, Zod 4 (`import { z } from 'astro/zod'`). Schemas in `src/content.config.ts`.
- Uploads folder: **`public/uploads/`**, referenced as `/uploads/...` in front matter (schema enforces this).
- `site.yaml` sits under a top-level `site:` key (Astro's file loader); read it with `getSite()` from `src/lib/site.ts`.
- Events: `when` is the display label ("26 December"); `start` is optional; `startTimeConfirmed: false` shows `[START TIME]` instead of a made-up time.
- Timeline entries have an `order` field (years can be "[YEAR]" so they can't be sorted by year).
- Wolfspit CSV parsing + podium rules: `src/lib/results.ts` (`PODIUM_RULES`).
- Results support several races: `src/content/results/<race>/YYYY.md|csv` with races `wolfspit`, `tour-of-bradwell-long`, `tour-of-bradwell-half`, `tour-of-bradwell` (`RACES` in `content.config.ts`, `getRaceYears(race)`). Optional `original` (PDF in `/uploads/results/`) and `notes`.
- News tags gained `Carnival`, `Tour of Bradwell`, `Social` (legacy activities). News has optional `album` (reference) and every collection has optional `source` (URL of the original post).
- Funded pins have `locationConfirmed` (false = guessed position, shown as "to be confirmed").
- Imported photos have generic alt text; homepage-visible ones should get real descriptions (TODO-content.md).
- **Photo dates must always be visible** (Peter's request): album `date` = when the photos were taken, `dateLabel` overrides it for ranges/unknowns. Use `photoDate()` / `photoDateShort()` from `src/lib/albums.ts` wherever a photo appears (album cards show a date chip, album pages say "Photos taken …", the lightbox caption starts with the date, news images have a "Photo taken …" caption).
- Milestone 4 routes: `/news/`, `/news/[id]/`, `/events/[id]/`, `/photos/`, `/photos/[id]/` (native `<dialog>` lightbox, no library), `/wolfspit/` (+ cross-year runner search), `/wolfspit/[year]/`, `/tour-of-bradwell/`, `/tour-of-bradwell/[slug]/` (`long-tour-2017`, `half-tour-2016`, `2019`), CSV endpoints, `/our-story/`, `/where-the-money-goes/`, `/get-involved/`, `/donate/`, `/contact/`, `/privacy/` (draft), `/christmas-card/` (form in M5).
- Albums have a `category` (same list as news tags: Carnival, Duck race, Bonfire, Pensioners' lunch, Christmas card, Wolfspit, Tour of Bradwell, Social, Village). The photos page filters by it (deep link `/photos/?category=Carnival`), album cards show it, and event pages show albums whose category matches the event (`EVENT_TAG` in `src/lib/albums.ts`) as well as any with `event:` set.
- Header is sticky (pinned) on all sizes. Below 1080px it becomes logo + a labelled "Menu" button with a drop-down panel (aria-expanded, Esc closes and returns focus, closes on outside click). Without JS the links show as a plain wrapped list. `scroll-padding-top` keeps jump links clear of it.
- Photo previews: `scripts/make-thumbs.mjs` (sharp, devDependency) writes 480px WebP previews to `public/uploads/thumbs/` (gitignored, regenerated by `predev`/`prebuild`, incremental). Use `thumb(src)` from `src/lib/url.ts` in grids/cards/lists, `url(src)` for full size.
- Homepage hero photo: `heroImage`/`heroImageAlt`/`heroImageCaption` on the event (caption must include when it was taken). News stories without a photo use `NewsTile` (coloured tile with the duck and the tag), never a grey placeholder.
- Fabian4 entry-site logos were removed from four Wolf's Pit entry posts (2020, 2022, 2025, 2026). They weren't photos.
- Styling: `BrookEdge` (wavy edge, optional bobbing duck) closes the green hero/page headers. Cards lift on hover (mouse only, not with reduced motion), and buttons have a press effect (global.css). Share image: `public/og-image.jpg` (1200×630, from `scripts/qa/og-image-source.html`) is the default `og:image`. All colour pairs pass WCAG AA (`node scripts/qa/contrast.mjs`).
- **Closed event cards:** cards whose status pill is "done" (Entries closed / Done for this year) get `event-card--closed`: blue-grey #DFE7EC with a dashed edge, a padlock or tick in the pill, and the sign-up button hidden when entries have closed (status open but past entriesClose).
- **Events repeat yearly.** `getEvents()` sorts by `nextOccurrence()`: open for entries now → happening now (start–`end`) → future start dates → usual `month` slot. Events finished for this year go to next year's slot. Multi-day events (e.g. a gala) set `end` (a date-only end = whole day). They show "On now" and stay the hero's event until their last day, with date ranges via `formatEventDates()`. Status pills: `statusFor()`. Old-year dates read as "Coming up".
- **Homepage** = Hero, events carousel (EventsYear, rolling order, no auto-play), news, Christmas card banner (while `entriesClose` not passed), Explore tiles, join/donate strip. The Wolf's Pit results band lives on `/wolfspit/`. Diary dates (`DiaryDates`) are on `/events/` and `/get-involved/`. Don't re-grow the homepage: new content gets its own page.
- **Waves:** every section is separated by a wave and duck. Pages wrap each section in `<Band>` (`src/components/Band.astro`): the first one under a green header is `<Band first>` (white, no wave); after that alternate `tone="mist"` / white, and each band draws its own wave above itself (`BrookEdge position="rise"`, in its own colour). The footer does the same in deep green. Inside a band use `var(--panel)` for tinted boxes (white on mist, pale grey on white). Duck positions look random but are worked out at build time from the page address + wave number (`src/lib/seed.ts`), so they never move on refresh or rebuild.
- **Search:** Pagefind runs on `postbuild` (indexes `<main data-pagefind-body>`, with filter `type`). The `/search/` page uses Pagefind UI with `baseUrl` = the base path. It only works on built output (`npm run build && npx astro preview`), not `astro dev`. Test with `scripts/qa/cdp-check.mjs`.
- **Members:** `src/content/members/*.md` → `/members/` + `/members/[id]/` (duck avatar until a photo is added, "Member since YEAR · N years"). Placeholders only until each member agrees to publish their name and photo.
- **Photo descriptions:** all 94 album covers (= first photo = news image) have real descriptions with dates. The rest are still generic.
- **Duck race wording:** people buy a numbered *entry* (each duck is numbered); they don't "buy a duck". Use "Buy an entry", "duck race entries", "numbered duck".
- **Titles:** news and album titles use sentence case with names capitalised ("Boxing Day duck race 2009", "Wolf's Pit 2025 results"), no full dates (cards show the date), no shouting or stray dashes.
- **Duck Dash game:** /game/ (src/pages/game.astro, canvas, no libraries, synthesised sounds). Steer a duck down the brook (left/right/up/down: drag, arrow keys or WASD, on-screen buttons). Ducklings (+10) follow in a line and are lives: a bump from a branch or rock loses the last one (1.4s protection), game over only with none left. (A heron was tried and removed at Peter's request: don't bring it back.) Whirlpools pull you in; their centre spins a duckling away. Numbered race ducks drift slower and are bumpers: hitting one bounces you both apart (no lives or points lost). Rare golden duck: double points for 10s. Four levels, one per season, 30s each: start in today's season and go through the year in order (winter → spring → summer → autumn), each faster than the last, with a banner and a progress bar; Every season change (30s) steps the speed up (150 + 55 px/s per season, capped 720) and bumps cost more ducklings (1, 2, 3, then 4; fewer than that left = lose them all, game over only when bumped with none). At the end of each year choose Finish (bank the score + 25 per duckling still in the line) or Keep swimming (seasons carry on getting faster; duckling bonus lost if knocked out). Ducklings are rarer: at most one per ~700px of swimming (scaled by speed). Seasons look different (snow / blossom / lily pads / autumn leaves). Optional "Sound & buzz" (off by default, remembered). Best score in localStorage. Test aids: ?test (no game over with an empty line) and ?season=winter|spring|summer|autumn. Our own design: don't make it look like any existing game.
- **Overscroll:** html and body have overscroll-behavior: none (both axes) and body overflow-x: clip, so no white flash or sideways drag. Trade-off: this also disables the two-finger swipe-back gesture in Chromium browsers.
- **App icons:** `scripts/make-icons.mjs` makes public/apple-touch-icon.png and icon-192/512.png (duck on green with water); `public/manifest.webmanifest`. Accessibility statement: /accessibility/ (counts undescribed photos at build via `GENERIC` in src/lib/photos.ts).
- **Spelling:** always "Wolf's Pit" (never "Wolfspit" in visible text; URLs stay `/wolfspit/`). The race page mentions "sometimes written Wolfspit" once, for search.
- **Event pages** always follow the same four parts: What's happening (Markdown body), When and where (dates/time/place + `whenWhereNote`), How to get involved (`involvement` cards; `onlyWhenOpen` hides a card after entries close), From past years (results link for the race, albums, news).
- **Joining wording** lives in site.yaml (`joinHeadline`, `joinText`), accurate to the current constitution (members are dads; everyone can help). Post-vote (Feb 2027) alternatives are commented underneath. Don't claim open membership before the vote.
- **News page:** search box, 6 latest cards (photo, or a slim coloured strip), then the archive folded by year (`<details>`). Topic filters open every matching year. Story dates read "Posted …".
- **Placeholders on the published site:** `src/integrations/hide-placeholders.mjs` strips every `[PLACEHOLDER: …]` note from the built HTML (they still show in `npm run dev`, and all live in TODO-content.md). Short field placeholders (`[YEAR]`, `[MEMBER NAME]`, `[TOTAL]`, `[CONTACT EMAIL]`, `[CIC NAME]`) are hidden by the pages with `isPlaceholder()`. Member cards/profile pages only exist once a real name replaces `[MEMBER NAME]` (`getPublishedMembers()`).
- **Photos instead of stand-ins** (`src/lib/photos.ts`): news stories without a photo borrow an archive photo from the same kind of event, chip-labelled "Archive photo · Nov 2008" (different album per card where possible); event page headers show `heroImage` or the latest real scene from that event's albums (`PageHeader` `image`/`imageLabel`); album cards lead with a real scene instead of a scanned poster/results sheet when one is described (`displayCover()`); Meet the dads opens with a group photo.
- **Colours (2026-11-21): brook blue.** Page background `--water` #E6F0F5, alternate bands `--water-deep` #CFE3EE (Band tone "white" = water, "mist" = deep water), cards and panels white (`--panel`), boxes inside white cards `--surface` #EEF5F9, borders blue-tinted. `--brook` #8FB7D6 is decoration only. Focus outline: `--focus` dark orange #C4511A on light areas, yellow inside green areas (list in global.css). `html` is deep green with `overscroll-behavior-y: none` (no white flash when over-scrolling). All pairs in scripts/qa/contrast.mjs.
- **Phone design (most visitors):** at ≤600px the homepage hero is compact (16:9 photo, small countdown), carousel arrows hide (swipe), Explore tiles, Browse-by-event tiles and all album grids go two per row (album cards show just a square cover; long titles clamp to 3 lines), news page keeps the newest story big and turns the rest into compact rows, results tables move club and category under the runner's name (`.col-club`/`.col-cat` hidden, `.club-inline` shown), album page links become pills, and event pages show a sticky bottom bar with the main action once the header button scrolls away (hidden at the footer). Cards get a gentle press on tap (`hover: none`). Check phone widths 320/360/390/414 with scripts/qa/layout-audit.html after layout changes.
- **Ducks on waves:** BrookEdge draws 1–5 ducks per wave (35/28/20/10/7%), sizes 28–52px: a family (biggest duck leading, spaced in px; 4–5 ducks are usually a family and start further left) or spread one per slice. Seeded from page path + wave seed, so fixed per page (changing the generator moves every duck once). The duck drawing faces RIGHT; `is-flipped` = facing left. Phones scale ducks to 72%.
- **Swimming ducks:** each group's place along its wave follows the wave's position on screen over its real journey (from fully on screen at the bottom, or its starting place near the top of the page, up to just under the sticky header, or as high as the end of the page allows): start = left end of its range, halfway = resting spot, end = right end (range up to 35% of the screen width each way, stopping 8px from the screen edge). So ducks move whenever the page scrolls, on any screen height, and scrolling up brings them back. They face the way they swim, turning on the first pixel of a direction change. Movement is a spring: leaders and lone ducks are brisk; each duckling gets its own slower spring (random per page load) so it trails, catches up and may overshoot slightly. On a turn the leader flips first, then each duckling in order ~150ms apart (pending turns cancel if the direction changes back), and the family's line-up mirrors so the leader stays in front. Off with prefers-reduced-motion.
- **Events carousel loop:** laps of ["Round again" marker + cards]; copies before and after the real lap; recentres invisibly on scrollend; buttons step to the next/previous item (marker included).
- **Page designs (2026-11-21):** most inner pages have a photo header (PageHeader `image`/`imageLabel`, picked by description with `photoMatching()` in src/lib/photos.ts). Photos page = Browse by event tiles (`categoryPhoto()`) + one continuous album grid (year buttons jump to each year's first album). Albums with one photo show it full size. Our story = one-sided timeline with a duck per year and a photo from that year (`yearPhoto()`); entries with an unknown year are listed under "Also part of the story". News stories: photo header (own photo if it's a real scene, else archive) + "More about …" cards. Donate: give-online box, recent projects, Other ways to help. Contact: Formspree form (free, 50/month) shown once `contactFormUrl` in site.yaml is a real https address; posts with fetch + Accept: application/json, falls back to a normal POST.
- Homepage hides `[PLACEHOLDER]` values via `isPlaceholder()` (src/lib/events.ts). Events can set `entriesClose` so "Open now" turns into "Entries closed" automatically. `diaryDates` in site.yaml feeds "Dates for your diary" (past dates hidden).
- Nav: Home, Events ▾ (All events + every event, from getEvents()), News, Photos, Races, About us ▾ (Our story, Meet the dads, Where the money goes), Donate, Search, Get involved. Drop-downs are disclosure buttons (aria-expanded; Esc closes and refocuses; one open at a time); inside the phone menu they work as accordions. The phone menu switches on below 1080px (the bar wraps below ~1040px). Footer: name/tagline/CIC, then one line of links not in the header (Contact us, Facebook, Privacy, Annual accounts once accountsUrl is real).
- Events carousel loops endlessly: JS copies the cards before and after the real ones (aria-hidden, links tabindex=-1, still clickable) and jumps back into the real set on scrollend.
- (older note) Nav: Home, Events (`/events/` index), News, Photos, Wolfspit results, Our story, Get involved. Event cards (`src/components/EventCard.astro`) link to the event page ("More details") as well as the CTA; event page detail = the Markdown body of `src/content/events/<id>.md`.
- Global CSS: `[hidden] { display: none !important }` (filters rely on it) and `overflow-wrap: break-word` on body. Don't use `anywhere`: it splits short labels like "NOVEMBER" in flex rows.
- QA tools in `scripts/qa/` (link checker + layout/behaviour audit). Run them after layout changes.
- Album pages load full 1200px images in the grid (no thumbnails yet). For milestone 6: thumbnails, e.g. a prebuild step with `sharp` (Astro already depends on it, but it would need adding explicitly, so ask first).
- Windows dev machine needs the Microsoft VC++ runtime (Astro's Markdown engine is native).

## Phase 2: team editing (Pages CMS, set up 2026-11-20)

- **Pages CMS** (free, hosted at app.pagescms.org) replaced the earlier Decap plan. Config: `.pages.yml` at the repo root, one form per collection (news, albums, events, members, funded, timeline) plus Site settings (`src/data/site.yaml`, under its `site:` object). Results CSVs are not editable there.
- Keep `.pages.yml` in step with `src/content.config.ts`: **every schema field must appear in the form** (unused ones as `hidden: true`, like `source`), because saving rewrites the file and drops keys the form doesn't know. Saving also drops YAML comments, so don't keep notes in comments in content files; put them in TODO-content.md.
- Media: new uploads go to `public/uploads/news`, `public/uploads/photos` (random names) and `public/uploads/images`. The deploy workflow runs `scripts/resize-uploads.mjs` first (max 1600px, EXIF rotation applied, metadata incl. GPS stripped) and commits any resized photos back.
- Albums are single files (`src/content/albums/<id>.md`, flattened from `<id>/index.md` on 2026-11-20 so the editor can list them). The editor stores references as paths (`src/content/albums/x.md`); the schema's `entryId` preprocess turns them into ids.
- Editors are invited by email from Pages CMS (no GitHub account needed). Their guide: `docs/how-to-update.md`.

## Working agreements

- Ask before adding dependencies beyond Astro, Zod, Leaflet and a small lightbox library.
- Seed each collection with 1–3 sample entries using `[PLACEHOLDER]` text, never invented facts.
- Keep components small and named after the homepage sections.
- After each milestone, update `TODO-content.md` and summarise what changed.

## Milestones

1. Scaffold Astro + Netlify config, design tokens, fonts, base layout, header/footer.
2. Content collections + schemas + sample content + `site.yaml`.
3. Homepage sections, matching the design file.
4. Inner pages (news, events, photos, Wolfspit, story, map, donate, get involved).
5. Christmas card form flow (form built; submission service TBD since GitHub Pages has no forms).
6. Accessibility/performance pass, `TODO-content.md`, `docs/how-to-update.md`.
7. Deploy (GitHub Pages now), then connect the domain.
8. **Content migration** (done 2026-11-20, done before milestone 4 at Peter's request: 124 posts → news, 1,269 photos → albums, Wolf's Pit 2022–26 + Tour of Bradwell results → CSV, timeline/funded/settings facts with `source:` links. Peter chose to import everything as-is and review privacy later; that list is in `TODO-content.md`. Scripts: `scripts/migration/`). Original plan, from the Blogspot and WordPress sites: inventory every post/page/photo, map each to a collection (news, albums, timeline, results, funded), import with original dates, download images into `public/uploads/`, keep a source URL on each entry, and plan redirects for old WordPress URLs once on a host that supports them. Do this before connecting the domain.

## The design file

`design/homepage-mockup.dc.html` was made in a design tool that uses its own template syntax: `<x-dc>`, `<helmet>`, `<sc-for list="{{items}}">` loops, `{{hole}}` bindings, and a `renderVals()` script holding sample data (events, news, albums, timeline, pins). Treat it as the **visual and structural spec**: copy layout, spacing, colours, type sizes and copy from it, but rebuild everything as Astro components fed by the content collections. Do not ship that file or its syntax.
