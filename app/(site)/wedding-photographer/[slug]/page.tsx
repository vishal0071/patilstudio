import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { buildBreadcrumbs, buildMetadata, jsonLdScript } from '@/lib/seo';
import { paragraphs, siteBaseUrl, whatsappHref } from '@/lib/site';
import { Frame } from '@/components/ui/frame';
import { ArrowRightIcon, CheckIcon, PinIcon, WhatsAppIcon } from '@/components/ui/icons';

type Params = { params: Promise<{ slug: string }> };

/**
 * One location page — /wedding-photographer/katraj and the like.
 *
 * `getContent()` has already dropped any area whose copy is too thin to be real writing,
 * so an unfinished draft 404s here rather than going live as a near-duplicate of its
 * neighbours. That is the whole defence against this becoming a doorway-page set, and it
 * is enforced in the data layer rather than trusted to whoever is editing.
 *
 * The studio's own words carry the page. Everything this file adds around them — the
 * venue list, the breadcrumb, the enquiry prompt — is framing.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { settings, areas } = await getContent();
  const area = areas.find((a) => a.slug === slug);
  if (!area) return buildMetadata(settings, { title: 'Area not found' });

  const where = area.parent ? `${area.name}, ${area.parent}` : area.name;
  return buildMetadata(settings, {
    title: area.seoTitle || `Wedding Photographer in ${where}`,
    description:
      area.seoDescription ||
      `${settings['brand.name']} photographs weddings in ${where}. ${area.intro.slice(0, 150).trim()}…`,
    path: `/wedding-photographer/${area.slug}`,
  });
}

export default async function AreaPage({ params }: Params) {
  const { slug } = await params;
  const { settings, areas, portfolio } = await getContent();
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const where = area.parent ? `${area.name}, ${area.parent}` : area.name;
  const nearby = areas.filter((a) => a.slug !== area.slug && a.parent === area.parent).slice(0, 8);
  const frames = portfolio.filter((p) => p.src).slice(0, 4);
  const base = siteBaseUrl();

  return (
    <div className="bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            '@context': 'https://schema.org',
            '@graph': [
              buildBreadcrumbs([
                { name: 'Home', path: '/' },
                { name: 'Areas We Cover', path: '/wedding-photographer' },
                { name: area.name, path: `/wedding-photographer/${area.slug}` },
              ]),
              {
                // A Service scoped to this place, pointing back at the one LocalBusiness
                // declared on the home page rather than re-declaring the business here —
                // duplicate LocalBusiness nodes per location are a classic local-SEO
                // mistake and read as separate premises that do not exist.
                '@type': 'Service',
                name: `Wedding Photography in ${where}`,
                serviceType: 'Wedding photography and cinematography',
                provider: { '@id': `${base}/#business` },
                areaServed: {
                  '@type': area.tier === 'NEIGHBOURHOOD' ? 'Place' : 'City',
                  name: area.name,
                  ...(area.parent
                    ? { containedInPlace: { '@type': 'Place', name: area.parent } }
                    : {}),
                },
                url: `${base}/wedding-photographer/${area.slug}`,
              },
            ],
          }),
        }}
      />

      <header className="relative isolate min-h-[56svh] overflow-hidden bg-ink text-ivory">
        <div className="absolute inset-0">
          <Frame
            photo={area.photo}
            ratio="fill"
            sizes="100vw"
            priority
            className="h-full w-full"
            imageClassName="opacity-70"
            plateAlign="top"
            editField={`areas:${area.id}:imagePath`}
          />
        </div>
        <div className="hero-scrim absolute inset-0" aria-hidden="true" />

        <div className="shell relative flex min-h-[56svh] flex-col justify-end pt-36 pb-14">
          <nav aria-label="Breadcrumb" className="text-[0.65rem] tracking-[0.2em] uppercase">
            <Link href="/" className="text-ivory/45 transition-colors hover:text-ivory">
              Home
            </Link>
            <span className="mx-2 text-ivory/25">/</span>
            <Link
              href="/wedding-photographer"
              className="text-ivory/45 transition-colors hover:text-ivory"
            >
              Areas
            </Link>
          </nav>
          <p className="eyebrow mt-6 flex items-center gap-2 text-gold-onphoto">
            <PinIcon className="h-3.5 w-3.5" />
            {area.parent ?? settings['brand.region']}
          </p>
          <h1 className="display-1 mt-4 max-w-[24ch]">Wedding Photographer in {area.name}</h1>
        </div>
      </header>

      <section className="section">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <div>
            <div data-reveal="" className="space-y-6">
              {paragraphs(area.intro).map((para) => (
                <p key={para.slice(0, 32)} className="lede text-ink/70">
                  {para}
                </p>
              ))}
              {paragraphs(area.notes).map((para) => (
                <p key={para.slice(0, 32)} className="body-copy text-ink/65">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/?package=custom#contact" className="btn btn-dark">
                Check Our Availability
              </Link>
              <a
                href={whatsappHref(settings, `Wedding photography in ${where}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-dark"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {area.venues.length > 0 && (
            <aside data-reveal="" className="border border-ink/12 bg-white/50 p-8">
              <h2 className="display-3">Venues we&apos;ve worked at</h2>
              <ul className="mt-6 space-y-4">
                {area.venues.map((venue) => (
                  <li key={venue} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-dim" />
                    <span className="text-ink/75">{venue}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-ink/10 pt-5 text-[0.75rem] leading-relaxed text-stone">
                Somewhere else in {area.parent ?? settings['brand.region']}? We travel — tell
                us the venue and we&apos;ll tell you honestly whether we know it.
              </p>
            </aside>
          )}
        </div>
      </section>

      {frames.length > 0 && (
        <section className="pb-[clamp(4.5rem,9vw,9rem)]">
          <div className="shell">
            <h2 data-reveal="" className="display-2">
              From our recent work
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {frames.map((item, i) => (
                <li
                  key={item.id}
                  data-reveal=""
                  style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
                >
                  <div className="group overflow-hidden">
                    <Frame
                      photo={item}
                      ratio="portrait"
                      zoomOnHover
                      sizes="(max-width: 1024px) 46vw, 23vw"
                      compact
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/portfolio" className="link-quiet mt-8 text-ink">
              View Full Portfolio
              <ArrowRightIcon className="arrow h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section className="bg-ink py-[clamp(4rem,8vw,7rem)] text-ivory">
          <div className="shell">
            <h2 data-reveal="" className="display-2">
              Also covering
            </h2>
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {nearby.map((other) => (
                <li key={other.id} className="border-b border-ivory/10">
                  <Link
                    href={`/wedding-photographer/${other.slug}`}
                    className="link-quiet w-full justify-between py-3 text-ivory/70 hover:text-ivory"
                  >
                    {other.name}
                    <ArrowRightIcon className="arrow h-3.5 w-3.5 text-gold" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
