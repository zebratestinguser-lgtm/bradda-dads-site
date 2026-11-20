/**
 * Content collections. Every field here is something a non-technical editor
 * could fill in a form later (Decap CMS, phase 2), so keep them simple:
 * text, dates, booleans, enums, lists and image paths.
 *
 * Images: all uploads live in public/uploads/ and are referenced by path,
 * e.g. "/uploads/news/bonfire.jpg". Leave a field empty rather than invent one.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** An image path inside public/uploads/ */
const uploadPath = z
  .string()
  .regex(/^\/uploads\/.+\.(jpe?g|png|webp|avif|gif|svg)$/i, 'Images must live in /uploads/ (public/uploads/)');

/** A link: a full URL, or "#" while it is still a placeholder */
const link = z.union([z.url(), z.literal('#'), z.string().startsWith('/'), z.string().startsWith('mailto:')]);

export const NEWS_TAGS = [
  'Bonfire',
  'Christmas card',
  "Pensioners' lunch",
  'Duck race',
  "Wolf's Pit",
  'Village',
  'Carnival',
  'Tour of Bradwell',
  'Social',
] as const;

/** Where an entry was imported from (old Blogspot/WordPress sites). */
const source = z.url().optional();

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date(),
      tag: z.enum(NEWS_TAGS),
      image: uploadPath.optional(),
      imageAlt: z.string().optional(),
      summary: z.string(),
      featured: z.boolean().default(false),
      /** Photo album for this story, if there is one. */
      album: reference('albums').optional(),
      source,
    })
    .refine((d) => !d.image || (d.imageAlt && d.imageAlt.length > 0), {
      message: 'imageAlt is required when an image is set',
      path: ['imageAlt'],
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    name: z.string(),
    /** Short label for cards, e.g. "November" or "26 December". */
    when: z.string(),
    /** Start date & time (UK time, e.g. 2026-12-26T11:00:00+00:00). Leave out if unknown. */
    start: z.coerce.date().optional(),
    /** Set true only once the start time (not just the date) is confirmed. */
    startTimeConfirmed: z.boolean().default(false),
    /** Last day (or end time) for events that run over several days, e.g. a gala weekend.
     *  A date on its own (2027-07-11) means the whole of that day. */
    end: z.coerce.date().optional(),
    location: z.string(),
    summary: z.string(),
    status: z.enum(['upcoming', 'open', 'done']),
    /** When entries/sales close (UK time). After this, "Open now" becomes "Entries closed" and the homepage banner hides. */
    entriesClose: z.coerce.date().optional(),
    ctaLabel: z.string(),
    ctaUrl: link,
    /** Tie-breaker when two events fall on the same date (1 = first). */
    order: z.number().int(),
    /** The month this event usually happens (1–12). Events repeat every year, so this places it in the
     *  rolling calendar when there's no `start` date for the next one yet. */
    month: z.number().int().min(1).max(12).optional(),
    /** Price shown on the hero button, e.g. "£2". */
    price: z.string().optional(),
    // Homepage hero (used when this is the next event). All optional.
    /** Big headline, e.g. "The Boxing Day Duck Race". Defaults to the name. */
    heroTitle: z.string().optional(),
    /** Part of the headline shown in yellow, e.g. "Duck Race". */
    heroHighlight: z.string().optional(),
    /** Paragraph under the headline. Defaults to the summary. */
    heroText: z.string().optional(),
    /** Line above the countdown numbers, e.g. "Ducks hit the water in". */
    countdownLabel: z.string().optional(),
    /** Small note under the countdown, e.g. prize and where to buy. */
    heroNote: z.string().optional(),
    /** Photo shown in the homepage hero when this is the next event. */
    heroImage: uploadPath.optional(),
    heroImageAlt: z.string().optional(),
    /** Visible caption on the photo, including when it was taken, e.g. "Boxing Day 2009". */
    heroImageCaption: z.string().optional(),
    /** Practical line shown under "When and where", e.g. parking or "2027 date to be confirmed". */
    whenWhereNote: z.string().optional(),
    /** "How to get involved": ways to take part, shown as cards on the event page. */
    involvement: z
      .array(
        z.object({
          title: z.string(),
          text: z.string(),
          url: link.optional(),
          label: z.string().optional(),
          /** Hide this card once entries have closed (e.g. "Pay £5" for the Christmas card) */
          onlyWhenOpen: z.boolean().default(false),
        }),
      )
      .default([]),
  }),
});

const albums = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/albums', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: z.object({
    title: z.string(),
    /** What kind of event the photos are from (same list as news tags); used to filter the photos page. */
    category: z.enum(NEWS_TAGS).optional(),
    event: reference('events').optional(),
    /** When the photos were taken (used for sorting and shown on every photo). */
    date: z.coerce.date(),
    /** Shown instead of the date when there isn't one exact date, e.g. "2017–2021" or "Summer 2016". */
    dateLabel: z.string().optional(),
    cover: uploadPath.optional(),
    coverAlt: z.string().optional(),
    photos: z
      .array(
        z.object({
          src: uploadPath,
          alt: z.string().min(1, 'Every photo needs alt text'),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    source,
  }),
});

/**
 * Race results: src/content/results/<race>/YYYY.md + YYYY.csv
 * Races: wolfspit, tour-of-bradwell-long, tour-of-bradwell-half
 */
export const RACES = {
  wolfspit: "Wolf's Pit Fell Race",
  'tour-of-bradwell-long': 'Long Tour of Bradwell',
  'tour-of-bradwell-half': 'Half Tour of Bradwell',
} as const;

const results = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/results' }),
  schema: z.object({
    year: z.number().int(),
    date: z.coerce.date().optional(),
    courseNotes: z.string().optional(),
    /** Leave out and it is counted from the CSV. */
    finishers: z.number().int().optional(),
    /** CSV file next to this one, e.g. "2026.csv". */
    csv: z.string().regex(/\.csv$/),
    /** Original results document (PDF) in /uploads/results/, if there is one. */
    original: z.string().startsWith('/uploads/').optional(),
    /** Notes shown with the results, e.g. how the original was converted. */
    notes: z.string().optional(),
    source,
  }),
});

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z.object({
    /** Text so unknown years can stay as "[YEAR]". */
    year: z.string(),
    title: z.string(),
    text: z.string(),
    image: uploadPath.optional(),
    imageAlt: z.string().optional(),
    /** Sort position on the timeline (1 = earliest). */
    order: z.number().int(),
    source,
  }),
});

const funded = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/funded' }),
  schema: z.object({
    name: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    year: z.string(),
    amount: z.string().optional(),
    summary: z.string(),
    image: uploadPath.optional(),
    imageAlt: z.string().optional(),
    /** Set false while the pin position is still a guess. */
    locationConfirmed: z.boolean().default(false),
    source,
  }),
});

/**
 * Members ("Meet the dads"): src/content/members/<name>.md. Only add someone with their OK
 * to publishing their name and photo. The longer profile goes below the --- line.
 */
const members = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/members' }),
  schema: z
    .object({
      name: z.string(),
      /** e.g. "Chair", "Treasurer", "Duck race lead". Leave out for members without a role. */
      role: z.string().optional(),
      photo: uploadPath.optional(),
      photoAlt: z.string().optional(),
      /** Year they joined Bradda Dads, e.g. 2015 ("Member since 2015 · 11 years"). */
      joined: z.number().int().min(1999).max(2100).optional(),
      /** One or two sentences for the card. */
      summary: z.string(),
      favouriteEvent: z.string().optional(),
      funFact: z.string().optional(),
      /** false = past member (hidden from the current list) */
      current: z.boolean().default(true),
      /** Position on the page; committee roles usually first. */
      order: z.number().int().default(100),
    })
    .refine((d) => !d.photo || (d.photoAlt && d.photoAlt.length > 0), { message: 'photoAlt is required when a photo is set', path: ['photoAlt'] }),
});

/** Site-wide settings: src/data/site.yaml (everything sits under a top-level `site:` key). */
const settings = defineCollection({
  loader: file('src/data/site.yaml'),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    facebookUrl: z.url(),
    contactEmail: z.string(),
    cicName: z.string(),
    cicNumber: z.string(),
    sumupStoreUrl: link,
    donationLinks: z
      .array(z.object({ amount: z.number(), url: link, label: z.string() }))
      .length(3, 'Exactly three donation buttons'),
    donationQr: uploadPath.optional(),
    totalRaised: z.string(),
    groupsHelped: z.string(),
    meetingInfo: z.string(),
    sharePhotosUrl: link,
    accountsUrl: link,
    wolfspitEntryUrl: link,
    wolfspitIntro: z.string(),
    whoWeAre: z.string(),
    joinHeadline: z.string(),
    joinText: z.string(),
    storyIntro: z.string(),
    storyImage: uploadPath.optional(),
    storyImageAlt: z.string().optional(),
    /** Visible caption under the archive photo, including when it was taken. */
    storyImageCaption: z.string().optional(),
    /** SumUp payment link for the £5 Christmas card message. */
    christmasCardPaymentUrl: link,
    /** Upcoming public dates for the homepage. Past dates are hidden automatically. */
    diaryDates: z
      .array(z.object({ date: z.coerce.date(), label: z.string().optional(), text: z.string(), url: link.optional() }))
      .default([]),
    facebookPosts: z
      .array(z.object({ date: z.string(), text: z.string(), url: link, image: uploadPath.optional(), imageAlt: z.string().optional() }))
      .max(3)
      .default([]),
  }),
});

export const collections = { news, events, albums, results, timeline, funded, members, settings };
