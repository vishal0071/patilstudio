import type { Metadata } from 'next';
import type { FaqItem, Service, Settings, Testimonial } from '@/lib/content';
import { isOn } from '@/lib/content';
import { siteBaseUrl } from '@/lib/site';

/**
 * Metadata and JSON-LD, both built from the CMS settings so the studio can change its
 * own title and description without a deploy.
 *
 * One rule runs through all of it: **no unverifiable claim is emitted.** No
 * `aggregateRating`, no `Review` node and no "best photographer in Pune" superlative
 * unless the underlying data is real. Placeholder testimonials are excluded from the
 * markup entirely — publishing them as `Review` objects would be feeding Google
 * fabricated ratings, which is both dishonest and, for the studio, a manual-action
 * risk it did not ask for.
 *
 * A second rule, added deliberately: **no price reaches a search engine.** `priceRange`
 * is omitted unless the studio types one in, and the package figures on the page carry
 * `data-nosnippet` so Google cannot lift them into a result. A wedding is quoted per
 * celebration; a rupee figure pulled out of a search snippet is read as a quote, and the
 * studio ends up answering for a number it never gave. Search still gets everything that
 * earns the ranking — the place, the services, the work — just not the money.
 */

export function buildMetadata(settings: Settings, page?: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const base = siteBaseUrl();
  const title = page?.title
    ? settings['seo.titleTemplate'].replace('%s', page.title)
    : settings['seo.title'];
  const description = page?.description ?? settings['seo.description'];
  const url = `${base}${page?.path ?? '/'}`;
  const ogImage = settings['seo.ogImagePath'].trim();
  const indexable = isOn(settings['seo.indexable']);
  const city = settings['brand.city'];
  const region = settings['brand.region'];
  const googleToken = settings['seo.googleSiteVerification'].trim();
  const bingToken = settings['seo.bingSiteVerification'].trim();

  // Geo meta tags. Minor signals on their own — the address and coordinates in the
  // LocalBusiness graph do the real work — but they are the pair of lines that state
  // "this site is about Pune" to every crawler that does not parse JSON-LD, and they
  // cost nothing.
  const geo: Record<string, string> = {
    'geo.region': `IN-${regionCode(region)}`,
    'geo.placename': city,
  };
  const lat = Number(settings['seo.geoLatitude']);
  const lon = Number(settings['seo.geoLongitude']);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    geo['geo.position'] = `${lat};${lon}`;
    geo.ICBM = `${lat}, ${lon}`;
  }

  return {
    title,
    description,
    keywords: settings['seo.keywords']
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    metadataBase: new URL(base),
    alternates: { canonical: url },
    authors: [{ name: settings['brand.photographerName'] }],
    creator: settings['brand.name'],
    publisher: settings['brand.name'],
    // Until the studio flips seo.indexable, a staging deploy will not be indexed.
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: settings['brand.name'],
      title,
      description,
      url,
      locale: 'en_IN',
      // Omitted rather than pointed at a placeholder: a broken OG image renders as an
      // empty grey card on WhatsApp, which is where most of these links get shared.
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    icons: { icon: '/icon.svg', apple: '/icon.svg' },
    category: 'Photography',
    // Search Console is how the sitemap gets submitted and how the studio sees which
    // Pune queries it actually ranks for, so the verification token is a setting rather
    // than a deploy.
    ...(googleToken || bingToken
      ? {
          verification: {
            ...(googleToken ? { google: googleToken } : {}),
            ...(bingToken ? { other: { 'msvalidate.01': bingToken } } : {}),
          },
        }
      : {}),
    other: geo,
  };
}

/**
 * ISO 3166-2 subdivision code for the states this studio plausibly works in, so
 * `geo.region` reads `IN-MH` rather than `IN-Maharashtra`.
 *
 * Unknown names fall back to the region as typed: a slightly wrong meta tag is a
 * non-event, and hard-coding all 36 subdivisions for a Pune wedding studio is not.
 */
function regionCode(region: string): string {
  const codes: Record<string, string> = {
    maharashtra: 'MH',
    goa: 'GA',
    karnataka: 'KA',
    gujarat: 'GJ',
    'madhya pradesh': 'MP',
    telangana: 'TG',
    rajasthan: 'RJ',
  };
  return codes[region.trim().toLowerCase()] ?? region.trim();
}

/**
 * The site's structured data as one `@graph`, which lets the nodes reference each
 * other by `@id` instead of repeating the business object in every block.
 */
export function buildJsonLd({
  settings,
  services,
  faqs,
  testimonials,
}: {
  settings: Settings;
  services: Service[];
  faqs: FaqItem[];
  testimonials: Testimonial[];
}) {
  const base = siteBaseUrl();
  const businessId = `${base}/#business`;
  const personId = `${base}/#photographer`;
  const ogImage = settings['seo.ogImagePath'].trim();

  const sameAs = [
    settings['social.instagram'],
    settings['social.facebook'],
    settings['social.youtube'],
  ]
    .map((url) => url.trim())
    .filter(Boolean);

  const latitude = Number(settings['seo.geoLatitude']);
  const longitude = Number(settings['seo.geoLongitude']);
  const radiusKm = Number(settings['seo.serviceRadiusKm']);
  // Omitted when blank. See the price note at the top of this file.
  const priceRange = settings['seo.priceRange'].trim();

  // Real, permissioned testimonials only. See the note at the top of this file.
  const realReviews = testimonials.filter((t) => !t.isPlaceholder);

  const graph: Record<string, unknown>[] = [
    {
      '@type': ['LocalBusiness', 'ProfessionalService'],
      '@id': businessId,
      name: settings['brand.name'],
      description: settings['seo.description'],
      url: `${base}/`,
      telephone: settings['contact.phone'],
      email: settings['contact.email'],
      ...(priceRange ? { priceRange } : {}),
      foundingDate: settings['seo.foundingYear'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings['contact.addressLine'],
        addressLocality: settings['brand.city'],
        addressRegion: settings['brand.region'],
        addressCountry: 'IN',
      },
      ...(Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { geo: { '@type': 'GeoCoordinates', latitude, longitude } }
        : {}),
      // The named places the studio lists, plus the circle it will actually travel
      // inside. The named list alone reads as a set of unrelated cities; the circle is
      // what says "this business serves Pune and everything within a morning's drive
      // of it", which is the claim a local-intent query is matched against.
      areaServed: [
        ...placeNames(settings['contact.serviceArea']).map((name) => ({
          '@type': 'Place',
          name,
        })),
        ...(Number.isFinite(latitude) && Number.isFinite(longitude) && radiusKm > 0
          ? [
              {
                '@type': 'GeoCircle',
                name: `Within ${radiusKm} km of ${settings['brand.city']}`,
                geoMidpoint: { '@type': 'GeoCoordinates', latitude, longitude },
                geoRadius: String(radiusKm * 1000),
              },
            ]
          : []),
      ],
      founder: { '@id': personId },
      employee: { '@id': personId },
      ...(sameAs.length ? { sameAs } : {}),
      ...(ogImage ? { image: ogImage } : {}),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Photography & Cinematography Services',
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.title,
            description: service.blurb,
            url: `${base}/services/${service.slug}`,
            provider: { '@id': businessId },
          },
        })),
      },
      ...(realReviews.length
        ? {
            review: realReviews.map((review) => ({
              '@type': 'Review',
              reviewBody: review.quote,
              author: { '@type': 'Person', name: review.clientName },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
                bestRating: 5,
              },
            })),
          }
        : {}),
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: settings['brand.photographerName'],
      jobTitle: 'Photographer',
      description: settings['about.profile'],
      worksFor: { '@id': businessId },
      knowsAbout: [
        'Wedding photography',
        'Wedding cinematography',
        'Candid photography',
        'Pre-wedding photography',
      ],
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: `${base}/`,
      name: settings['brand.name'],
      inLanguage: 'en-IN',
      publisher: { '@id': businessId },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${base}/#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Serialises structured data for embedding in a `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone is NOT safe inside a script element: a CMS value containing
 * `</script>` closes the element early and everything after it is parsed as HTML. Every
 * string in this graph comes from the admin panel, so that is a self-XSS an admin could
 * commit against every visitor to the site. Escaping `<` as `\u003c` is valid JSON, parses
 * identically, and cannot terminate the element. U+2028/U+2029 are escaped too — legal in
 * JSON, illegal as raw line terminators in a JavaScript string literal.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Place names out of the free-text service-area line.
 *
 * The line is written for humans — "Pune · Mumbai · Nashik · and destinations across
 * Maharashtra" — and splitting it naively publishes "and destinations across
 * Maharashtra" as a `Place`. Schema.org will accept that; it is simply a place that
 * does not exist, sitting in the studio's structured data next to four that do, which
 * is the kind of sloppiness that makes a local business's markup worth less than no
 * markup. So the trailing prose clause is dropped and the real names are kept.
 */
function placeNames(serviceArea: string): string[] {
  return serviceArea
    .split(/[·,]|\band\b/)
    .map((part) => part.trim().replace(/[.;]+$/, ''))
    .filter(Boolean)
    // A real place name here is one or two words ("Pune", "Navi Mumbai"). Anything
    // longer, or anything with a linking preposition in it, is the prose tail.
    .filter((part) => part.split(/\s+/).length <= 3)
    .filter((part) => !/\b(across|beyond|destinations?|elsewhere|more|others?)\b/i.test(part));
}

/**
 * The `Service` node for one service page.
 *
 * The home page already lists every service inside the business's `hasOfferCatalog`.
 * This adds the place: "Wedding Cinematography **in Pune**", tied to the same business
 * `@id` rather than re-declaring the studio, which is what makes /services/… eligible
 * for a city-qualified query instead of only the generic one.
 *
 * No `offers` block, deliberately — an `offers` node without a price is noise, and one
 * with a price is the thing this site does not publish.
 */
export function buildServiceJsonLd(settings: Settings, service: Service) {
  const base = siteBaseUrl();
  const city = settings['brand.city'];
  const region = settings['brand.region'];

  return {
    '@type': 'Service',
    '@id': `${base}/services/${service.slug}#service`,
    name: `${service.title} in ${city}`,
    serviceType: service.title,
    description: service.blurb,
    url: `${base}/services/${service.slug}`,
    provider: { '@id': `${base}/#business` },
    areaServed: [
      { '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: region } },
      { '@type': 'State', name: region },
    ],
    inLanguage: 'en-IN',
  };
}

/** Breadcrumbs for the inner pages. */
export function buildBreadcrumbs(trail: { name: string; path: string }[]) {
  const base = siteBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${base}${crumb.path}`,
    })),
  };
}
