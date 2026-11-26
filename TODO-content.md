# Content still to fill in

Every `[PLACEHOLDER]` or `[SQUARE BRACKET]` value on the site, and where to change it.
Tick items off as they're done. Updated: 20 November 2026 (17 November minutes + SumUp store links).

**The published site hides anything still in [SQUARE BRACKETS]** (totals, member names, years, CIC details, and every "[PLACEHOLDER: …]" note), so it reads as finished. They're still visible when running the site locally (`npm run dev`), and they're all listed below. Fill them in and they appear automatically.

**Meet the dads:** a member's card and profile page only appear once their real name replaces "[MEMBER NAME]" in `src/content/members/`. Until then the page shows a group photo and "profiles are on their way".

**Visitor journeys:** the full list of improvements, by who visits and why, is in [docs/visitor-journeys.md](docs/visitor-journeys.md).

- [x] **Group email and contact form** (26 Nov 2026): secretarybraddadads@gmail.com, Formspree form mjywldwk (free plan, 50 messages a month; Formspree login is the same Gmail). Shown on Contact, footer, Get involved, Where the money goes, privacy notice; links pre-pick the form topic (/contact/?topic=support|business|lunch|removal|volunteer|general).

- [ ] **Meeting day:** the site says the third Tuesday at 8:30pm; the 2018 carnival album says the third Wednesday. Confirm.

- [x] Memorial Hall, Post Office and Shoulder of Mutton map links fixed (26 Nov 2026).
- [x] **Gala Day & Carnival** added as an event (/events/gala/, 26 Nov 2026): a village event Bradda Dads take part in (float every year; bar with live music in past years) but don't run (`runByUs: false`). Still need: the 2027 date, and who runs the gala (for a link).
- [ ] **Float on the bonfire:** the site used to say every carnival float is burned on the bonfire. Peter says it happened maybe once (the skull float?). Removed for now; confirm the year if it's worth a mention.
- [ ] **Pensioners' lunch bookings** were marked closed on 26 Nov 2026 (editor: tick "Closed now"). **Untick it next year** when bookings open, or set a "Deadline" date instead.
- [ ] **Wolf's Pit** map link for the start (Shatton), if wanted.

## Site settings: `src/data/site.yaml`

- [ ] **Contact form:** make a free Formspree account at https://formspree.io (50 messages a month free), create a form that emails the group's address, then paste its address (https://formspree.io/f/…) into `contactFormUrl` (Site settings → Contact form address). The form appears on the Contact page by itself.
- [ ] Contact email (`contactEmail`). The old blog used braddadads@btinternet.com; is it still in use?
- [x] CIC name and company number: Bradda Dads CIC, no. 11682398 (Companies House, https://find-and-update.company-information.service.gov.uk/company/11682398). Footer links to the record.
- [x] SumUp store URL and the three item links (duck tickets, Christmas card, donation)
- [ ] What £5 / £10 / £20 pays for (`donationLinks[].label`). If the store's donation item has fixed amounts with their own links, add them here.
- [ ] SumUp donation QR code image → save to `public/uploads/site/` and set `donationQr` (the QR panel only appears once this is set)
- [ ] Total raised since 1999 (`totalRaised`)
- [ ] Number of groups and projects helped (`groupsHelped`)
- [x] Meeting info: third Tuesday of the month, 8:30pm, in a village pub (from the 17 Nov minutes)
- [ ] `diaryDates`: keep adding upcoming public dates (past ones drop off automatically)
- [ ] Annual accounts link (`accountsUrl`)
- [ ] Three recent Facebook posts to show on the homepage (`facebookPosts`). Until then the homepage shows "Dates for your diary".
- [ ] Decide: "Share your photos" → Facebook (current) or a `mailto:` address (`sharePhotosUrl`)
- [ ] Wolf's Pit 2027 entry link (`wolfspitEntryUrl`)
- [ ] Our story intro: add who started it and why (`storyIntro`)
- [ ] **After the February 2027 membership vote:** if membership opens up, change the joining wording (Site settings → Join us headline / text) to:
  - Headline: "Live in Bradwell? You're in."
  - Text: "Bradda Dads is open to anyone in the parish who wants to help. No experience needed, just a spare pair of hands for a few events a year."
  (This used to be a comment in site.yaml; comments there are lost when the editor saves the file.)

## Events: `src/content/events/`

- [ ] **Event details checklist** (from the user journeys review, 26 Nov 2026). Every event page should answer: date, start time, place (with a map link or postcode), price, how to buy/book and by when, what to bring, whether it's suitable for children/accessible, and who to ask. Most events are missing at least the time, place or price.
- [ ] **Family Fun Day** (`family-fun-day.md`, added 26 Nov 2026): annual, usually June (10 June 2017 at Town Bottom per Bradwell News issue 180; 15 June 2019 behind the Shoulder of Mutton per the old WordPress post; still running in 2026 per issue 287). Need the 2027 date, place, what's on and any costs.

Each event has its own page (`/events/bonfire/`, `/events/duck-race/` …, all listed at `/events/`). The card text comes from the front matter (`summary`, `when`, `ctaLabel` …). **Anything written below the `---` in the event's `.md` file appears on its page**, so that's the place for fuller details: timings, prices, what to bring, how to help, maps, FAQs.

- [x] **Duck race** (`duck-race.md`, Peter 26 Nov 2026): £1 an entry; Krazy Krafts released 10:50am, ducks away 11am; prizes £50/£30/£20 (numbers go round again if all sell, so several winners possible); entries online, at the Co-op (12 and 19 Dec), Bradwell Post Office and on the day. Still to add: Krazy Kraft age categories, and where exactly the ducks go in (the map pin is by Town Bottom).
- [x] **Bonfire** (`bonfire.md`): 2026 thank-you story added (around 600 people, thanks to Breedon). Still to add: photos, and the amount raised **if the committee is happy to publish it** (the minutes say £3,815.05 including £2,500 from Breedon; left off for now).
- [x] **Christmas card** (`christmas-card.md`): closes midnight Fri 20 Nov (the banner hides itself afterwards via `entriesClose`), delivered week of 14 Dec. Still to add: where paper slips go. Next year, update `entriesClose` and set `status: open` again.
- [ ] **Pensioners' lunch** (`pensioners-lunch.md`): Friday 4 Dec 2026 done. Still need the time, venue (the hall), and who to contact about deliveries or transport.
- [ ] **Wolf's Pit** (`wolfspit.md`): 2027 date and entry link (a June evening is being looked into; the site just says "2027 date TBC")

## Our story: `src/content/timeline/`

- [ ] **Read [docs/history-from-bradwell-news.md](docs/history-from-bradwell-news.md)**: 20+ years of Bradwell News mentions, including that the group began as **"Bradda Ten"** (ask the committee for the story), the first community Christmas card in **2006**, and years and amounts for several "Where the money goes" entries. Nothing has been added to the site yet.

- [ ] **Confirm the first bonfire year.** The 2012 post calls it the "12th annual" bonfire (so 2001), but a 2023 archive note thinks 2001 may have been the second.
- [x] Year Bradda Dads became a CIC: incorporated 16 November 2018 (Companies House). Added to Our story.
- [ ] Year the £5-a-message village Christmas card started (different from the 2008 schools card competition). **Bradwell News suggests 2006** (Issue 65, Nov 2007: "Following last year's very successful Christmas card campaign…").

## Where the money goes: `src/content/funded/`

- [ ] **All four map pins are guesses near the village centre.** Set the real `lat`/`lng`, then `locationConfirmed: true`.
- [ ] Year, amount and details for: school stage lighting, Bradwell Youth Activities, Centenary Players, Lumb Christmas lights
- [ ] Add other funded groups and projects
- [ ] **School leavers' hoodies** (Peter, 26 Nov 2026: "I think we have done these, need to check"). If confirmed (which school, which year, roughly how much), add it as a `funded` entry. Not on the site yet.
- [ ] **Rules for asking us for support** (`src/content/pages/support.md`, editor form "Asking for support (groups)"; shown on Where the money goes since 26 Nov 2026). The section currently just says what to tell us and links to the contact page. The committee to decide and fill in: who can ask (groups only? individuals? must be in Bradwell?), typical amounts, how to ask (email/form/letter), and when requests are decided (e.g. at the monthly meeting). Then delete the `[PLACEHOLDER]` line.

## Results: `src/content/results/`

Converted from the old site's PDFs: Wolf's Pit 2022–2026; Tour of Bradwell 2016, 2017 (long and half) and 2019. The original PDFs are kept in `public/uploads/results/`. **Added 25 Nov 2026:** Wolf's Pit 2009, 2013, 2014, 2015 and 2016 from Internet Archive copies of the old race website, and 2019 from RaceTek Live (each year's `.md` says exactly where it came from and what was tidied).

- [ ] **Wolf's Pit 2010, 2011, 2012, 2017 and 2018 are still missing.** The Internet Archive didn't save those results pages. Ask the race organiser or the timing company for copies. (One year was cancelled for snow: which?)
- [ ] Wolf's Pit 2015 and 2016: race dates not known (add `date:` to 2015.md / 2016.md).
- [x] Wolf's Pit 2009, 2013–2016 and 2019 added.
- [ ] **wolfspitfellrace.org.uk now belongs to a betting spam site.** The three old news posts that linked to it now link to archived copies or the site's own results page instead. Don't link to that domain again.
- [ ] 2022 results have no clubs or categories, and 2025 only has them for the first 53 runners. If the organiser has the full spreadsheets, swap them in.
- [ ] Decide what "First junior" means for the podium (`src/lib/results.ts`, `PODIUM_RULES`). Wolf's Pit is 18+, so at the moment it picks the first MU19/MU21/MU23 runner.
- [ ] Tour of Bradwell 2018 results (not found on the old site)

## Imported photos and posts

124 posts and 1,269 photos were imported from the old sites. Each entry has a `source:` link to the original.

- [ ] **Photo dates.** Every photo shows when it was taken: the album's `date`, or `dateLabel` when there's no single date. For imported albums that's the old post's date, which is usually the event date. Corrected: Ball Race (13 June 2004), Carnival 2005 (30 July 2005), the 'Stig' feature (10 December 2008). Labelled: Carnival photos "2017–2021", Bonfire photos "2017–2019", Wolf's Pit photos "Various years", Summer Duck Race "Summer 2016". That last one starts with the same poster as the 2022 Boxing Day post, so check whether it really is 2016. If you spot a wrong date, change `date:` (or add `dateLabel:`) in the album's `index.md`.
- [x] **Album covers described.** The first photo of all 94 albums (cover, news image and first photo in the viewer) has a real description plus its date. The other ~1,170 photos still have generic descriptions.
- [x] **Alt text (rest).** Done 25 Nov 2026: 1,162 more photos described from the pictures themselves (short, no names). A few may be wrong: fix them in the album's file or in Pages CMS. Only 9 left generic (see the blackface item below).
- [ ] Captions. Some old posts had a caption above each photo; these are kept as text in the news story, not attached to the photos.
- [ ] Old posts mention videos that were embedded on the old blog (marked "A video was embedded here on the old site"). Find them on YouTube/Facebook if they still exist.
- [ ] Facebook photo albums since 2014 have not been imported (Facebook isn't covered by the migration).

## Blackface photos: removed, never to be published again

- [x] **Removed 25 Nov 2026:** the 2008 "Lee Bradbury's 40th birthday party" news story and its 9-photo album, and photo 16 of the 2011 Mike Thompson retirement album, all showing party guests in blackface make-up. **These must never be published again.** `scripts/blocked-content.json` stops the build if any of them come back (even under a different file name) and stops the old-site import from bringing the post back.
- [x] **GitHub history cleaned (25 Nov 2026):** the photos and the 2008 story were removed from every past version in the repository, not just the current one.
- [ ] **Take the original post down from the old Blogspot site:** https://braddadads.blogspot.com/2008/08/bradda-dad-lee-bradburys-40th-birthday.html (needs whoever has the Blogspot login: open the post in Blogger → Delete, or set it to Draft). Also check the 2011 Mike Thompson retirement post on Blogspot (https://braddadads.blogspot.com/2011/10/bradda-dads-legend-mike-thompson.html) for the reused photo, and delete that photo there too.

## Privacy review of imported content

Brought across as-is on request. **Revisit before the site is publicised.** Things to think about: personal phone numbers and emails, posts about named individuals, children named with ages, and photos of children (many albums).

Race results name every runner. That's normal for published fell race results, but mention it in the privacy notice.

### Personal contact details (4)

Phone numbers and email addresses copied from the old sites.

- [x] [events/wolfspit.md](src/content/events/wolfspit.md): the organiser's mobile number has been taken off the event page (an "Email the organiser" button remains). It's still in the imported Wolf's Pit photos album text below.
- [x] 2011 Boxing Day Duck Race: old group email and "if you know this lady" request removed (26 Nov 2026).
- [x] Wolf's Pit photos album: organiser's mobile removed; race email kept (public race address) (26 Nov 2026).
- [x] Wolf's Pit 2020 cancellation: race email kept (public race address).

- [x] **Scanned lunch invitations** (2003, 2006) showing a member's home address and phone: photos removed (26 Nov 2026).

### Posts about named individuals (7)

- [ ] [Bradwell's 'The Stig' (2009)](src/content/news/2009-01-10-bradwells-the-stig-nearly-hits-the-headlines-2008-pensioners.md)
- [ ] [It's not goodbye, it's just au revoir (2010 AGM, retirements)](src/content/news/2010-10-20-its-not-goodbye-its-just-au-revoir.md)
- [ ] [Mike Thompson retires (2011)](src/content/news/2011-10-20-bradda-dads-legend-mike-thompson-retires-after-nearly-13-yea.md)
- [ ] [Jonathan Morgan farewell (2013)](src/content/news/2013-08-31-jonathan-morgan.md)
- [ ] [Retired Bradda Dads reunion (2022)](src/content/news/2022-11-11-retired-bradda-dads-reunion-the-white-hart-11th-november-202.md)
- [ ] [Retired Bradda Dads meet the current Bradda Dads (2023)](src/content/news/2023-02-04-retired-bradda-dads-meet-the-current-bradda-dads.md)
- Not imported: the old blog's "Members past and present" page (a list of names, membership status and officer roles as at 2013). Decide whether you want it.

### Children named with ages or school details (2)

- [x] 2007 Krazy Kraft and duck race: children's names removed (26 Nov 2026).
- [ ] Children named as Krazy Kraft winners also in the 2008, 2009 and 2010 duck race stories: ask Peter.
- [x] Christmas Card Competition 2008: children's names, ages and schools removed (26 Nov 2026).

### Posts naming many people (22)

Usually captions and thank-yous, so probably fine, but worth a skim. Full list from the migration scan:

- [ ] [Bowls Social (2007)](src/content/news/2007-09-08-bradda-dads-wives-and-children-bowls-social.md) · [8th Pensioners Lunch (2008)](src/content/news/2008-12-10-8th-annual-pensioners-christmas-lunch.md) · [10th Duck Race (2008)](src/content/news/2008-12-26-10th-annual-duck-race-crazy-craft-race-boxing-day-2008.md) · [Wolf's Pit Walk Around (2009)](src/content/news/2009-02-07-wolfs-pit-fell-race-walk-around.md) · [Christmas Card Competition (2009)](src/content/news/2009-12-10-christmas-card-competition.md)
- [ ] [Wolf's Pit (2010)](src/content/news/2010-03-14-wolfs-pit-fell-race-14-march-2010.md) · [Dads vs Lads football (2010)](src/content/news/2010-08-01-bradda-dads-vs-bradda-lads-carnival-football-match.md) · [Eyam Carnival (2010)](src/content/news/2010-09-04-eyam-carnival-winners-in-two-categories.md) · [10th Pensioners Lunch (2010)](src/content/news/2010-12-09-10th-anniversary-pensioners-lunch-8-december-2010.md) · [12th Duck Race (2010)](src/content/news/2010-12-26-12th-boxing-day-duck-race.md)
- [ ] [MUGA opening (2011)](src/content/news/2011-07-10-9-7-11-opening-of-the-multi-use-games-area-muga.md) · [2011 Duck Race](src/content/news/2011-12-27-2011-boxing-day-duck-race.md) · [Wolf's Pit (2012)](src/content/news/2012-03-11-wolfs-pit-fell-race.md) · [Jubilee Beacon (2012)](src/content/news/2012-06-02-hm-queen-elizabeths-diamond-jubilee-beacon.md) · [Carnival Duck Race (2012)](src/content/news/2012-08-07-duck-race-carnival-2012.md)
- [ ] [12th Pensioners Lunch (2012)](src/content/news/2012-12-05-12th-pensioners-christmas-lunch.md) · [Valentine raffle (2012)](src/content/news/2012-12-30-win-a-unique-necklace-and-earrings-set-for-your-valentine.md) · [Wolf's Pit photos album](src/content/albums/2018-10-17-wolfs-pit-photos.md), plus the birthday, retirement, Christmas card and 2007 duck race posts listed above

## Pages still to write (milestone 4)

- [ ] Privacy notice (mention race results, photos, and OpenStreetMap map tiles)
- [ ] Privacy notice: once the Christmas card form is live, add what's collected (name and message), who sees it, how long it's kept, and that the message is printed on the card.
- [ ] Get involved / Contact copy

## Team editing (next up)

- [x] **Pages CMS set up** (`.pages.yml`): forms for news, albums, events, members, where the money goes, timeline and site settings; uploaded photos are shrunk automatically; team guide in `docs/how-to-update.md`.
- [ ] **You:** install the Pages CMS GitHub app on the repo (sign in at https://app.pagescms.org with GitHub as zebratestinguser-lgtm, then follow the prompt to install it on bradda-dads-site only).
- [ ] **You:** add a test story and album through the editor to check it all works end to end, then delete them.
- [ ] **You:** invite each editor by email (Pages CMS → the repo → Collaborators) and send them `docs/how-to-update.md`.

## Parked site improvements (suggested 21 Nov 2026)

- [ ] **A shared Bradda Dads calendar people can subscribe to (Peter, 26 Nov 2026).** Set up a Google Calendar (or similar) that the committee maintains, and share its subscribe link so events appear in people's own diaries and update when we change them. Note: the site already has a subscribable feed built from the events (https://zebratestinguser-lgtm.github.io/bradda-dads-site/events.ics). Calendar apps that *subscribe* to that address (rather than downloading it once) refresh it automatically, so one option is simply to offer a "Subscribe" link to it; a Google Calendar is the other route if the committee prefers managing dates there.

- [ ] **Visit counts (possible future idea, 25 Nov 2026).** Cookie-free counting with GoatCounter (free for non-profits, ~3.5 KB script loaded after the page) or Cloudflare Web Analytics (if hosting moves there). Plan: Peter signs up, pastes the site code into a new Site settings field; the script only loads on the live site, respects Do Not Track, and the privacy notice gains a line saying visits are counted anonymously. No consent banner needed.

- [ ] **Move hosting to Cloudflare when the site gets its own web address (decided 25 Nov 2026: wait until then).** Keep building on GitHub Actions and upload the finished site to Cloudflare (free): browsers can then keep photos and fonts for a year instead of 10 minutes, and old WordPress addresses can be redirected. Limits to watch: Cloudflare free = 20,000 files per site (now ~9,400; each photo adds 7), GitHub Pages = 1 GB (now ~430 MB). Needs a Cloudflare account and one API token stored as a GitHub secret (~20 minutes).

- [ ] **Facebook posts on the site, automatically (chosen 25 Nov 2026, for later):** the daily rebuild fetches the latest few posts from the Bradda Dads Facebook page (https://www.facebook.com/BraddaDads) and shows them as normal site content, with no Facebook code or tracking for visitors. Needs Peter (a Page admin) to create a free Meta developer app and a long-lived Page access token, stored as a GitHub secret; about an hour together. Until then, the three hand-picked posts in Site settings → Facebook posts can be used.

- [ ] **Facebook share previews:** event and news pages use their own photo and summary instead of the default image.
- [ ] **Speed on phones:** mid-sized photo versions with srcset for headers and cards; run Lighthouse before and after (target 90+).
- [ ] **Event dates in Google:** Event structured data on event pages; an "Add to calendar" link per event.
- [x] **Photo descriptions:** done (25 Nov 2026), except the 9 blackface photos.
- [x] **Duck race winners archive:** /events/duck-race/winners/ (7 races, 2008–2012, from the old results sheets and posts; `src/content/duck-winners/`, editable in Pages CMS). Krazy Kraft (children's raft race) winners were left off because they're children; they're still in the old posts.
- [ ] Duck race winners: add results from other years if anyone has them (2013 onwards weren't on the old sites). Check the committee is happy for winners' names to be shown.
- [ ] **Committee decision: include the children's raft race (Krazy Kraft) winners or not?** Named in the old posts for 2007, 2008, 2010 and 2011; left off the winners page for now. If they're kept off, consider also removing the children's names from those old news stories. (Also in the committee's facts-to-check doc.)
