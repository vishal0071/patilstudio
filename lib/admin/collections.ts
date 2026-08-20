import { prisma } from '@/lib/prisma';
import {
  defaultComparison,
  defaultFaqs,
  defaultFilms,
  defaultInstagram,
  defaultPackages,
  defaultPortfolio,
  defaultServices,
  defaultStory,
  defaultTestimonials,
} from '@/lib/content/defaults';
import { PORTFOLIO_CATEGORIES, VIDEO_PROVIDERS } from '@/lib/content/types';

/**
 * The admin panel's collections, declared rather than hand-built.
 *
 * Nine editable tables would otherwise mean nine near-identical pages, nine sets of
 * form-parsing code and nine chances to forget `sortOrder`. Instead each collection
 * declares its fields here and one generic page renders and saves all of them; adding
 * a field is a line in this file.
 *
 * The trade-off is honest: a declarative editor cannot express a bespoke UI. When one
 * of these grows a genuine need for that — a drag-and-drop portfolio orderer, say —
 * it should get its own page rather than this file growing a `custom` escape hatch.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'list'
  | 'number'
  | 'boolean'
  | 'select';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  options?: readonly string[];
  /** Value used when a new row is created. */
  initial?: string | number | boolean | string[];
};

export type CollectionKey =
  | 'services'
  | 'portfolio'
  | 'packages'
  | 'comparison'
  | 'testimonials'
  | 'story'
  | 'films'
  | 'faqs'
  | 'instagram';

export type Collection = {
  key: CollectionKey;
  label: string;
  singular: string;
  description: string;
  /** Which field to show as the row's heading in the list. */
  titleField: string;
  fields: Field[];
  /** Rows written by "Load starter content". */
  seed: () => Record<string, unknown>[];
};

const IMAGE_FIELDS = (briefHelp: string): Field[] => [
  {
    name: 'imagePath',
    label: 'Photograph',
    type: 'image',
    help: 'Upload a file, or paste a /media/… path or a full https:// URL. Leave empty to show a marked placeholder.',
  },
  {
    name: 'imageAlt',
    label: 'Alt text',
    type: 'text',
    help: 'What the photograph shows, for screen readers and search.',
  },
  { name: 'imageBrief', label: 'Placeholder note', type: 'text', help: briefHelp },
];

const RATIO_FIELD = (initial: string): Field => ({
  name: 'imageRatio',
  label: 'Crop',
  type: 'select',
  options: ['portrait', 'landscape', 'square', 'tall'],
  initial,
  help: 'portrait 4:5 · landscape 3:2 · square 1:1 · tall 2:3',
});

const ORDERING_FIELDS: Field[] = [
  {
    name: 'sortOrder',
    label: 'Order',
    type: 'number',
    initial: 0,
    help: 'Lower numbers appear first.',
  },
  {
    name: 'published',
    label: 'Published',
    type: 'boolean',
    initial: true,
    help: 'Unpublish to hide it from the site without deleting it.',
  },
];

export const COLLECTIONS: Record<CollectionKey, Collection> = {
  services: {
    key: 'services',
    label: 'Services',
    singular: 'service',
    description:
      'The service grid on the home page, and one detail page each at /services/<slug>.',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'slug',
        label: 'URL slug',
        type: 'text',
        required: true,
        help: 'Lowercase words separated by hyphens. Changing it changes the page URL.',
      },
      { name: 'blurb', label: 'Short description', type: 'textarea', required: true },
      {
        name: 'detail',
        label: 'Full copy',
        type: 'textarea',
        required: true,
        help: 'Shown on the service page. Leave a blank line between paragraphs.',
      },
      {
        name: 'inclusions',
        label: 'What’s included',
        type: 'list',
        help: 'One item per line.',
      },
      ...IMAGE_FIELDS('Art direction for the empty frame, e.g. “ceremony frame, landscape”.'),
      RATIO_FIELD('portrait'),
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultServices.map((service, i) => ({
        slug: service.slug,
        title: service.title,
        blurb: service.blurb,
        detail: service.detail,
        inclusions: service.inclusions,
        imageBrief: service.photo.brief,
        imageRatio: 'portrait',
        sortOrder: i,
      })),
  },

  portfolio: {
    key: 'portfolio',
    label: 'Portfolio',
    singular: 'photograph',
    description:
      'Every frame in the gallery. “Featured” ones make the shorter home-page edit; all published ones appear on /portfolio.',
    titleField: 'imageAlt',
    fields: [
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: PORTFOLIO_CATEGORIES,
        initial: 'WEDDING',
        required: true,
        help: 'Drives the gallery filters. A category with no photographs gets no filter chip.',
      },
      ...IMAGE_FIELDS('Art direction for the empty frame.'),
      RATIO_FIELD('portrait'),
      {
        name: 'story',
        label: 'Caption',
        type: 'textarea',
        help: 'Optional line shown under the photograph in the lightbox.',
      },
      {
        name: 'featured',
        label: 'Featured on home page',
        type: 'boolean',
        initial: false,
      },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultPortfolio.map((item, i) => ({
        category: item.category,
        imageAlt: item.alt,
        imageBrief: item.brief,
        imageRatio: item.ratio,
        story: item.story,
        featured: item.featured,
        sortOrder: i,
      })),
  },

  packages: {
    key: 'packages',
    label: 'Packages',
    singular: 'package',
    description:
      'The three pricing cards. Prices are free text — set “Price is a placeholder” to false only once the figure is a real starting rate.',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      {
        name: 'priceLabel',
        label: 'Price',
        type: 'text',
        required: true,
        initial: 'Starting from ₹XX,XXX',
        help: 'Written exactly as it should appear, e.g. “Starting from ₹85,000”.',
      },
      { name: 'tagline', label: 'One-line summary', type: 'textarea', required: true },
      {
        name: 'badge',
        label: 'Badge',
        type: 'text',
        help: 'e.g. “Most Popular”. Leave empty for none — a badge also highlights the card.',
      },
      { name: 'features', label: 'Inclusions', type: 'list', help: 'One per line.' },
      { name: 'ctaLabel', label: 'Button text', type: 'text', initial: 'Enquire Now' },
      {
        name: 'pricePending',
        label: 'Price is a placeholder',
        type: 'boolean',
        initial: true,
        help: 'While on, the card says the figure is not a quote. Turn off once the price is real.',
      },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultPackages.map((pkg, i) => ({
        slug: pkg.slug,
        name: pkg.name,
        priceLabel: pkg.priceLabel,
        tagline: pkg.tagline,
        badge: pkg.badge,
        features: pkg.features,
        ctaLabel: pkg.ctaLabel,
        pricePending: pkg.pricePending,
        sortOrder: i,
      })),
  },

  comparison: {
    key: 'comparison',
    label: 'Comparison table',
    singular: 'row',
    description:
      'One row per feature. Type “Yes” for a tick, “—” for not included, or any text.',
    titleField: 'feature',
    fields: [
      { name: 'feature', label: 'Feature', type: 'text', required: true },
      { name: 'essential', label: 'Essential', type: 'text', initial: '—' },
      { name: 'signature', label: 'Signature', type: 'text', initial: '—' },
      { name: 'luxury', label: 'Luxury', type: 'text', initial: '—' },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultComparison.map((row, i) => ({
        feature: row.feature,
        essential: row.essential,
        signature: row.signature,
        luxury: row.luxury,
        sortOrder: i,
      })),
  },

  testimonials: {
    key: 'testimonials',
    label: 'Testimonials',
    singular: 'testimonial',
    description:
      'Only publish real, permissioned client words. Anything left marked as a placeholder is labelled as one on the site.',
    titleField: 'clientName',
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea', required: true },
      { name: 'clientName', label: 'Client name', type: 'text', required: true },
      {
        name: 'eventLabel',
        label: 'Event and date',
        type: 'text',
        help: 'e.g. “Wedding · November 2025”.',
      },
      { name: 'rating', label: 'Stars', type: 'number', initial: 5, help: '1 to 5.' },
      {
        name: 'isPlaceholder',
        label: 'Placeholder',
        type: 'boolean',
        initial: true,
        help: 'Leave on until this is a real testimonial you have permission to publish. Placeholders are excluded from search-engine review markup.',
      },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultTestimonials.map((item, i) => ({
        quote: item.quote,
        clientName: item.clientName,
        eventLabel: item.eventLabel,
        rating: item.rating,
        isPlaceholder: item.isPlaceholder,
        sortOrder: i,
      })),
  },

  story: {
    key: 'story',
    label: 'Wedding story',
    singular: 'chapter',
    description: 'The horizontal “one wedding, six frames” section. Four to six works best.',
    titleField: 'title',
    fields: [
      { name: 'number', label: 'Number', type: 'text', initial: '01', help: 'e.g. “01”.' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'body', label: 'Description', type: 'textarea', required: true },
      ...IMAGE_FIELDS('Art direction for this chapter’s frame.'),
      RATIO_FIELD('portrait'),
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultStory.map((chapter, i) => ({
        number: chapter.number,
        title: chapter.title,
        body: chapter.body,
        imageBrief: chapter.photo.brief,
        imageRatio: chapter.photo.ratio,
        sortOrder: i,
      })),
  },

  films: {
    key: 'films',
    label: 'Films',
    singular: 'film',
    description:
      'The first published film drives the big cinematic section; the rest appear as thumbnails. Only add films you are authorized to publish.',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'provider',
        label: 'Hosted on',
        type: 'select',
        options: VIDEO_PROVIDERS,
        initial: 'YOUTUBE',
      },
      {
        name: 'videoRef',
        label: 'Video link or id',
        type: 'text',
        help: 'A YouTube watch/share URL or id, a Vimeo URL or id, or a direct .mp4 URL. Leave empty and the section shows a poster with no player.',
      },
      ...IMAGE_FIELDS('Poster frame — 16:9 cinematic still.'),
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultFilms.map((film, i) => ({
        title: film.title,
        subtitle: film.subtitle,
        provider: film.provider,
        videoRef: film.videoRef,
        imageBrief: film.poster.brief,
        sortOrder: i,
      })),
  },

  faqs: {
    key: 'faqs',
    label: 'FAQ',
    singular: 'question',
    description:
      'Also published as FAQ structured data, so these answers can appear directly in search results.',
    titleField: 'question',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultFaqs.map((faq, i) => ({
        question: faq.question,
        answer: faq.answer,
        sortOrder: i,
      })),
  },

  instagram: {
    key: 'instagram',
    label: 'Instagram grid',
    singular: 'tile',
    description:
      'Hand-picked tiles — nothing is pulled from Instagram automatically. Upload the frame and optionally link the post it came from.',
    titleField: 'imageAlt',
    fields: [
      ...IMAGE_FIELDS('Which frame from the feed belongs here.'),
      {
        name: 'permalink',
        label: 'Post link',
        type: 'text',
        help: 'Optional. The full https://www.instagram.com/p/… URL.',
      },
      ...ORDERING_FIELDS,
    ],
    seed: () =>
      defaultInstagram.map((item, i) => ({
        imageBrief: item.photo.brief,
        sortOrder: i,
      })),
  },
};

export const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[];

/**
 * The serialisable half of a Collection.
 *
 * `Collection.seed` is a function, and React refuses to send a function across the
 * server/client boundary — passing a whole Collection to the row editor throws
 * "Functions cannot be passed directly to Client Components". So the editors take this
 * instead, and `forClient()` is the only way to produce it.
 */
export type ClientCollection = Omit<Collection, 'seed'>;

export function forClient(collection: Collection): ClientCollection {
  const { seed: _seed, ...rest } = collection;
  return rest;
}

export function isCollectionKey(value: string): value is CollectionKey {
  return value in COLLECTIONS;
}

/**
 * The minimum surface of a Prisma model delegate this panel uses.
 *
 * Each delegate is cast once, here, because the generic editor addresses nine models
 * through one code path and Prisma's per-model argument types cannot be unified. The
 * cast is contained to this map: everything downstream is checked against `Delegate`,
 * and the field declarations above are what actually keep the shapes honest.
 */
type Delegate = {
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  createMany(args: { data: Record<string, unknown>[] }): Promise<unknown>;
  count(args?: unknown): Promise<number>;
};

export function delegateFor(key: CollectionKey): Delegate {
  const map: Record<CollectionKey, unknown> = {
    services: prisma.service,
    portfolio: prisma.portfolioImage,
    packages: prisma.package,
    comparison: prisma.comparisonRow,
    testimonials: prisma.testimonial,
    story: prisma.storyChapter,
    films: prisma.film,
    faqs: prisma.faqItem,
    instagram: prisma.instagramItem,
  };
  return map[key] as Delegate;
}
