import type { MetadataRoute } from 'next';
import { getContent, isOn } from '@/lib/content';
import { siteBaseUrl } from '@/lib/site';

/**
 * Robots policy.
 *
 * Gated on the `seo.indexable` setting so a staging deploy can be kept out of the
 * index from the admin panel, without a code change and without the classic accident
 * of shipping `noindex` to production.
 *
 * /admin and /api are disallowed either way — the admin panel is behind a password,
 * but there is no reason for it to be in a search index.
 */
// Reads CMS settings, so it must not be evaluated at build time against a database
// the build machine cannot reach.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getContent();
  const base = siteBaseUrl();

  if (!isOn(settings['seo.indexable'])) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
