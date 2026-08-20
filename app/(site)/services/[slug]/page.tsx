import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { buildBreadcrumbs, buildMetadata, jsonLdScript } from '@/lib/seo';
import { paragraphs, whatsappHref } from '@/lib/site';
import { Frame } from '@/components/ui/frame';
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from '@/components/ui/icons';

type Params = { params: Promise<{ slug: string }> };

/**
 * Service detail pages.
 *
 * These exist for search as much as for the visitor: "pre wedding photographer Pune"
 * lands on a page about pre-wedding photography rather than on a home-page anchor,
 * which is what actually ranks.
 *
 * No `generateStaticParams`: the slugs live in the CMS, so the set is not known at
 * build time and a service added later must resolve without a redeploy. The segment is
 * dynamic (see the (site) layout) and content is served from the tagged cache.
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { settings, services } = await getContent();
  const service = services.find((s) => s.slug === slug);
  if (!service) return buildMetadata(settings, { title: 'Service not found' });

  return buildMetadata(settings, {
    title: `${service.title} in ${settings['brand.city']}`,
    description: service.blurb,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const { settings, services, portfolio } = await getContent();
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== slug).slice(0, 3);
  // A small edit of related frames, so the page shows work and not only copy.
  const related = portfolio.slice(0, 4);

  const breadcrumbs = buildBreadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/#services' },
    { name: service.title, path: `/services/${service.slug}` },
  ]);

  return (
    <div className="bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
      />

      <header className="relative isolate min-h-[62svh] overflow-hidden bg-ink text-ivory">
        <div className="absolute inset-0">
          <Frame
            photo={service.photo}
            ratio="fill"
            sizes="100vw"
            className="h-full w-full"
            imageClassName="opacity-70"
            plateAlign="top"
          />
        </div>
        <div className="hero-scrim absolute inset-0" aria-hidden="true" />

        <div className="shell relative flex min-h-[62svh] flex-col justify-end pt-36 pb-16">
          <nav aria-label="Breadcrumb" className="text-[0.65rem] tracking-[0.2em] uppercase">
            <Link href="/" className="text-ivory/45 transition-colors hover:text-ivory">
              Home
            </Link>
            <span className="mx-2 text-ivory/25">/</span>
            <Link href="/#services" className="text-ivory/45 transition-colors hover:text-ivory">
              Services
            </Link>
          </nav>
          <h1 className="display-1 mt-6 max-w-[22ch]">{service.title}</h1>
          <p className="lede mt-5 max-w-[52ch] text-ivory/75">{service.blurb}</p>
        </div>
      </header>

      <section className="section">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          <div>
            <p data-reveal="" className="eyebrow text-gold-dim">
              How we approach it
            </p>
            <div data-reveal="" className="mt-7 space-y-6">
              {paragraphs(service.detail).map((para) => (
                <p key={para.slice(0, 32)} className="lede text-ink/70">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/?package=${encodeURIComponent(service.slug)}#contact`}
                className="btn btn-dark"
              >
                Enquire About {service.title.split(' ')[0]}
              </Link>
              <a
                href={whatsappHref(settings, service.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-dark"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <aside data-reveal="" className="border border-ink/12 bg-white/50 p-8">
            <h2 className="display-3">What&apos;s included</h2>
            <ul className="mt-6 space-y-4">
              {service.inclusions.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                  <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-dim" />
                  <span className="text-ink/75">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t border-ink/10 pt-5 text-[0.75rem] leading-relaxed text-stone">
              Inclusions are a starting point — every quote is built around your own
              celebration. Prices are confirmed in writing before you book.
            </p>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="pb-[clamp(4.5rem,9vw,9rem)]">
          <div className="shell">
            <h2 data-reveal="" className="display-2">
              Selected frames
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((item, i) => (
                <li
                  key={item.id}
                  data-reveal=""
                  style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
                >
                  <div data-reveal-image="" className="group overflow-hidden">
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

      {others.length > 0 && (
        <section className="bg-ink py-[clamp(4rem,8vw,7rem)] text-ivory">
          <div className="shell">
            <h2 data-reveal="" className="display-2">
              Also worth considering
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {others.map((other, i) => (
                <li
                  key={other.id}
                  data-reveal=""
                  style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}
                >
                  <Link href={`/services/${other.slug}`} className="group block">
                    <div className="overflow-hidden">
                      <Frame
                        photo={other.photo}
                        ratio="landscape"
                        zoomOnHover
                        sizes="(max-width: 640px) 88vw, 30vw"
                        compact
                      />
                    </div>
                    <h3 className="display-3 mt-5 transition-colors group-hover:text-gold-soft">
                      {other.title}
                    </h3>
                    <p className="body-copy mt-2 text-ivory/55">{other.blurb}</p>
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
