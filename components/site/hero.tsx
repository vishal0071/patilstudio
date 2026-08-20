import Link from 'next/link';
import type { Settings } from '@/lib/content';
import { Frame } from '@/components/ui/frame';
import { editableSetting } from '@/lib/edit';

/**
 * Full-bleed opening frame.
 *
 * Three deliberate choices:
 *   - The headline is three short lines, staggered in. Anything longer competes with
 *     the photograph, which is the thing that actually sells the studio.
 *   - The photograph drifts (`ken-burns`) instead of sitting still. Slow enough —
 *     26 seconds across 10% of scale — that it reads as cinema rather than motion.
 *   - `100svh`, not `100vh`: on mobile Safari `100vh` includes the browser chrome, so
 *     the scroll hint sits under the address bar and the CTA can be pushed offscreen.
 */
export function Hero({ settings }: { settings: Settings }) {
  const heroPhoto = {
    id: 'hero',
    src: settings['hero.imagePath'].trim() || null,
    alt: settings['hero.imageAlt'],
    brief: settings['hero.imageBrief'],
    ratio: 'landscape' as const,
  };

  return (
    <section id="top" className="relative isolate h-[100svh] min-h-[36rem] w-full overflow-hidden">
      {/* `hero-plane` is driven by a scroll-timeline animation in globals.css — the
          image tips back and recedes as the section leaves, so the copy over it
          separates in depth rather than scrolling as one flat sheet. */}
      <div className="hero-plane absolute inset-0">
        <Frame
          photo={heroPhoto}
          ratio="fill"
          priority
          sizes="100vw"
          className="h-full w-full"
          imageClassName="animate-ken-burns"
          plateAlign="top"
          editField="settings:hero.imagePath"
        />
      </div>
      <div className="hero-scrim absolute inset-0" aria-hidden="true" />

      <div className="shell relative flex h-full flex-col justify-end pb-20 sm:pb-24">
        <p
          className="eyebrow animate-fade-up text-gold-onphoto"
          style={{ animationDelay: '160ms' }}
          {...editableSetting('hero.eyebrow')}
        >
          {settings['hero.eyebrow']}
        </p>

        <h1 className="display-hero mt-5 max-w-[22ch] text-ivory">
          {(['hero.line1', 'hero.line2', 'hero.line3'] as const)
            .filter((key) => settings[key])
            .map((key, i) => (
              <span
                key={key}
                className="animate-fade-up block"
                style={{ animationDelay: `${320 + i * 180}ms` }}
                {...editableSetting(key)}
              >
                {settings[key]}
              </span>
            ))}
        </h1>

        <p
          className="lede animate-fade-up mt-7 max-w-[46ch] text-ivory/80"
          style={{ animationDelay: '900ms' }}
          {...editableSetting('hero.subtitle', { multiline: true })}
        >
          {settings['hero.subtitle']}
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          style={{ animationDelay: '1060ms' }}
        >
          <Link href="/#contact" className="btn btn-gold">
            <span {...editableSetting('hero.primaryCta')}>{settings['hero.primaryCta']}</span>
          </Link>
          <Link href="/#portfolio" className="btn btn-outline-light">
            <span {...editableSetting('hero.secondaryCta')}>
              {settings['hero.secondaryCta']}
            </span>
          </Link>
        </div>
      </div>

      {/* Decorative, and hidden on short screens where it would crowd the CTAs. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center sm:flex"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[0.5rem] tracking-[0.4em] text-ivory/45 uppercase">Scroll</span>
          <span className="relative block h-10 w-px bg-ivory/20">
            <span className="animate-scroll-hint absolute inset-x-0 top-0 block h-4 w-px bg-gold" />
          </span>
        </div>
      </div>
    </section>
  );
}
