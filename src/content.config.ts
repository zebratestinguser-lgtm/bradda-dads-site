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
  'Wolfspit',
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
    end: z.coerce.date().optional(),
    location: z.string(),
    summary: z.string(),
    status: z.enum(['upcoming', 'open', 'done']),
    ctaLabel: z.string(),
    ctaUrl: link,
    /** Position on the homepage "year" strip (1 = first). */
    order: z.number().int(),
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
    storyIntro: z.string(),
    storyImage: uploadPath.optional(),
    storyImageAlt: z.string().optional(),
    /** Visible caption under the archive photo, including when it was taken. */
    storyImageCaption: z.string().optional(),
    /** SumUp payment link for the £5 Christmas card message. */
    christmasCardPaymentUrl: link,
    facebookPosts: z
      .array(z.object({ date: z.string(), text: z.string(), url: link, image: uploadPath.optional(), imageAlt: z.string().optional() }))
      .max(3)
      .default([]),
  }),
});

export const collections = { news, events, albums, results, timeline, funded, settings };
