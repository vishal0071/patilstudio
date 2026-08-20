import type { Settings } from './settings';

/**
 * Content shapes shared by the public site, the admin panel and the seed defaults.
 *
 * Every one of these is editable from /admin — nothing on the public site reads a
 * hard-coded string except through `lib/content/defaults.ts`, which exists so the
 * site renders a complete, coherent page on the very first boot (and if Postgres is
 * briefly unreachable) rather than a skeleton full of empty slots.
 */

export const PORTFOLIO_CATEGORIES = [
  'WEDDING',
  'PRE_WEDDING',
  'ENGAGEMENT',
  'MATERNITY',
  'BABY',
  'EVENTS',
  'FILMS',
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

/** Filter labels, in display order. `ALL` is synthesised by the gallery. */
export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  WEDDING: 'Weddings',
  PRE_WEDDING: 'Pre-Wedding',
  ENGAGEMENT: 'Engagement',
  MATERNITY: 'Maternity',
  BABY: 'Baby',
  EVENTS: 'Events',
  FILMS: 'Cinematic Films',
};

export const VIDEO_PROVIDERS = ['YOUTUBE', 'VIMEO', 'MP4'] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

/**
 * A photograph slot.
 *
 * `src` empty/null is a first-class state, not a bug: the studio's own photographs
 * are the only ones this site may show, so until they are uploaded every slot
 * renders a clearly-marked placeholder carrying `brief` as its caption. Nothing
 * here ever substitutes stock photography for the studio's work.
 */
export type Photo = {
  id: string;
  src: string | null;
  alt: string;
  /** Art direction for the empty slot — shown inside the placeholder. */
  brief: string;
  /** Portrait/landscape/square drives the masonry rhythm. */
  ratio: 'portrait' | 'landscape' | 'square' | 'tall';
};

export type PortfolioItem = Photo & {
  category: PortfolioCategory;
  /** Optional line shown in the lightbox under the frame. */
  story: string | null;
  featured: boolean;
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  /** Long copy for the service detail page. Paragraphs split on blank lines. */
  detail: string;
  /** Bullet list on the detail page. */
  inclusions: string[];
  photo: Photo;
};

export type Package = {
  id: string;
  slug: string;
  name: string;
  /** Free text on purpose — "Starting from ₹XX,XXX" until the studio sets real numbers. */
  priceLabel: string;
  tagline: string;
  /** e.g. "Most Popular". Empty for none. */
  badge: string | null;
  features: string[];
  ctaLabel: string;
  /** True while priceLabel is still the placeholder — drives the on-page notice. */
  pricePending: boolean;
};

export type ComparisonRow = {
  id: string;
  feature: string;
  essential: string;
  signature: string;
  luxury: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  clientName: string;
  eventLabel: string;
  rating: number;
  /** Marked in the UI, so a placeholder is never mistaken for a real client. */
  isPlaceholder: boolean;
};

export type StoryChapter = {
  id: string;
  number: string;
  title: string;
  body: string;
  photo: Photo;
};

export type Film = {
  id: string;
  title: string;
  subtitle: string;
  provider: VideoProvider;
  /** YouTube/Vimeo id, or an absolute/relative URL for MP4. */
  videoRef: string;
  poster: Photo;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type InstagramItem = {
  id: string;
  photo: Photo;
  permalink: string | null;
};

export type ValueProp = {
  id: string;
  title: string;
  body: string;
  /** Key into components/ui/icons.tsx */
  icon: 'heart' | 'film' | 'team' | 'compass';
};

export type ProcessStep = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export type SiteContent = {
  settings: Settings;
  services: Service[];
  portfolio: PortfolioItem[];
  packages: Package[];
  comparison: ComparisonRow[];
  testimonials: Testimonial[];
  story: StoryChapter[];
  films: Film[];
  faqs: FaqItem[];
  instagram: InstagramItem[];
  values: ValueProp[];
  process: ProcessStep[];
};
