import type { Settings, StoryChapter } from '@/lib/content';
import { Frame } from '@/components/ui/frame';
import { editableRow, editableSetting } from '@/lib/edit';

/**
 * One wedding, told across six frames in a horizontal track.
 *
 * Native scroll-snap rather than a scroll-hijacked pinned section: hijacking the
 * wheel to drive a horizontal timeline breaks trackpad momentum, keyboard scrolling
 * and every screen reader, and on a phone it fights the browser's own gesture
 * handling. A snap track gets the same "scrolling through a film" feel, is swipeable
 * by default, and costs no JavaScript.
 *
 * The last panel is `pr-[var(--edge)]` wide so the track ends flush with the page
 * gutter instead of clipping the final photograph against the viewport edge.
 */
export function WeddingStory({
  chapters,
  settings,
}: {
  chapters: StoryChapter[];
  settings: Settings;
}) {
  if (chapters.length === 0) return null;

  return (
    <section className="section overflow-hidden bg-ink text-ivory">
      <div className="shell">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p data-reveal="" className="eyebrow text-gold">
              A Wedding Story
            </p>
            <h2
              data-reveal=""
              style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
              className="display-1 mt-5 max-w-[20ch]"
              {...editableSetting('story.heading')}
            >
              {settings['story.heading']}
            </h2>
          </div>
          <p data-reveal="" className="lede max-w-[34ch] text-ivory/55">
            <span {...editableSetting('story.subheading', { multiline: true })}>
              {settings['story.subheading']}
            </span>
            <span className="mt-2 block text-[0.65rem] tracking-[0.22em] text-gold/60 uppercase">
              Swipe to continue →
            </span>
          </p>
        </header>
      </div>

      <ol className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-4 pl-[var(--edge)] sm:gap-8">
        {chapters.map((chapter, i) => (
          <li
            key={chapter.id}
            data-reveal=""
            style={{ '--reveal-delay': `${Math.min(i, 3) * 100}ms` } as React.CSSProperties}
            className="w-[78vw] shrink-0 snap-start last:pr-[var(--edge)] sm:w-[46vw] lg:w-[31vw] xl:w-[26rem]"
          >
            {/* The coverflow turn lives on this inner element, not the <li>: the <li>
                carries data-reveal, and an animation and a transition competing for
                `transform` on one element means the animation wins and the reveal
                never runs. */}
            <div className="story-panel">
              <div data-reveal-image="" className="overflow-hidden">
                <Frame
                  photo={chapter.photo}
                  ratio="portrait"
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 26rem"
                  compact
                  editField={`story:${chapter.id}:imagePath`}
                />
              </div>
              <div className="mt-6 flex items-baseline gap-4">
                <span className="numeral text-sm text-gold">{chapter.number}</span>
                <h3 className="display-3" {...editableRow('story', chapter.id, 'title')}>
                  {chapter.title}
                </h3>
              </div>
              <p
                className="body-copy mt-3 max-w-[38ch] text-ivory/60"
                {...editableRow('story', chapter.id, 'body', { multiline: true })}
              >
                {chapter.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
