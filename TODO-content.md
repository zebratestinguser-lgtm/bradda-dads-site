# Content still to fill in

Every `[PLACEHOLDER]` or `[SQUARE BRACKET]` value on the site, and where to change it.
Tick items off as they're done. Updated: milestone 2.

## Site settings: `src/data/site.yaml`

- [ ] Contact email (`contactEmail`)
- [ ] CIC name and company number (`cicName`, `cicNumber`)
- [ ] SumUp store URL (`sumupStoreUrl`)
- [ ] SumUp payment links for £5 / £10 / £20 (`donationLinks[].url`)
- [ ] What £5 / £10 / £20 pays for (`donationLinks[].label`)
- [ ] SumUp donation QR code image → save to `public/uploads/site/` and set `donationQr`
- [ ] Total raised since 1999 (`totalRaised`)
- [ ] Number of groups and projects helped (`groupsHelped`)
- [ ] Meeting day / venue (`meetingInfo`)
- [ ] Annual accounts link (`accountsUrl`)
- [ ] Three recent Facebook posts to show on the homepage (`facebookPosts`)
- [ ] Decide: "Share your photos" → Facebook (current) or a `mailto:` address (`sharePhotosUrl`)

## Events: `src/content/events/`

- [ ] **Duck race** (`duck-race.md`): start time (then set `startTimeConfirmed: true`), start point, duck price, prize, where ducks are sold, SumUp link (`ctaUrl`)
- [ ] **Bonfire** (`bonfire.md`): venue, date, details
- [ ] **Christmas card** (`christmas-card.md`): closing date, how the card is shown/delivered
- [ ] **Pensioners' lunch** (`pensioners-lunch.md`): date, venue, booking link
- [ ] **Wolfspit Race** (`wolfspit.md`): month/date, start/finish, one-line description, entry link

## News: `src/content/news/`

- [ ] Replace the 3 sample stories (headline, summary, body, real date, photo + alt text)

## Photos: `src/content/albums/`

- [ ] Add real photos for `duck-race-2025` (files in `public/uploads/albums/duck-race-2025/`) with alt text
- [ ] Add albums for other events (Bonfire, Wolfspit, Pensioners' lunch)

## Wolfspit results: `src/content/results/wolfspit/`

- [ ] `2026.csv` is **sample data only**: replace with real results, or delete and add real years (`YYYY.md` + `YYYY.csv`)
- [ ] Course notes (distance, climb, start/finish)
- [ ] Check the podium rules in `src/lib/results.ts` match the race's category codes

## Our story: `src/content/timeline/`

- [ ] Years and text for: bonfire, pensioners' lunch, Wolfspit Race, becoming a CIC, Christmas card
- [ ] Intro paragraph (who started it, why, how it grew)
- [ ] Archive photo (e.g. the first duck race)

## Where the money goes: `src/content/funded/`

- [ ] School stage lighting: real map position, year, amount (optional), details
- [ ] Replace `sample-group-grant.md` with real funded groups/projects

## Pages still to write (milestone 4)

- [ ] Privacy notice
- [ ] Get involved / Contact copy
