import type { Metadata } from 'next';
import Link from 'next/link';
import { getContent } from '@/lib/content';
import { buildBreadcrumbs, buildMetadata, jsonLdScript } from '@/lib/seo';
import { PortfolioGallery } from '@/components/site/portfolio-gallery';
import { ArrowRightIcon } from '@/components/ui/icons';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  return buildMetadata(settings, {
    title: 'Portfolio',
    description: `Wedding, pre-wedding, engagement, maternity and event photography by ${settings['brand.name']}, ${settings['brand.city']}.`,
    path: '/portfolio',
  });
}

/**
 * The full portfolio: every published photograph, filterable, on a dark ground so the
 * frames carry the page without competing with an ivory background.
 */
export default async function PortfolioPage() {
  const { settings, portfolio } = await getContent();
  const breadcrumbs = buildBreadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Portfolio', path: '/portfolio' },
  ]);

  return (
    <div className="bg-ink text-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
      />

      <header className="shell pt-36 pb-14 sm:pt-44">
        <nav aria-label="Breadcrumb" className="text-[0.65rem] tracking-[0.2em] uppercase">
          <Link href="/" className="text-ivory/45 transition-colors hover:text-ivory">
            Home
          </Link>
          <span className="mx-2 text-ivory/25">/</span>
          <span className="text-gold">Portfolio</span>
        </nav>

        <h1 className="display-1 mt-8 max-w-[20ch]">Every Story We&apos;ve Told</h1>
        <p className="lede mt-6 max-w-[52ch] text-ivory/60">
          The complete edit — weddings, pre-wedding sessions, engagements, portraits and
          celebrations. Filter by what you are planning.
        </p>
        <p className="mt-4 text-[0.6875rem] tracking-[0.14em] text-ivory/35 uppercase">
          {portfolio.length} {portfolio.length === 1 ? 'frame' : 'frames'}
        </p>
      </header>

      <div className="shell pb-24">
        <PortfolioGallery items={portfolio} tone="dark" />
      </div>

      <div className="shell border-t border-ivory/10 py-16 text-center">
        <h2 className="display-2 mx-auto max-w-[24ch]">
          Yours could be the next story here.
        </h2>
        <Link href="/#contact" className="btn btn-gold mt-8">
          {settings['hero.primaryCta']}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
