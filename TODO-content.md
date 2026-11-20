# Content still to fill in

Every `[PLACEHOLDER]` or `[SQUARE BRACKET]` value on the site, and where to change it.
Tick items off as they're done. Updated: 20 November 2026 (17 November minutes + SumUp store links).

**The homepage hides anything still in [SQUARE BRACKETS]** (totals, donation labels, venue, Facebook posts, CIC details) so the concept reads as finished. Placeholders stay visible on inner pages as reminders. Fill them in here and they appear automatically.

## Site settings: `src/data/site.yaml`

- [ ] Contact email (`contactEmail`). The old blog used braddadads@btinternet.com; is it still in use?
- [ ] CIC name and company number (`cicName`, `cicNumber`). The SumUp store is called "Bradda Dads Community Group"; is that the registered name?
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

## Events: `src/content/events/`

Each event has its own page (`/events/bonfire/`, `/events/duck-race/` …, all listed at `/events/`). The card text comes from the front matter (`summary`, `when`, `ctaLabel` …). **Anything written below the `---` in the event's `.md` file appears on its page**, so that's the place for fuller details: timings, prices, what to bring, how to help, maps, FAQs.

- [ ] **Duck race** (`duck-race.md`): 2026 start time (then set `startTimeConfirmed: true`; it was 11am in 2022), start point (Town Bottom Park in 2022), duck price (`price`), raft age categories. Done: ticket sales (online, Co-op 12 and 19 Dec), cash prizes, raft trophies, SumUp link.
- [x] **Bonfire** (`bonfire.md`): 2026 thank-you story added (around 600 people, thanks to Breedon). Still to add: photos, and the amount raised **if the committee is happy to publish it** (the minutes say £3,815.05 including £2,500 from Breedon; left off for now).
- [x] **Christmas card** (`christmas-card.md`): closes midnight Fri 20 Nov (the banner hides itself afterwards via `entriesClose`), delivered week of 14 Dec. Still to add: where paper slips go. Next year, update `entriesClose` and set `status: open` again.
- [ ] **Pensioners' lunch** (`pensioners-lunch.md`): Friday 4 Dec 2026 done. Still need the time, venue (the hall), and who to contact about deliveries or transport.
- [ ] **Wolf's Pit** (`wolfspit.md`): 2027 date and entry link (a June evening is being looked into; the site just says "2027 date TBC")

## Our story: `src/content/timeline/`

- [ ] **Confirm the first bonfire year.** The 2012 post calls it the "12th annual" bonfire (so 2001), but a 2023 archive note thinks 2001 may have been the second.
- [ ] Year Bradda Dads became a CIC
- [ ] Year the £5-a-message village Christmas card started (different from the 2008 schools card competition)

## Where the money goes: `src/content/funded/`

- [ ] **All four map pins are guesses near the village centre.** Set the real `lat`/`lng`, then `locationConfirmed: true`.
- [ ] Year, amount and details for: school stage lighting, Bradwell Youth Activities, Centenary Players, Lumb Christmas lights
- [ ] Add other funded groups and projects

## Results: `src/content/results/`

Converted from the old site's PDFs: Wolf's Pit 2022–2026; Tour of Bradwell 2016, 2017 (long and half) and 2019. The original PDFs are kept in `public/uploads/results/`.

- [ ] Wolf's Pit 2009–2014 full results were on wolfspitfellrace.org.uk (now gone). Try the Internet Archive (web.archive.org).
- [ ] Wolf's Pit 2019 results are on RaceTek Live (racetek-live.co.uk, event 834): download and add.
- [ ] Wolf's Pit 2015–2018: results not found on either old site.
- [ ] 2022 results have no clubs or categories, and 2025 only has them for the first 53 runners. If the organiser has the full spreadsheets, swap them in.
- [ ] Decide what "First junior" means for the podium (`src/lib/results.ts`, `PODIUM_RULES`). Wolf's Pit is 18+, so at the moment it picks the first MU19/MU21/MU23 runner.
- [ ] Tour of Bradwell 2018 results (not found on the old site)

## Imported photos and posts

124 posts and 1,269 photos were imported from the old sites. Each entry has a `source:` link to the original.

- [ ] **Photo dates.** Every photo shows when it was taken: the album's `date`, or `dateLabel` when there's no single date. For imported albums that's the old post's date, which is usually the event date. Corrected: Ball Race (13 June 2004), Carnival 2005 (30 July 2005), the 'Stig' feature (10 December 2008). Labelled: Carnival photos "2017–2021", Bonfire photos "2017–2019", Wolf's Pit photos "Various years", Summer Duck Race "Summer 2016". That last one starts with the same poster as the 2022 Boxing Day post, so check whether it really is 2016. If you spot a wrong date, change `date:` (or add `dateLabel:`) in the album's `index.md`.
- [x] **Album covers described.** The first photo of all 94 albums (cover, news image and first photo in the viewer) has a real description plus its date. The other ~1,170 photos still have generic descriptions.
- [ ] **Alt text (rest).** The remaining imported photos have generic descriptions ("Photo 3 of 12 from …"). Write real ones, at least for album covers and homepage photos.
- [ ] Captions. Some old posts had a caption above each photo; these are kept as text in the news story, not attached to the photos.
- [ ] Old posts mention videos that were embedded on the old blog (marked "A video was embedded here on the old site"). Find them on YouTube/Facebook if they still exist.
- [ ] Facebook photo albums since 2014 have not been imported (Facebook isn't covered by the migration).

## Privacy review of imported content

Brought across as-is on request. **Revisit before the site is publicised.** Things to think about: personal phone numbers and emails, posts about named individuals, children named with ages, and photos of children (many albums).

Race results name every runner. That's normal for published fell race results, but mention it in the privacy notice.

### Personal contact details (4)

Phone numbers and email addresses copied from the old sites.

- [ ] [events/wolfspit.md](src/content/events/wolfspit.md) (from the old WordPress Wolf's Pit page): 07590 047104, wolfspitfellrace@gmail.com
- [ ] [2011 Boxing Day Duck Race](src/content/news/2011-12-27-2011-boxing-day-duck-race.md): braddadads@btinternet.com
- [ ] [Wolf's Pit photos](src/content/albums/2018-10-17-wolfs-pit-photos/index.md) (album text from the old WordPress page): 07590 047104, wolfspitfellrace@gmail.com
- [ ] [Wolf's Pit 2020: further info on cancellation](src/content/news/2020-03-26-wolfs-pit-2020-further-info-on-cancellation.md): wolfspitfellrace@gmail.com

- [ ] **Scanned lunch invitations** (photo 1 in the albums [3rd Pensioners Christmas Lunch, 2003](src/content/albums/2003-12-10-braddadads-3rd-pensioners-christmas-lunch-10th-december-2003/index.md) and [6th Pensioners Lunch, 2006](src/content/albums/2006-12-06-braddadads-6th-pensioners-lunch-wednesday-6th-december-2006/index.md)) show a member's home address and phone number. Consider removing or cropping them.

### Posts about named individuals (7)

- [ ] [Lee Bradbury's 40th Birthday Party (2008)](src/content/news/2008-08-17-bradda-dad-lee-bradburys-40th-birthday-party-16-8.md)
- [ ] [Bradwell's 'The Stig' (2009)](src/content/news/2009-01-10-bradwells-the-stig-nearly-hits-the-headlines-2008-pensioners.md)
- [ ] [It's not goodbye, it's just au revoir (2010 AGM, retirements)](src/content/news/2010-10-20-its-not-goodbye-its-just-au-revoir.md)
- [ ] [Mike Thompson retires (2011)](src/content/news/2011-10-20-bradda-dads-legend-mike-thompson-retires-after-nearly-13-yea.md)
- [ ] [Jonathan Morgan farewell (2013)](src/content/news/2013-08-31-jonathan-morgan.md)
- [ ] [Retired Bradda Dads reunion (2022)](src/content/news/2022-11-11-retired-bradda-dads-reunion-the-white-hart-11th-november-202.md)
- [ ] [Retired Bradda Dads meet the current Bradda Dads (2023)](src/content/news/2023-02-04-retired-bradda-dads-meet-the-current-bradda-dads.md)
- Not imported: the old blog's "Members past and present" page (a list of names, membership status and officer roles as at 2013). Decide whether you want it.

### Children named with ages or school details (2)

- [ ] [9th Annual Boxing Day Krazy Kraft and Duck Race (2007)](src/content/news/2007-12-26-9th-annual-boxing-day-krazy-kraft-and-duck-race.md): kraft race winners
- [ ] [Christmas Card Competition 2008](src/content/news/2008-12-09-christmas-card-competition-2008.md): winners named with ages and schools

### Posts naming many people (22)

Usually captions and thank-yous, so probably fine, but worth a skim. Full list from the migration scan:

- [ ] [Bowls Social (2007)](src/content/news/2007-09-08-bradda-dads-wives-and-children-bowls-social.md) · [8th Pensioners Lunch (2008)](src/content/news/2008-12-10-8th-annual-pensioners-christmas-lunch.md) · [10th Duck Race (2008)](src/content/news/2008-12-26-10th-annual-duck-race-crazy-craft-race-boxing-day-2008.md) · [Wolf's Pit Walk Around (2009)](src/content/news/2009-02-07-wolfs-pit-fell-race-walk-around.md) · [Christmas Card Competition (2009)](src/content/news/2009-12-10-christmas-card-competition.md)
- [ ] [Wolf's Pit (2010)](src/content/news/2010-03-14-wolfs-pit-fell-race-14-march-2010.md) · [Dads vs Lads football (2010)](src/content/news/2010-08-01-bradda-dads-vs-bradda-lads-carnival-football-match.md) · [Eyam Carnival (2010)](src/content/news/2010-09-04-eyam-carnival-winners-in-two-categories.md) · [10th Pensioners Lunch (2010)](src/content/news/2010-12-09-10th-anniversary-pensioners-lunch-8-december-2010.md) · [12th Duck Race (2010)](src/content/news/2010-12-26-12th-boxing-day-duck-race.md)
- [ ] [MUGA opening (2011)](src/content/news/2011-07-10-9-7-11-opening-of-the-multi-use-games-area-muga.md) · [2011 Duck Race](src/content/news/2011-12-27-2011-boxing-day-duck-race.md) · [Wolf's Pit (2012)](src/content/news/2012-03-11-wolfs-pit-fell-race.md) · [Jubilee Beacon (2012)](src/content/news/2012-06-02-hm-queen-elizabeths-diamond-jubilee-beacon.md) · [Carnival Duck Race (2012)](src/content/news/2012-08-07-duck-race-carnival-2012.md)
- [ ] [12th Pensioners Lunch (2012)](src/content/news/2012-12-05-12th-pensioners-christmas-lunch.md) · [Valentine raffle (2012)](src/content/news/2012-12-30-win-a-unique-necklace-and-earrings-set-for-your-valentine.md) · [Wolf's Pit photos album](src/content/albums/2018-10-17-wolfs-pit-photos/index.md), plus the birthday, retirement, Christmas card and 2007 duck race posts listed above

## Pages still to write (milestone 4)

- [ ] Privacy notice (mention race results, photos, and OpenStreetMap map tiles)
- [ ] Get involved / Contact copy
