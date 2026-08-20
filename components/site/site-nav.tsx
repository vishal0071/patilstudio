'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV_LINKS } from '@/lib/site';
import { CloseIcon, WhatsAppIcon } from '@/components/ui/icons';
import { BrandMark, type BrandLogo } from './brand-mark';

type Props = {
  brandName: string;
  logo: BrandLogo | null;
  whatsappUrl: string;
  bookCta: string;
  /** Dark pages (the portfolio index, service pages) have no light hero to sit on. */
  alwaysSolid?: boolean;
};

/**
 * Sticky navigation: transparent over the hero, solid once the visitor leaves it.
 *
 * The threshold is 72vh rather than a fixed pixel count so it tracks the hero's
 * actual height on every screen — on a phone in landscape a `scrollY > 600` test
 * fires after the hero has already gone.
 */
export function SiteNav({ brandName, logo, whatsappUrl, bookCta, alwaysSolid = false }: Props) {
  const [solid, setSolid] = useState(alwaysSolid);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (alwaysSolid) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysSolid]);

  // A fixed-position menu over a scrollable body scrolls the page behind it on iOS.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`no-print fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
          solid
            ? 'border-b border-ivory/10 bg-ink/92 py-3 backdrop-blur-xl'
            : 'border-b border-transparent bg-gradient-to-b from-ink/55 to-transparent py-5'
        }`}
      >
        <nav className="shell flex items-center justify-between gap-6" aria-label="Primary">
          <Link
            href="/#top"
            aria-label={brandName}
            className="text-ivory transition-opacity hover:opacity-70"
            onClick={() => setMenuOpen(false)}
          >
            <BrandMark logo={logo} brandName={brandName} />
          </Link>

          <ul className="hidden items-center gap-8 xl:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="relative text-[0.7rem] tracking-[0.16em] text-ivory/75 uppercase transition-colors hover:text-ivory"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link href="/#contact" className="btn btn-gold hidden !min-h-0 !py-3 lg:inline-flex">
              {bookCta}
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="flex h-11 w-11 items-center justify-center border border-ivory/25 text-ivory transition-colors hover:border-ivory hover:bg-ivory/10 lg:hidden"
            >
              <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] text-ivory xl:hidden"
            >
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-3 bg-current" />
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen sheet rather than a dropdown: on a photography site the menu is
          the one moment the visitor is not looking at a photograph, so it may as well
          be calm and legible. */}
      <div
        /* `invisible` when closed, not just transparent: `visibility: hidden` takes the
           links out of the tab order, and a focusable link inside an `aria-hidden`
           container is exactly the mismatch screen readers cannot recover from. */
        className={`no-print fixed inset-0 z-[60] bg-ink transition-[opacity,visibility] duration-500 xl:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
      >
        <div className="shell flex h-full flex-col py-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-gold">Menu</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center text-ivory"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <ul className="mt-10 flex-1 overflow-y-auto">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href} className="border-b border-ivory/8">
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-4 py-4 font-serif text-3xl font-light text-ivory"
                >
                  <span className="numeral text-[0.6rem] tracking-widest text-gold/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-3">
            <Link
              href="/#contact"
              onClick={() => setMenuOpen(false)}
              className="btn btn-gold w-full"
            >
              {bookCta}
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light w-full"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
