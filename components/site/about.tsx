import Link from 'next/link';
import type { Settings } from '@/lib/content';
import { paragraphs } from '@/lib/site';
import { Frame } from '@/components/ui/frame';
import { ArrowRightIcon } from '@/components/ui/icons';
import { editableSetting } from '@/lib/edit';

/**
 * Split-screen About. The photograph holds the left column on desktop and the copy
 * sits in a narrow measure on the right — long serif lines are unreadable past about
 * 60 characters, so the column is capped rather than filling the grid cell.
 */
export function About({ settings }: { settings: Settings }) {
  const photo = {
    id: 'about',
    src: settings['about.imagePath'].trim() || null,
    alt: settings['about.imageAlt'],
    brief: settings['about.imageBrief'],
    ratio: 'portrait' as const,
  };

  return (
    <section id="about" className="section bg-ivory">
      <div className="shell grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-20">
        <div data-reveal="" className="relative">
          <div data-reveal-image="" className="overflow-hidden">
            <Frame
              photo={photo}
              sizes="(max-width: 1024px) 92vw, 42vw"
              className="w-full"
              editField="settings:about.imagePath"
            />
          </div>
          {/* A thin gold rule offset behind the frame — the only ornament on the page. */}
          <div
            className="pointer-events-none absolute -right-4 -bottom-4 hidden h-32 w-32 border-r border-b border-gold/40 lg:block"
            aria-hidden="true"
          />
        </div>

        <div>
          <p data-reveal="" className="eyebrow text-gold-dim" {...editableSetting('about.eyebrow')}>
            {settings['about.eyebrow']}
          </p>

          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-6 max-w-[24ch]"
          >
            <span className="block" {...editableSetting('about.headline1')}>
              {settings['about.headline1']}
            </span>
            <span className="block text-gold-dim" {...editableSetting('about.headline2')}>
              {settings['about.headline2']}
            </span>
          </h2>

          <div
            data-reveal=""
            style={{ '--reveal-delay': '160ms' } as React.CSSProperties}
            className="mt-8 max-w-[56ch] space-y-5"
          >
            {/* Edited as one field: the paragraph split is derived from blank lines in
                the stored value, so exposing each rendered <p> separately would let the
                studio edit paragraph 2 and have it silently merge into paragraph 1. */}
            <div
              className="space-y-5"
              {...editableSetting('about.body', { multiline: true })}
            >
              {paragraphs(settings['about.body']).map((para) => (
                <p key={para.slice(0, 32)} className="lede text-ink/70">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div
            data-reveal=""
            style={{ '--reveal-delay': '240ms' } as React.CSSProperties}
            className="mt-10 border-l border-gold/30 pl-6"
          >
            <p className="font-serif text-lg" {...editableSetting('brand.photographerName')}>
              {settings['brand.photographerName']}
            </p>
            <p
              className="mt-1 text-[0.65rem] tracking-[0.22em] text-stone uppercase"
              {...editableSetting('brand.photographerRole')}
            >
              {settings['brand.photographerRole']}
            </p>
            <p
              className="body-copy mt-4 max-w-[52ch] text-ink/65"
              {...editableSetting('about.profile', { multiline: true })}
            >
              {settings['about.profile']}
            </p>
          </div>

          <Link
            href="/#contact"
            data-reveal=""
            style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
            className="link-quiet mt-9 text-ink"
          >
            <span {...editableSetting('about.cta')}>{settings['about.cta']}</span>
            <ArrowRightIcon className="arrow h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
