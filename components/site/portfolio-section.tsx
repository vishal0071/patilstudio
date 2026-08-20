import Link from 'next/link';
import type { PortfolioItem, Settings } from '@/lib/content';
import { ArrowRightIcon } from '@/components/ui/icons';
import { editableSetting } from '@/lib/edit';
import { PortfolioGallery } from './portfolio-gallery';

/**
 * Home-page portfolio: the featured edit only, with the rest behind
 * /portfolio. A visitor who has to scroll past ninety photographs to reach the
 * packages section does not reach the packages section.
 */
export function PortfolioSection({
  items,
  settings,
  totalCount,
}: {
  items: PortfolioItem[];
  settings: Settings;
  totalCount: number;
}) {
  return (
    <section id="portfolio" className="section bg-ivory">
      <div className="shell">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p data-reveal="" className="eyebrow text-gold-dim">
              Portfolio
            </p>
            <h2
              data-reveal=""
              style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
              className="display-1 mt-5"
              {...editableSetting('portfolio.heading')}
            >
              {settings['portfolio.heading']}
            </h2>
            <p
              data-reveal=""
              style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
              className="lede mt-5 text-ink/60"
              {...editableSetting('portfolio.subheading', { multiline: true })}
            >
              {settings['portfolio.subheading']}
            </p>
          </div>

          {totalCount > items.length && (
            <Link href="/portfolio" data-reveal="" className="link-quiet shrink-0 text-ink">
              View Full Portfolio
              <ArrowRightIcon className="arrow h-3.5 w-3.5" />
            </Link>
          )}
        </header>

        <div className="mt-12">
          <PortfolioGallery items={items} />
        </div>

        <div className="mt-12 flex justify-center lg:hidden">
          <Link href="/portfolio" className="btn btn-outline-dark">
            View Full Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
