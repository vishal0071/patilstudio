import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { siteBaseUrl } from '@/lib/site';

/**
 * Sitemap: the home page, the portfolio index and one entry per published service.
 *
 * Home-page anchors (#about, #packages) are deliberately absent — a fragment is not
 * a separate URL, and listing them dilutes the one page that should rank.
 */
// Reads CMS settings, so it must not be evaluated at build time against a database
// the build machine cannot reach.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services } = await getContent();
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
  ];
}
