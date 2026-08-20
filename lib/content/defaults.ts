import type {
  ComparisonRow,
  FaqItem,
  Film,
  InstagramItem,
  Package,
  PortfolioItem,
  ProcessStep,
  Service,
  StoryChapter,
  Testimonial,
  ValueProp,
} from './types';

/**
 * Seed content.
 *
 * These are the values the site falls back to for any collection the studio has not
 * populated yet, and the rows `pnpm db:seed` writes into Postgres so the admin panel
 * opens with something to edit rather than nine empty tables.
 *
 * Two rules held throughout:
 *   1. No photograph is invented. Every `src` is null, so every frame renders as a
 *      marked placeholder carrying its `brief` — art direction for the studio, and
 *      an unambiguous signal to a visitor that this slot is not finished work.
 *   2. No fact is invented. Prices are '₹XX,XXX', testimonials are flagged
 *      `isPlaceholder`, and the statistics carry a "to be confirmed" note until the
 *      owner flips `stats.confirmed`.
 */

const photo = (
  id: string,
  brief: string,
  ratio: 'portrait' | 'landscape' | 'square' | 'tall' = 'landscape',
  alt = '',
) => ({ id, src: null, alt, brief, ratio });

export const defaultServices: Service[] = [
  {
    id: 'svc-wedding',
    slug: 'wedding-photography',
    title: 'Wedding Photography',
    blurb:
      'Candid and traditional wedding photography capturing emotions, rituals, family and unforgettable moments.',
    detail:
      'A wedding day moves quickly and rarely in the order anyone planned. We cover it with two lenses at once — a candid photographer following the emotion, and a traditional photographer making sure every ritual, every relative and every portrait the family will ask for is properly made.\n\nWe arrive early, learn the names that matter, and then stay out of the way. What you get back is the day as it actually felt: the mother adjusting a pallu, the cousin who cannot stop laughing, the quiet second before the mangalsutra.',
    inclusions: [
      'Candid and traditional coverage running in parallel',
      'Full ritual documentation, start to finish',
      'Family and group portraits',
      'Colour-graded, hand-edited photographs',
      'Private online gallery to share with family',
    ],
    photo: photo('svc-wedding-img', 'Wedding day frame — ceremony or varmala moment, landscape', 'landscape'),
  },
  {
    id: 'svc-cinematography',
    slug: 'wedding-cinematography',
    title: 'Wedding Cinematography',
    blurb:
      'Cinematic wedding films, highlight videos and storytelling that make your wedding feel alive again.',
    detail:
      'Photographs hold a moment. Film holds the sound of it — the vows, the dhol, your father’s voice cracking halfway through a speech.\n\nWe shoot with a cinematographer’s eye rather than an event camera’s: composed frames, real audio, and an edit built around the story of your day instead of a chronological log of it.',
    inclusions: [
      'Cinematic highlight film',
      'Short-form teaser for sharing',
      'Live audio from vows and speeches',
      'Colour-graded, licensed music',
      'Full-length ceremony edit on request',
    ],
    photo: photo('svc-cine-img', 'Cinematographer at work, or a film-still style frame, landscape', 'landscape'),
  },
  {
    id: 'svc-pre-wedding',
    slug: 'pre-wedding-photography',
    title: 'Pre-Wedding Photography',
    blurb: 'Creative couple sessions designed around your personalities, locations and story.',
    detail:
      'A pre-wedding shoot is the one part of the whole process that is entirely yours — no guest list, no schedule, no rituals to keep to.\n\nWe plan it around who you actually are. A fort at first light, a Pune café you have been going to since college, a drive out towards Lonavala in the rain. The point is not the backdrop; it is that you look like yourselves in it.',
    inclusions: [
      'Location scouting and concept planning',
      'Half-day or full-day session',
      'Outfit and timing guidance',
      'Hand-edited photographs',
      'Optional pre-wedding film',
    ],
    photo: photo('svc-pre-img', 'Pre-wedding couple frame on location, vertical', 'portrait'),
  },
  {
    id: 'svc-engagement',
    slug: 'engagement-photography',
    title: 'Engagement Photography',
    blurb: 'Elegant coverage of engagement, ring ceremony and intimate celebrations.',
    detail:
      'The engagement is usually the first time both families are in one room, and it is worth photographing properly.\n\nWe cover the ceremony, the rings, the blessings and the portraits, and we do it at a scale that suits the event — one photographer for an intimate afternoon, a full team where the celebration calls for it.',
    inclusions: [
      'Full ring ceremony coverage',
      'Candid and posed family portraits',
      'Décor and detail photographs',
      'Hand-edited photographs',
      'Same-day social media edit on request',
    ],
    photo: photo('svc-eng-img', 'Ring ceremony close-up or couple portrait, square', 'square'),
  },
  {
    id: 'svc-maternity',
    slug: 'maternity-photography',
    title: 'Maternity Photography',
    blurb: 'Beautiful, emotional portraits celebrating motherhood.',
    detail:
      'Maternity sessions are quiet, unhurried and shot at whatever pace is comfortable — at home in natural light, or outdoors early in the day.\n\nWe keep the direction gentle and the styling simple, because the photographs that last are the ones that look like a real moment rather than a set.',
    inclusions: [
      'Indoor or outdoor session',
      'Styling and wardrobe guidance',
      'Partner and sibling portraits',
      'Hand-edited photographs',
      'Print-ready files',
    ],
    photo: photo('svc-mat-img', 'Maternity portrait in soft natural light, vertical', 'portrait'),
  },
  {
    id: 'svc-baby-family',
    slug: 'baby-and-family-photography',
    title: 'Baby & Family Photography',
    blurb: 'Natural and artistic photography for birthdays, newborns and family milestones.',
    detail:
      'Children do not take direction, so we do not give much. We let the session run on the child’s clock and photograph what happens.\n\nNewborn sittings, first birthdays, naming ceremonies, or simply a family that has not had a proper photograph together in a decade — all of it works the same way.',
    inclusions: [
      'Newborn, birthday or milestone session',
      'Family group portraits',
      'Home or studio setting',
      'Hand-edited photographs',
      'Album and print options',
    ],
    photo: photo('svc-baby-img', 'Baby or family frame, warm and candid, square', 'square'),
  },
  {
    id: 'svc-events',
    slug: 'event-photography',
    title: 'Event Photography',
    blurb:
      'Professional photography and videography for birthdays, corporate events and special occasions.',
    detail:
      'Birthdays, anniversaries, housewarmings, conferences and brand events — covered with the same discipline as a wedding: arrive early, understand the run sheet, photograph the people rather than the room.\n\nDeliverables can be turned around quickly where an event needs same-day images for social or press.',
    inclusions: [
      'Photography and optional videography',
      'Full run-of-event coverage',
      'Speaker, stage and candid guest frames',
      'Fast-turnaround edit for social use',
      'Online gallery for the organisers',
    ],
    photo: photo('svc-event-img', 'Event frame — stage, celebration or guests, landscape', 'landscape'),
  },
  {
    id: 'svc-traditional',
    slug: 'traditional-photography-and-videography',
    title: 'Traditional Photography & Videography',
    blurb: 'Complete traditional coverage of ceremonies and important rituals.',
    detail:
      'Candid photography is only half of an Indian wedding. The traditional coverage — the posed portraits, the ritual sequences, the every-relative-photographed thoroughness — is what the family will actually ask for afterwards.\n\nWe treat it as a craft in its own right rather than a fallback, with dedicated photographers and videographers who do nothing else.',
    inclusions: [
      'Dedicated traditional photographer',
      'Traditional videography with full ritual coverage',
      'Complete family and relative portraits',
      'Ritual-by-ritual documentation',
      'Album-ready edits',
    ],
    photo: photo('svc-trad-img', 'Traditional ritual frame — haldi, mangalashtak or homa, landscape', 'landscape'),
  },
];

export const defaultPortfolio: PortfolioItem[] = [
  ['WEDDING', 'Varmala moment under evening light', 'portrait', 'The garlands, and the second before them.'],
  ['WEDDING', 'Bride’s entry, wide, guests reacting', 'landscape', null],
  ['WEDDING', 'Groom with his brothers before the baraat', 'square', null],
  ['WEDDING', 'Mangalsutra, close, hands only', 'portrait', 'Twelve seconds that take nine months to plan.'],
  ['WEDDING', 'Mother of the bride during the vidai', 'tall', 'The frame nobody asks for and everybody keeps.'],
  ['WEDDING', 'Sangeet — dancing, motion blur, colour', 'landscape', null],
  ['PRE_WEDDING', 'Couple on a fort wall at first light', 'landscape', null],
  ['PRE_WEDDING', 'Couple walking away, backlit, silhouette', 'portrait', null],
  ['PRE_WEDDING', 'Close portrait, hands, laughing', 'square', null],
  ['ENGAGEMENT', 'Ring exchange, both families watching', 'landscape', null],
  ['ENGAGEMENT', 'Ring detail on décor', 'square', null],
  ['MATERNITY', 'Maternity portrait, window light, at home', 'portrait', null],
  ['MATERNITY', 'Partner’s hands, expectant mother, close', 'square', null],
  ['BABY', 'Newborn asleep, wrapped, overhead', 'landscape', null],
  ['BABY', 'First birthday, cake, chaos', 'portrait', null],
  ['EVENTS', 'Reception stage, wide, full room', 'landscape', null],
  ['EVENTS', 'Guests mid-celebration, candid', 'square', null],
  ['FILMS', 'Film still — cinematic frame from a highlight edit', 'landscape', 'Pulled from a wedding film.'],
].map(([category, brief, ratio, story], i) => ({
  id: `pf-${String(i + 1).padStart(2, '0')}`,
  src: null,
  alt: brief as string,
  brief: brief as string,
  ratio: ratio as PortfolioItem['ratio'],
  category: category as PortfolioItem['category'],
  story: (story as string | null) ?? null,
  featured: i < 12,
}));

/**
 * Prices are placeholders, deliberately. `pricePending` drives a visible notice, so
 * a visitor is never shown an invented rupee figure as if the studio had quoted it.
 */
export const defaultPackages: Package[] = [
  {
    id: 'pkg-essential',
    slug: 'essential',
    name: 'Essential',
    priceLabel: 'Starting from ₹XX,XXX',
    tagline: 'For an intimate celebration, covered properly by one photographer.',
    badge: null,
    features: [
      '1 Photographer',
      'Traditional Photography',
      'Edited Photos',
      'Online Gallery',
      'Basic Coverage',
    ],
    ctaLabel: 'Enquire Now',
    pricePending: true,
  },
  {
    id: 'pkg-signature',
    slug: 'signature',
    name: 'Signature',
    priceLabel: 'Starting from ₹XX,XXX',
    tagline: 'Candid, traditional and cinematic — the full wedding, documented.',
    badge: 'Most Popular',
    features: [
      'Candid Photographer',
      'Traditional Photographer',
      'Cinematic Videographer',
      'Highlight Film',
      'Edited Photos',
      'Online Gallery',
      'Premium Album',
    ],
    ctaLabel: 'Choose Signature',
    pricePending: true,
  },
  {
    id: 'pkg-luxury',
    slug: 'luxury',
    name: 'Luxury',
    priceLabel: 'Starting from ₹XX,XXX',
    tagline: 'A full team across every event, with nothing left uncovered.',
    badge: null,
    features: [
      'Multiple Photographers',
      'Cinematic Team',
      'Traditional Photography',
      'Traditional Videography',
      'Drone Coverage where legally permitted',
      'Cinematic Wedding Film',
      'Highlight Reel',
      'Premium Wedding Album',
      'Instagram Reels',
      'Complete Event Coverage',
    ],
    ctaLabel: 'Build My Package',
    pricePending: true,
  },
];

export const defaultComparison: ComparisonRow[] = [
  ['Photographer', '1', '2', '3+'],
  ['Candid Photography', '—', 'Yes', 'Yes'],
  ['Traditional Photography', 'Yes', 'Yes', 'Yes'],
  ['Videography', '—', 'Yes', 'Yes'],
  ['Cinematic Film', '—', 'Highlight film', 'Full film + highlight'],
  ['Highlight Reel', '—', 'Yes', 'Yes'],
  ['Drone', '—', 'On request', 'Where legally permitted'],
  ['Album', 'Digital', 'Premium album', 'Premium album'],
  ['Online Gallery', 'Yes', 'Yes', 'Yes'],
  ['Instagram Reels', '—', 'On request', 'Yes'],
  ['Coverage Hours', 'To be confirmed', 'To be confirmed', 'To be confirmed'],
  ['Number of Events', '1', 'Up to 3', 'All events'],
].map(([feature, essential, signature, luxury], i) => ({
  id: `cmp-${String(i + 1).padStart(2, '0')}`,
  feature: feature as string,
  essential: essential as string,
  signature: signature as string,
  luxury: luxury as string,
}));

/**
 * Placeholders, flagged as such and rendered with a visible marker. Replace them
 * with real, permissioned client words in the admin panel — and delete any that are
 * still placeholders before launch.
 */
export const defaultTestimonials: Testimonial[] = [
  {
    id: 'tst-1',
    quote:
      'Placeholder testimonial — replace this with a real client’s own words, with their permission, from the admin panel.',
    clientName: 'Client name',
    eventLabel: 'Wedding · Month Year',
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 'tst-2',
    quote:
      'Placeholder testimonial — a second slot, so the carousel has something to move between before real reviews are added.',
    clientName: 'Client name',
    eventLabel: 'Pre-Wedding · Month Year',
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 'tst-3',
    quote:
      'Placeholder testimonial — keep the wording the couple actually used; edited praise reads as invented, because it usually is.',
    clientName: 'Client name',
    eventLabel: 'Engagement · Month Year',
    rating: 5,
    isPlaceholder: true,
  },
];

export const defaultStory: StoryChapter[] = [
  {
    id: 'st-1',
    number: '01',
    title: 'Getting Ready',
    body: 'Half-finished chai, a room full of relatives, and the last quiet hour anyone will get all day.',
    photo: photo('st-1-img', 'Getting ready — bride or groom preparing, mirror, family around', 'portrait'),
  },
  {
    id: 'st-2',
    number: '02',
    title: 'The First Look',
    body: 'Everything that was nerves five minutes ago turns into something else entirely.',
    photo: photo('st-2-img', 'First look — the moment they see each other', 'landscape'),
  },
  {
    id: 'st-3',
    number: '03',
    title: 'The Ceremony',
    body: 'The rituals your grandparents took the same way, photographed so nothing is missed.',
    photo: photo('st-3-img', 'Ceremony — mandap, fire, priest, the couple seated', 'landscape'),
  },
  {
    id: 'st-4',
    number: '04',
    title: 'The Celebration',
    body: 'The dhol starts, the schedule collapses, and it becomes the best part of the day.',
    photo: photo('st-4-img', 'Celebration — dancing, baraat, colour and motion', 'landscape'),
  },
  {
    id: 'st-5',
    number: '05',
    title: 'The People',
    body: 'Aunts, cousins, school friends, the uncle who has an opinion about the catering. All of them.',
    photo: photo('st-5-img', 'The people — group or candid guest frames', 'square'),
  },
  {
    id: 'st-6',
    number: '06',
    title: 'Forever',
    body: 'The last frame of the night, when the noise finally drops and it is just the two of you.',
    photo: photo('st-6-img', 'Final frame — couple alone, night, quiet', 'portrait'),
  },
];

/** No film is embedded until the studio supplies an authorized one. */
export const defaultFilms: Film[] = [
  {
    id: 'film-1',
    title: 'Wedding Highlight Film',
    subtitle: 'Add your own highlight film in the admin panel',
    provider: 'YOUTUBE',
    videoRef: '',
    poster: photo('film-1-poster', 'Film poster frame — cinematic still, landscape 16:9', 'landscape'),
  },
];

export const defaultFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What photography services do you provide?',
    answer:
      'Wedding photography and cinematography, pre-wedding and engagement shoots, maternity, newborn, baby and family portraits, event photography and full traditional photography and videography. Most couples book a combination — candid and traditional coverage together, with a cinematic film alongside.',
  },
  {
    id: 'faq-2',
    question: 'Do you travel outside Pune?',
    answer:
      'Yes. We are based in Pune and regularly work across Maharashtra and at destination weddings elsewhere in India. Travel and stay for the team are quoted separately and shown clearly in your estimate.',
  },
  {
    id: 'faq-3',
    question: 'How early should we book?',
    answer:
      'As soon as your dates are fixed. Peak wedding season fills first, and we take a limited number of weddings so that each one gets the same attention. Send us your date and we will tell you honestly whether it is still open.',
  },
  {
    id: 'faq-4',
    question: 'Can we customize the packages?',
    answer:
      'Every package is a starting point. Add or remove photographers, films, albums, events or days and we will rebuild the quote around what you actually need.',
  },
  {
    id: 'faq-5',
    question: 'Do you provide both candid and traditional photography?',
    answer:
      'Yes, and we recommend both. Candid coverage follows the emotion; traditional coverage guarantees the rituals, portraits and family photographs. They are different jobs, so they are done by different people working at the same time.',
  },
  {
    id: 'faq-6',
    question: 'Do you provide cinematic wedding films?',
    answer:
      'Yes — a cinematic highlight film with live audio from the vows and speeches, a short teaser for sharing, and a longer ceremony edit if you want the full rituals on film.',
  },
  {
    id: 'faq-7',
    question: 'Do you provide wedding albums?',
    answer:
      'Yes. Printed albums are included in the Signature and Luxury packages and can be added to any package. We design the layout, you approve it before anything goes to print.',
  },
  {
    id: 'faq-8',
    question: 'Do you provide drone coverage?',
    answer:
      'Where it is legally permitted and the venue allows it. Drone rules in India vary by location — some areas near airports and restricted zones do not permit flying at all. We check your venue before promising aerial coverage rather than after.',
  },
  {
    id: 'faq-9',
    question: 'How long does delivery take?',
    answer:
      'Timelines depend on the size of the wedding and are confirmed in writing when you book — a short social-media edit comes first, then the full edited gallery, then films and albums. We would rather commit to a date we can keep than quote a fast one we cannot.',
  },
  {
    id: 'faq-10',
    question: 'How can we check availability for our date?',
    answer:
      'Use the enquiry form below or message us on WhatsApp with your dates and city. Availability is the first thing we check and the first thing we come back to you about.',
  },
];

export const defaultInstagram: InstagramItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `ig-${i + 1}`,
  photo: photo(
    `ig-${i + 1}-img`,
    `Instagram grid slot ${i + 1} — pick a frame from the studio's own feed`,
    'square',
  ),
  permalink: null,
}));

export const defaultValues: ValueProp[] = [
  {
    id: 'val-1',
    title: 'Authentic Moments',
    body: 'We focus on genuine emotions rather than forced poses.',
    icon: 'heart',
  },
  {
    id: 'val-2',
    title: 'Cinematic Storytelling',
    body: 'Every wedding is treated as a story, not just a collection of photographs.',
    icon: 'film',
  },
  {
    id: 'val-3',
    title: 'Professional Team',
    body: 'Experienced photographers and cinematographers working together.',
    icon: 'team',
  },
  {
    id: 'val-4',
    title: 'Personalized Experience',
    body: 'Your package and coverage are designed around your celebration.',
    icon: 'compass',
  },
];

export const defaultProcess: ProcessStep[] = [
  {
    id: 'prc-1',
    number: '01',
    title: 'Tell Us Your Story',
    body: 'Share your wedding date, location and requirements.',
  },
  {
    id: 'prc-2',
    number: '02',
    title: 'Let’s Connect',
    body: 'We understand your vision and recommend the right coverage.',
  },
  {
    id: 'prc-3',
    number: '03',
    title: 'Choose Your Package',
    body: 'Select a package or create a custom one.',
  },
  {
    id: 'prc-4',
    number: '04',
    title: 'We Capture',
    body: 'Our team documents your celebration naturally and beautifully.',
  },
  {
    id: 'prc-5',
    number: '05',
    title: 'Relive It Forever',
    body: 'Receive your edited photographs, films and albums.',
  },
];

/** Event types offered in the enquiry form's dropdown. */
export const EVENT_TYPES = [
  'Wedding',
  'Pre-Wedding Shoot',
  'Engagement / Ring Ceremony',
  'Maternity',
  'Newborn / Baby',
  'Birthday',
  'Corporate / Brand Event',
  'Other',
];

/** Services a visitor can tick on the enquiry form. */
export const SERVICE_OPTIONS = [
  'Candid Photography',
  'Traditional Photography',
  'Cinematic Film',
  'Traditional Videography',
  'Pre-Wedding Shoot',
  'Drone Coverage',
  'Album',
  'Instagram Reels',
];

export const BUDGET_BANDS = [
  'Not decided yet',
  'Under ₹1 lakh',
  '₹1 – 2 lakh',
  '₹2 – 4 lakh',
  '₹4 – 8 lakh',
  'Above ₹8 lakh',
];
