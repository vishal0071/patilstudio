import type { Metadata } from 'next';
import Link from 'next/link';
import { getContent } from '@/lib/content';
import { buildBreadcrumbs, buildMetadata, jsonLdScript } from '@/lib/seo';
import { ArrowRightIcon } from '@/components/ui/icons';

/**
 * Hub for the location pages.
 *
 * Exists so the area pages are reachable by a crawler and by a person, rather than
 * floating in the sitemap with nothing linking to them — orphaned pages rank badly and
 * look like exactly the doorway set this is trying not to be.
 *
 * Renders nothing but a redirect-ish prompt while no area has real copy yet, which is
 * the state a fresh install is in.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { settings, areas } = await getContent();
  const metadata = buildMetadata(settings, {
    title: `Areas We Cover in ${settings['brand.region']}`,
    description: `Wedding photography across Pune and ${settings['brand.region']} — the localities and cities ${settings['brand.name']} works in.`,
    path: '/wedding-photographer',
  });
  // Empty, the hub is one line of admin instructions, which Google crawled and then
  // declined to index. Kept out of the index until an area goes live — the same moment
  // the sitemap starts listing it and the footer starts linking to it.
  return areas.length > 0 ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

export default async function AreasHubPage() {
  const { settings, areas } = await getContent();

  const grouped = {
    NEIGHBOURHOOD: areas.filter((a) => a.tier === 'NEIGHBOURHOOD'),
    CITY: areas.filter((a) => a.tier === 'CITY'),
    REGION: areas.filter((a) => a.tier === 'REGION'),
  };
  const headings: Record<keyof typeof grouped, string> = {
    NEIGHBOURHOOD: `In and around ${settings['brand.city']}`,
    CITY: `Across ${settings['brand.region']}`,
    REGION: 'Region-wide',
  };

  return (
    <div className="bg-ink text-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildBreadcrumbs([
              { name: 'Home', path: '/' },
              { name: 'Areas We Cover', path: '/wedding-photographer' },
            ]),
          ),
        }}
      />

      <header className="shell pt-36 pb-14 sm:pt-44">
        <nav aria-label="Breadcrumb" className="text-[0.65rem] tracking-[0.2em] uppercase">
          <Link href="/" className="text-ivory/45 transition-colors hover:text-ivory">
            Home
          </Link>
          <span className="mx-2 text-ivory/25">/</span>
          <span className="text-gold">Areas We Cover</span>
        </nav>
        <h1 className="display-1 mt-8 max-w-[24ch]">Where We Photograph</h1>
        <p className="lede mt-6 max-w-[54ch] text-ivory/60">
          {settings['contact.serviceArea']}
        </p>
      </header>

      <div className="shell pb-24">
        {areas.length === 0 ? (
          <p className="max-w-[62ch] border border-gold/25 px-6 py-5 text-[0.875rem] leading-relaxed text-ivory/65">
            No area pages are published yet. Add them under{' '}
            <span className="text-gold">Areas covered</span> in the admin panel — each one
            goes live once it says something real about photographing weddings there.
          </p>
        ) : (
          (Object.keys(grouped) as (keyof typeof grouped)[])
            .filter((tier) => grouped[tier].length > 0)
            .map((tier) => (
              <section key={tier} className="mb-14">
                <h2 data-reveal="" className="display-2">
                  {headings[tier]}
                </h2>
                <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[tier].map((area) => (
                    <li key={area.id} className="border-b border-ivory/10">
                      <Link
                        href={`/wedding-photographer/${area.slug}`}
                        className="link-quiet w-full justify-between py-3 text-ivory/75 hover:text-ivory"
                      >
                        {area.name}
                        <ArrowRightIcon className="arrow h-3.5 w-3.5 text-gold" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
        )}
      </div>
    </div>
  );
}
