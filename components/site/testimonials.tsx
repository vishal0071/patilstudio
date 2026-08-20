'use client';

import { useRef, useState } from 'react';
import type { Testimonial } from '@/lib/content';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@/components/ui/icons';
import { editableRow } from '@/lib/edit';

/**
 * Testimonial carousel.
 *
 * Built on a native scroll-snap track, so the swipe gesture, the momentum and the
 * keyboard all come from the browser; the arrows just call `scrollTo`. A JS-driven
 * transform carousel would have to reimplement all three and would still feel wrong
 * on a phone.
 *
 * Each card is `relative`, and that is load-bearing rather than decoration. Tailwind's
 * `.sr-only` is `position: absolute`, so with no positioned ancestor its containing block
 * is the INITIAL containing block: placed at its static position inside a card sitting
 * hundreds of pixels along this horizontal track, it escaped the track's clipping and
 * extended the document's scrollable width to 772px. A mobile browser answers that by
 * widening the LAYOUT viewport, `position: fixed` elements resolve against the widened
 * value, and so the header and the bottom CTA bar stretched to 772px on a 390px screen —
 * the page could be dragged sideways into blank white space. One screen-reader-only span,
 * and `scrollX` never moved the whole time.
 *
 * Any absolutely-positioned descendant inside a horizontal scroller needs an anchor.
 *
 * Placeholders carry a visible marker. Fabricated praise is the most corrosive thing
 * a studio site can publish, so the seed rows say what they are until real,
 * permissioned words replace them.
 */
export function Testimonials({
  testimonials,
  heading,
}: {
  testimonials: Testimonial[];
  heading: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  if (testimonials.length === 0) return null;

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, testimonials.length - 1));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    setActive(clamped);
  };

  // Derive the active dot from scroll position rather than tracking it only on
  // arrow clicks — otherwise a swipe leaves the indicator behind.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth || 1;
    setActive(Math.round(track.scrollLeft / width));
  };

  return (
    <section id="testimonials" className="section overflow-hidden bg-ink text-ivory">
      <div className="shell">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p data-reveal="" className="eyebrow text-gold">
              Testimonials
            </p>
            <h2
              data-reveal=""
              style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
              className="display-1 mt-5 max-w-[22ch]"
            >
              {heading}
            </h2>
          </div>

          {testimonials.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollToIndex(active - 1)}
                disabled={active === 0}
                aria-label="Previous testimonial"
                className="flex h-12 w-12 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(active + 1)}
                disabled={active >= testimonials.length - 1}
                aria-label="Next testimonial"
                className="flex h-12 w-12 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </header>
      </div>

      {/* A direct child of the <section>, padded with `pl-[var(--edge)]`, cards sized in
          viewport units — structure copied deliberately from the wedding-story track.

          This lived inside `.shell` with `w-full` cards, and that widened the page's
          LAYOUT viewport to 801px on a 390px screen. Nothing looked wrong: every box
          still measured 390. But `position: fixed` elements resolve against the initial
          containing block, so the header and the bottom CTA bar stretched to 801 and the
          visual viewport could be dragged sideways into blank white space.

          `overflow-x: clip` on html cannot fix that — a fixed element's containing block
          is the viewport, not the clipped ancestor. And it is invisible to `scrollX`,
          which stays 0 the whole time; the symptom only shows up in
          `visualViewport.offsetLeft`. */}
      <ul
        ref={trackRef}
        onScroll={onScroll}
        data-track-x=""
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-2 pl-[var(--edge)]"
      >
        {testimonials.map((item) => (
          <li
            key={item.id}
            className="w-[86vw] shrink-0 snap-start last:pr-[var(--edge)] sm:w-[46vw] lg:w-[31vw] xl:w-[26rem]"
          >
            <figure className="relative flex h-full flex-col border border-ivory/12 p-8">
              <div className="flex items-center gap-1 text-gold" aria-hidden="true">
                {Array.from({ length: Math.max(0, Math.min(5, item.rating)) }, (_, i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5" />
                ))}
              </div>
              <span className="sr-only">{item.rating} out of 5</span>

              <blockquote className="mt-6 flex-1">
                <p
                  className="font-serif text-xl leading-relaxed font-light text-ivory/85"
                  {...editableRow('testimonials', item.id, 'quote', { multiline: true })}
                >
                  {item.quote}
                </p>
              </blockquote>

              <figcaption className="mt-8 border-t border-ivory/10 pt-5">
                <span
                  className="block text-sm"
                  {...editableRow('testimonials', item.id, 'clientName')}
                >
                  {item.clientName}
                </span>
                <span
                  className="mt-1 block text-[0.65rem] tracking-[0.18em] text-ivory/45 uppercase"
                  {...editableRow('testimonials', item.id, 'eventLabel')}
                >
                  {item.eventLabel}
                </span>
                {item.isPlaceholder && (
                  <span className="mt-3 inline-block border border-gold/35 px-2 py-1 text-[0.5rem] tracking-[0.2em] text-gold/80 uppercase">
                    Placeholder — awaiting a real review
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {testimonials.length > 1 && (
        <div className="shell mt-6 flex justify-center gap-2 sm:hidden">
          {testimonials.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? 'w-6 bg-gold' : 'w-1.5 bg-ivory/25'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );

}
