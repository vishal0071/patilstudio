/**
 * The site's key/value settings: one flat, dotted-key namespace.
 *
 * Why flat rather than a `SiteSettings` table with a column per field: the studio
 * owner will want to change wording nobody anticipated, and a flat KV means that is
 * a new line here plus a migration-free DB row, not an ALTER TABLE. The defaults
 * below are also the *documentation* for what each key does — the admin form is
 * generated from `SETTING_GROUPS`, so a key added here appears in the panel.
 *
 * Values are always strings. Booleans are the literal 'true'/'false'; read them
 * through `isOn()`.
 */

export const settingDefaults = {
  // ── Brand ──────────────────────────────────────────────────────
  'brand.name': 'Ganesh Patil Photography',
  'brand.shortName': 'Ganesh Patil',
  'brand.tagline': 'Capturing emotions. Creating memories. Telling stories.',
  'brand.photographerName': 'Ganesh Patil',
  'brand.photographerRole': 'Founder & Lead Photographer',
  'brand.city': 'Pune',
  'brand.region': 'Maharashtra',
  'brand.country': 'India',

  // ── Contact ────────────────────────────────────────────────────
  // Placeholders on purpose. Fill these in before launch; the footer and the
  // enquiry confirmation both surface them, and a wrong number is worse than none.
  'contact.phone': '+91 00000 00000',
  'contact.whatsapp': '910000000000',
  'contact.email': 'hello@ganeshpatilphotography.in',
  'contact.addressLine': 'Pune, Maharashtra, India',
  'contact.serviceArea': 'Pune · Mumbai · Nashik · Kolhapur · and destinations across India',
  'contact.hours': 'Mon – Sat, 10:00 – 19:00 IST',
  'contact.detailsConfirmed': 'false',

  // ── WhatsApp CTA ───────────────────────────────────────────────
  'whatsapp.label': 'Chat With Us',
  'whatsapp.message':
    "Hi Ganesh Patil Photography, I'm interested in your photography services. I'd like to check availability and package details.",

  // ── Social ─────────────────────────────────────────────────────
  'social.instagram': 'https://www.instagram.com/ganesh_patil_photography/',
  'social.instagramHandle': '@ganesh_patil_photography',
  'social.facebook': '',
  'social.youtube': '',

  // ── Hero ───────────────────────────────────────────────────────
  'hero.line1': 'Your Moments.',
  'hero.line2': 'Your Story.',
  'hero.line3': 'Forever.',
  'hero.subtitle':
    'Cinematic wedding photography & films crafted to preserve the emotions, people and moments that matter most.',
  'hero.primaryCta': 'Book Your Date',
  'hero.secondaryCta': 'Explore Our Work',
  'hero.eyebrow': 'Wedding Photography & Cinematography',
  'hero.imagePath': '',
  'hero.imageAlt': 'A couple at their wedding, photographed by Ganesh Patil Photography',
  'hero.imageBrief': 'Hero frame — your single strongest wedding or couple photograph, landscape, room for text at the lower left',

  // ── Stats ──────────────────────────────────────────────────────
  // NOT presented as fact until 'stats.confirmed' is 'true'; until then the
  // section carries a visible "figures to be confirmed" note.
  'stats.confirmed': 'false',
  'stats.1.value': '500+',
  'stats.1.label': 'Moments Captured',
  'stats.2.value': '100+',
  'stats.2.label': 'Happy Couples',
  'stats.3.value': '8+',
  'stats.3.label': 'Years of Experience',
  'stats.4.value': '50+',
  'stats.4.label': 'Locations Covered',
  'stats.statement': "Trusted to capture the moments you'll remember forever.",

  // ── About ──────────────────────────────────────────────────────
  'about.eyebrow': 'About The Studio',
  'about.headline1': "We Don't Just Take Pictures.",
  'about.headline2': 'We Tell Your Story.',
  'about.body':
    'Every wedding has its own rhythm — the nervous smiles, the laughter, the tears, the chaos and the quiet moments in between.\n\nOur approach is to capture those moments naturally and transform them into photographs and films that bring you back to the feeling of that day.',
  'about.profile':
    'Ganesh Patil has spent his career photographing weddings across Maharashtra and beyond, working quietly at the edge of the celebration rather than at its centre. He leads a small team of photographers and cinematographers who shoot candid and traditional coverage side by side, so no ritual and no unguarded glance goes undocumented.',
  'about.cta': 'Meet Ganesh Patil',
  'about.imagePath': '',
  'about.imageAlt': 'Ganesh Patil photographing a wedding',
  'about.imageBrief': 'Portrait or behind-the-scenes frame of Ganesh at work — vertical, 4:5',

  // ── Section headings ───────────────────────────────────────────
  'services.heading': 'What We Capture',
  'services.subheading':
    'From the first celebration to the final frame, we preserve every chapter of your story.',
  'portfolio.heading': "Stories We've Captured",
  'portfolio.subheading':
    'A short edit from recent weddings, celebrations and portrait sessions.',
  'story.heading': 'From Chaos to Celebration',
  'story.subheading': 'One wedding day, in six frames.',
  'packages.heading': 'Choose Your Experience',
  'packages.subheading': 'Simple packages. Transparent inclusions. Completely customizable.',
  'packages.customHeading': 'Need something different?',
  'packages.customBody':
    "Every celebration is different. Tell us what you're planning and we'll create a package around your requirements.",
  'packages.customCta': 'Create My Custom Package',
  'packages.pricingNote':
    'Prices are placeholders until the studio publishes its rates — set them in the admin panel.',
  'values.heading': 'Why Couples Choose Us',
  'process.heading': 'How It Works',
  'process.subheading': 'Five steps from first message to final album.',
  'testimonials.heading': 'Kind Words From Our Couples',
  'instagram.heading': 'Follow The Stories',
  'instagram.subheading': 'More moments. More stories. More behind the scenes.',
  'film.heading1': 'Press Play.',
  'film.heading2': 'Relive The Moment.',
  'film.cta': 'Watch Our Films',
  'faq.heading': 'Questions, Answered',
  'contact.heading': "Let's Capture Your Story",
  'contact.subheading':
    "Tell us about your celebration and let's create something unforgettable.",
  'contact.submitLabel': 'Check My Date',
  'contact.successTitle': 'Your enquiry is with us.',
  'contact.successBody':
    "Thank you — we've received your details and will reply within one working day. If your date is close, message us on WhatsApp and we'll answer faster.",

  // ── SEO ────────────────────────────────────────────────────────
  'seo.title': 'Ganesh Patil Photography — Wedding Photographer in Pune',
  'seo.titleTemplate': '%s — Ganesh Patil Photography',
  'seo.description':
    'Ganesh Patil Photography is a wedding photography and cinematography studio in Pune, Maharashtra. Candid and traditional wedding photography, pre-wedding shoots, cinematic wedding films, engagement, maternity and baby portraits.',
  'seo.keywords':
    'Ganesh Patil Photography, wedding photographer Pune, wedding photography Pune, pre wedding photographer Pune, candid wedding photography Pune, wedding videography Pune, cinematic wedding photographer Pune, photography studio Pune',
  'seo.ogImagePath': '',
  'seo.priceRange': '₹₹',
  'seo.foundingYear': '2017',
  'seo.geoLatitude': '18.5204',
  'seo.geoLongitude': '73.8567',
  // OFF by default, deliberately. A fresh deploy has no photographs, placeholder prices
  // and placeholder testimonials; letting Google index that is worse than not being
  // indexed for a few days, and cached placeholder pages are slow to shift. The dashboard
  // checklist prompts for this as the last item before launch.
  'seo.indexable': 'false',

  // ── Footer ─────────────────────────────────────────────────────
  'footer.blurb':
    'A wedding photography and cinematography studio based in Pune, documenting celebrations across Maharashtra and beyond.',
  'footer.copyrightHolder': 'Ganesh Patil Photography',
  'footer.credit': '',
} as const;

export type SettingKey = keyof typeof settingDefaults;

/** Every key resolved to a string — DB value where present, default otherwise. */
export type Settings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(settingDefaults) as SettingKey[];

export function isOn(value: string | undefined): boolean {
  return value === 'true';
}

/** Long-form keys get a textarea in the admin panel instead of an input. */
export const MULTILINE_SETTING_KEYS = new Set<SettingKey>([
  'brand.tagline',
  'whatsapp.message',
  'hero.subtitle',
  'hero.imageBrief',
  'about.body',
  'about.profile',
  'about.imageBrief',
  'services.subheading',
  'portfolio.subheading',
  'packages.subheading',
  'packages.customBody',
  'packages.pricingNote',
  'process.subheading',
  'instagram.subheading',
  'contact.subheading',
  'contact.successBody',
  'contact.serviceArea',
  'seo.description',
  'seo.keywords',
  'footer.blurb',
  'stats.statement',
]);

/**
 * How the admin panel groups the keys above. Prefix-matched in order, so a key is
 * claimed by the first group whose prefix it starts with; anything unmatched lands
 * in "Other" rather than disappearing from the form.
 */
export const SETTING_GROUPS: { title: string; note: string; prefixes: string[] }[] = [
  {
    title: 'Brand',
    note: 'Studio name, tagline and the photographer’s own details.',
    prefixes: ['brand.'],
  },
  {
    title: 'Contact & WhatsApp',
    note: 'Shown in the footer, the enquiry section and the floating WhatsApp button. Set contact.detailsConfirmed to true once these are real.',
    prefixes: ['contact.phone', 'contact.whatsapp', 'contact.email', 'contact.address', 'contact.serviceArea', 'contact.hours', 'contact.detailsConfirmed', 'whatsapp.'],
  },
  { title: 'Social links', note: 'Leave a URL empty to hide that icon.', prefixes: ['social.'] },
  { title: 'Hero', note: 'The first full screen. hero.imagePath accepts a /media/… path or an https URL.', prefixes: ['hero.'] },
  {
    title: 'Statistics',
    note: 'Displayed with a “to be confirmed” note until stats.confirmed is true.',
    prefixes: ['stats.'],
  },
  { title: 'About', note: 'Blank lines in about.body become paragraph breaks.', prefixes: ['about.'] },
  {
    title: 'Section headings',
    note: 'Wording for every section title and subtitle on the home page.',
    prefixes: [
      'services.',
      'portfolio.',
      'story.',
      'packages.',
      'values.',
      'process.',
      'testimonials.',
      'instagram.',
      'film.',
      'faq.',
      'contact.',
    ],
  },
  { title: 'SEO', note: 'Titles, description, structured data and indexing.', prefixes: ['seo.'] },
  { title: 'Footer', note: '', prefixes: ['footer.'] },
];
