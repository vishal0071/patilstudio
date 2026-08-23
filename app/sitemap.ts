import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { siteBaseUrl } from '@/lib/site';

/**
 * Sitemap: the home page, the portfolio index and one entry per published service.
 *
 * Home-page anchors (#about, #packages) are deliberately absent — a fragment is not
 * a separate URL, and listing them dilutes the one page that should rank.
 *
 * Location pages come from `getContent()`, which has already dropped any area whose copy
 * is too thin to be real writing. So a half-written draft is never submitted to Google —
 * the sitemap cannot get ahead of the content, which is what turns a set of location
 * pages into doorway spam.
 */
// Reads CMS settings, so it must not be evaluated at build time against a database
// the build machine cannot reach.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, areas } = await getContent();
  const base = siteBaseUrl();
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...services.map((service) => ({
      url: `${base}/services/${service.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Only listed once at least one area has real copy, so the hub is never an empty page
    // in the index.
    ...(areas.length > 0
      ? [
          {
            url: `${base}/wedding-photographer`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          },
        ]
      : []),
    ...areas.map((area) => ({
      url: `${base}/wedding-photographer/${area.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      // Below the service pages: these support the main keywords rather than competing
      // with them.
      priority: area.tier === 'NEIGHBOURHOOD' ? 0.6 : 0.65,
    })),
  ];
}
