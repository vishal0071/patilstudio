import Link from 'next/link';
import type { Package, Settings } from '@/lib/content';
import { whatsappHref } from '@/lib/site';
import { editableRow, editableSetting } from '@/lib/edit';
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from '@/components/ui/icons';

/**
 * Pricing.
 *
 * Every figure is whatever the studio typed into `priceLabel`, and while a package
 * is still flagged `pricePending` the card says so in as many words. Inventing a
 * plausible rupee number here would be the single most damaging thing this site
 * could do: a visitor treats a printed price as a quote, and the studio would be
 * answering for a number it never gave.
 *
 * Each CTA carries its package through to the enquiry form (`?package=…`) and into
 * the WhatsApp message, so the studio knows what is being asked about before it
 * replies.
 */
export function Packages({
  packages,
  settings,
}: {
  packages: Package[];
  settings: Settings;
}) {
  const anyPending = packages.some((p) => p.pricePending);

  return (
    <section id="packages" className="section bg-ivory">
      <div className="shell">
        <header className="mx-auto max-w-2xl text-center">
          <p data-reveal="" className="eyebrow text-gold-dim">
            Packages
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5"
            {...editableSetting('packages.heading')}
          >
            {settings['packages.heading']}
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
            className="lede mt-5 text-ink/60"
            {...editableSetting('packages.subheading', { multiline: true })}
          >
            {settings['packages.subheading']}
          </p>
        </header>

        <ul className="mt-14 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-7">
          {packages.map((pkg, i) => {
            const featured = Boolean(pkg.badge);
            return (
              <li
                key={pkg.id}
                data-reveal=""
                style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
                className={featured ? 'lg:-mt-6 lg:mb-6' : ''}
                data-tilt=""
              >
                <article
                  data-tilt-inner=""
                  className={`relative flex h-full flex-col p-8 sm:p-9 ${
                    featured
                      ? 'bg-ink text-ivory shadow-[0_30px_80px_-40px_rgb(10_10_11/0.6)]'
                      : 'border border-ink/12 bg-white/50'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-3 left-8 bg-gold px-3 py-1.5 text-[0.5625rem] tracking-[0.24em] text-ink uppercase">
                      {pkg.badge}
                    </span>
                  )}

                  {/* Name and price stand off the card face as it turns. */}
                  <div data-tilt-lift="">
                    <h3
                      className={`display-2 ${featured ? 'text-ivory' : ''}`}
                      {...editableRow('packages', pkg.id, 'name')}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`body-copy mt-3 min-h-[3.25rem] ${featured ? 'text-ivory/60' : 'text-ink/60'}`}
                      {...editableRow('packages', pkg.id, 'tagline', { multiline: true })}
                    >
                      {pkg.tagline}
                    </p>

                    <p
                      className={`numeral mt-6 text-2xl ${featured ? 'text-gold-soft' : 'text-gold-dim'}`}
                      {...editableRow('packages', pkg.id, 'priceLabel')}
                    >
                      {pkg.priceLabel}
                    </p>
                    {pkg.pricePending && (
                      <p
                        className={`mt-1.5 text-[0.625rem] tracking-[0.14em] uppercase ${featured ? 'text-ivory/40' : 'text-stone'}`}
                      >
                        Placeholder — not a quote
                      </p>
                    )}
                  </div>

                  <div
                    className={`mt-7 h-px w-full ${featured ? 'bg-ivory/12' : 'bg-ink/10'}`}
                    aria-hidden="true"
                  />

                  <ul className="mt-7 flex-1 space-y-3.5">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[0.875rem] leading-relaxed">
                        <CheckIcon
                          className={`mt-1 h-3.5 w-3.5 shrink-0 ${featured ? 'text-gold' : 'text-gold-dim'}`}
                        />
                        <span className={featured ? 'text-ivory/80' : 'text-ink/75'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9 grid gap-3">
                    <Link
                      href={`/?package=${encodeURIComponent(pkg.slug)}#contact`}
                      className={`btn w-full ${featured ? 'btn-gold' : 'btn-dark'}`}
                    >
                      {pkg.ctaLabel}
                    </Link>
                    <a
                      href={whatsappHref(settings, `${pkg.name} package`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 py-1 text-[0.65rem] tracking-[0.18em] uppercase transition-opacity hover:opacity-70 ${
                        featured ? 'text-ivory/55' : 'text-ink/50'
                      }`}
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      Ask on WhatsApp
                    </a>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {anyPending && (
          <p data-reveal="" className="mt-8 text-center text-[0.6875rem] text-stone">
            {settings['packages.pricingNote']}
          </p>
        )}

        {/* Custom-package prompt. Most weddings do not fit three columns, and saying so
            converts better than a fourth card would. */}
        <div
          data-reveal=""
          className="mt-16 flex flex-col items-center gap-6 border border-gold/25 bg-white/40 px-6 py-12 text-center sm:px-12"
        >
          <h3 className="display-2 max-w-[24ch]" {...editableSetting('packages.customHeading')}>
            {settings['packages.customHeading']}
          </h3>
          <p
            className="lede max-w-[52ch] text-ink/65"
            {...editableSetting('packages.customBody', { multiline: true })}
          >
            {settings['packages.customBody']}
          </p>
          <Link href="/?package=custom#contact" className="link-quiet text-ink">
            {settings['packages.customCta']}
            <ArrowRightIcon className="arrow h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
