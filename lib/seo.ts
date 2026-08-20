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
  };
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
      priceRange: settings['seo.priceRange'],
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
      areaServed: settings['contact.serviceArea']
        .split(/[·,]/)
        .map((area) => area.trim())
        .filter(Boolean)
        .map((name) => ({ '@type': 'Place', name })),
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
