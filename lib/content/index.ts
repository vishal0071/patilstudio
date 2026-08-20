import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  defaultComparison,
  defaultFaqs,
  defaultFilms,
  defaultInstagram,
  defaultPackages,
  defaultPortfolio,
  defaultProcess,
  defaultServices,
  defaultStory,
  defaultTestimonials,
  defaultValues,
} from './defaults';
import { type Settings, settingDefaults } from './settings';
import type {
  ComparisonRow,
  FaqItem,
  Film,
  InstagramItem,
  Package,
  Photo,
  PortfolioItem,
  Service,
  SiteContent,
  StoryChapter,
  Testimonial,
  VideoProvider,
} from './types';

export * from './types';
export * from './settings';
export {
  BUDGET_BANDS,
  EVENT_TYPES,
  SERVICE_OPTIONS,
} from './defaults';

/** Cache tag revalidated by every admin mutation. */
export const CONTENT_TAG = 'site-content';

/**
 * Reads the whole site's content and hands it to the page.
 *
 * Three properties matter here.
 *
 * **It never throws.** If Postgres is unreachable the defaults are served and the page
 * renders in full. The alternative — a 500 on the home page because a marketing site
 * could not read a heading out of a database — is strictly worse for a studio whose
 * visitors arrive from Instagram and will not come back for a retry.
 *
 * **It is request-scoped.** `cache()` means the layout, the page, `generateMetadata`
 * and the JSON-LD block share one read instead of issuing four.
 *
 * **It is cached across requests, by tag.** `unstable_cache` keeps the ten queries
 * from running on every visit, and the admin panel calls `revalidateTag(CONTENT_TAG)`
 * on save so an edit is live immediately rather than after a timer. The pages
 * themselves stay dynamic on purpose: prerendering them at build time would bake in
 * whatever the defaults were on a build machine that cannot reach the database, and
 * the first visitor after each deploy would see seed content.
 */
const loadContent = unstable_cache(
  async (): Promise<SiteContent> => readContent(),
  ['site-content'],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

export const getContent = cache((): Promise<SiteContent> => loadContent());

async function readContent(): Promise<SiteContent> {
  const fallback = (): SiteContent => ({
    settings: { ...settingDefaults } as Settings,
    services: defaultServices,
    portfolio: defaultPortfolio,
    packages: defaultPackages,
    comparison: defaultComparison,
    testimonials: defaultTestimonials,
    story: defaultStory,
    films: defaultFilms,
    faqs: defaultFaqs,
    instagram: defaultInstagram,
    values: defaultValues,
    process: defaultProcess,
  });

  try {
    const [
      settingRows,
      services,
      portfolio,
      packages,
      comparison,
      testimonials,
      story,
      films,
      faqs,
      instagram,
    ] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.service.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.portfolioImage.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.package.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.comparisonRow.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.storyChapter.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.film.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.faqItem.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.instagramItem.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const settings = { ...settingDefaults } as Settings;
    for (const row of settingRows) {
      // Unknown keys are ignored rather than widening Settings: a stale row left
      // behind by a renamed key must not become a property the site reads.
      if (row.key in settings) settings[row.key as keyof Settings] = row.value;
    }

    return {
      settings,
      // An empty table means "not set up yet" and falls back; a table with rows is
      // taken as the studio's own edit, even if it is shorter than the default set.
      services: services.length ? services.map(toService) : defaultServices,
      portfolio: portfolio.length ? portfolio.map(toPortfolioItem) : defaultPortfolio,
      packages: packages.length ? packages.map(toPackage) : defaultPackages,
      comparison: comparison.length ? comparison.map(toComparisonRow) : defaultComparison,
      testimonials: testimonials.length ? testimonials.map(toTestimonial) : defaultTestimonials,
      story: story.length ? story.map(toStoryChapter) : defaultStory,
      films: films.length ? films.map(toFilm) : defaultFilms,
      faqs: faqs.length ? faqs.map(toFaqItem) : defaultFaqs,
      instagram: instagram.length ? instagram.map(toInstagramItem) : defaultInstagram,
      // Not database-backed: four fixed value props and five fixed process steps are
      // structure, not content. Editing them is a code change, on purpose.
      values: defaultValues,
      process: defaultProcess,
    };
  } catch (error) {
    console.error('[content] falling back to defaults — could not read from Postgres', error);
    return fallback();
  }
}

/* ── Row → view-model mappers ──────────────────────────────────────── */

type ImageRow = {
  id: string;
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
  imageRatio?: string;
};

function toPhoto(row: ImageRow, fallbackRatio: Photo['ratio'] = 'landscape'): Photo {
  const ratio = row.imageRatio ?? fallbackRatio;
  return {
    id: row.id,
    // Empty string in the DB and NULL both mean "no photograph", so normalise here
    // rather than making every consumer test for both.
    src: row.imagePath?.trim() || null,
    alt: row.imageAlt?.trim() || '',
    brief: row.imageBrief?.trim() || 'Photograph to be supplied by the studio',
    ratio: isRatio(ratio) ? ratio : fallbackRatio,
  };
}

function isRatio(value: string): value is Photo['ratio'] {
  return value === 'portrait' || value === 'landscape' || value === 'square' || value === 'tall';
}

function toService(row: {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  detail: string;
  inclusions: string[];
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
  imageRatio: string;
}): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    blurb: row.blurb,
    detail: row.detail,
    inclusions: row.inclusions,
    photo: toPhoto(row),
  };
}

function toPortfolioItem(row: {
  id: string;
  category: PortfolioItem['category'];
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
  imageRatio: string;
  story: string | null;
  featured: boolean;
}): PortfolioItem {
  return {
    ...toPhoto(row, 'portrait'),
    category: row.category,
    story: row.story?.trim() || null,
    featured: row.featured,
  };
}

function toPackage(row: {
  id: string;
  slug: string;
  name: string;
  priceLabel: string;
  tagline: string;
  badge: string | null;
  features: string[];
  ctaLabel: string;
  pricePending: boolean;
}): Package {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceLabel: row.priceLabel,
    tagline: row.tagline,
    badge: row.badge?.trim() || null,
    features: row.features,
    ctaLabel: row.ctaLabel,
    pricePending: row.pricePending,
  };
}

function toComparisonRow(row: {
  id: string;
  feature: string;
  essential: string;
  signature: string;
  luxury: string;
}): ComparisonRow {
  return row;
}

function toTestimonial(row: {
  id: string;
  quote: string;
  clientName: string;
  eventLabel: string;
  rating: number;
  isPlaceholder: boolean;
}): Testimonial {
  return row;
}

function toStoryChapter(row: {
  id: string;
  number: string;
  title: string;
  body: string;
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
  imageRatio: string;
}): StoryChapter {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    body: row.body,
    photo: toPhoto(row, 'portrait'),
  };
}

function toFilm(row: {
  id: string;
  title: string;
  subtitle: string;
  provider: VideoProvider;
  videoRef: string;
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
}): Film {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    provider: row.provider,
    videoRef: row.videoRef.trim(),
    poster: toPhoto({ ...row, imageRatio: 'landscape' }),
  };
}

function toFaqItem(row: { id: string; question: string; answer: string }): FaqItem {
  return row;
}

function toInstagramItem(row: {
  id: string;
  imagePath: string | null;
  imageAlt: string | null;
  imageBrief: string | null;
  permalink: string | null;
}): InstagramItem {
  return {
    id: row.id,
    photo: toPhoto({ ...row, imageRatio: 'square' }, 'square'),
    permalink: row.permalink?.trim() || null,
  };
}
