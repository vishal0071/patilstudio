'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABELS, type PortfolioCategory, type PortfolioItem } from '@/lib/content';
import { Frame } from '@/components/ui/frame';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/icons';

type Props = {
  items: PortfolioItem[];
  /** Dropped into the light section on the home page, dark on /portfolio. */
  tone?: 'light' | 'dark';
};

const FILTER_ALL = 'ALL' as const;
type Filter = typeof FILTER_ALL | PortfolioCategory;

/**
 * Filterable masonry gallery with a lightbox.
 *
 * Masonry via CSS `columns` rather than a JS layout pass: it costs no JavaScript and
 * never reflows on image load. The trade-off is that reading order runs down each
 * column instead of across rows, which for an unordered photographic edit is
 * invisible to the visitor and is why the technique is worth it here and would not be
 * for, say, a list of search results.
 *
 * Only categories that actually have photographs get a filter chip. A gallery
 * offering "Maternity" and then showing nothing looks broken.
 */
export function PortfolioGallery({ items, tone = 'light' }: Props) {
  const [filter, setFilter] = useState<Filter>(FILTER_ALL);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const available = useMemo(() => {
    const present = new Set(items.map((item) => item.category));
    return (Object.keys(CATEGORY_LABELS) as PortfolioCategory[]).filter((c) => present.has(c));
  }, [items]);

  const visible = useMemo(
    () => (filter === FILTER_ALL ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  );

  // Filtering while the lightbox is open would leave it pointing at the wrong photo.
  const changeFilter = (next: Filter) => {
    setOpenIndex(null);
    setFilter(next);
  };

  const dark = tone === 'dark';

  return (
    <>
      <div
        className={`flex flex-wrap gap-x-6 gap-y-3 ${dark ? 'text-ivory/55' : 'text-ink/50'}`}
        role="group"
        aria-label="Filter portfolio by category"
      >
        {[FILTER_ALL, ...available].map((option) => {
          const active = filter === option;
          const label = option === FILTER_ALL ? 'All' : CATEGORY_LABELS[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => changeFilter(option)}
              aria-pressed={active}
              className={`relative py-1 text-[0.7rem] tracking-[0.18em] uppercase transition-colors ${
                active
                  ? dark
                    ? 'text-gold-soft'
                    : 'text-gold-dim'
                  : dark
                    ? 'hover:text-ivory'
                    : 'hover:text-ink'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                  active ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* `key` on the filter forces a fresh mount so the reveal animation replays for
          the new set — without it, filtered-in photographs appear instantly and the
          section loses its rhythm. */}
      <div
        key={filter}
        className="mt-10 columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 lg:gap-6"
      >
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            data-reveal=""
            style={{ '--reveal-delay': `${Math.min(index, 8) * 70}ms` } as React.CSSProperties}
            className="group mb-4 block w-full break-inside-avoid text-left sm:mb-5 lg:mb-6"
            aria-label={`Open photograph: ${item.alt || item.brief}`}
            data-tilt=""
          >
            <div data-tilt-inner="" className="relative overflow-hidden">
              <Frame
                photo={item}
                zoomOnHover
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                compact
                editField={`portfolio:${item.id}:imagePath`}
              />
              <span
                className="card-scrim pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                aria-hidden="true"
              />
              <span className="pointer-events-none absolute bottom-4 left-4 translate-y-2 text-[0.6rem] tracking-[0.24em] text-ivory uppercase opacity-0 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
                {CATEGORY_LABELS[item.category]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && visible[openIndex] && (
        <Lightbox
          items={visible}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: PortfolioItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      // Wraps, so the visitor at the last photograph is not dead-ended.
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus in, so Escape and the arrow keys work without a click first and a
    // screen reader lands inside the dialog rather than behind it.
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, step]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex flex-col bg-ink/97 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        // 48px, so a vertical scroll with a little horizontal drift does not page.
        if (Math.abs(end - start) > 48) step(end < start ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="eyebrow text-gold">{CATEGORY_LABELS[item.category]}</span>
        <div className="flex items-center gap-5">
          <span className="numeral text-xs text-ivory/50">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="flex h-11 w-11 items-center justify-center text-ivory/70 transition-colors hover:text-ivory"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous photograph"
          className="absolute left-1 z-10 flex h-12 w-12 items-center justify-center text-ivory/55 transition-colors hover:text-ivory sm:left-4"
        >
          <ChevronLeftIcon className="h-7 w-7" />
        </button>

        {/* Re-keyed on the item so each photograph fades in rather than swapping. */}
        <div
          key={item.id}
          className="animate-zoom-in relative flex h-full max-h-full w-full items-center justify-center"
        >
          <div className="relative max-h-full w-full max-w-5xl">
            <Frame
              photo={item}
              sizes="(max-width: 1024px) 96vw, 72vw"
              className="max-h-[68svh] !bg-transparent"
              imageClassName="!object-contain"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next photograph"
          className="absolute right-1 z-10 flex h-12 w-12 items-center justify-center text-ivory/55 transition-colors hover:text-ivory sm:right-4"
        >
          <ChevronRightIcon className="h-7 w-7" />
        </button>
      </div>

      <div className="min-h-[4.5rem] px-5 py-5 text-center sm:px-8">
        {item.story ? (
          <p className="mx-auto max-w-[52ch] font-serif text-lg font-light text-ivory/80">
            {item.story}
          </p>
        ) : (
          <p className="text-xs text-ivory/40">{item.alt || item.brief}</p>
        )}
      </div>
    </div>
  );
}
