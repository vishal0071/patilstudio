'use client';

import { useEffect, useState } from 'react';
import type { Film } from '@/lib/content';
import { videoEmbedUrl } from '@/lib/site';
import { editableSetting } from '@/lib/edit';
import { Frame } from '@/components/ui/frame';
import { CloseIcon, PlayIcon } from '@/components/ui/icons';

/**
 * The cinematic block: a poster that opens a player in a modal.
 *
 * Nothing about the video loads until the visitor asks for it — no iframe, no
 * preload, no player script. An embedded YouTube frame costs upwards of 700KB and
 * several third-party connections before anyone presses play, and on a page whose
 * whole job is showing photographs quickly that is the wrong trade.
 *
 * A film with no `videoRef` renders as a poster with an honest note rather than a
 * dead play button — the studio has to supply an authorized film first.
 */
/** Three strings, not the whole settings object — see the note on EnquiryFormCopy. */
export type FilmCopy = { heading1: string; heading2: string; cta: string };

export function FilmSection({ films, copy }: { films: Film[]; copy: FilmCopy }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (films.length === 0) return null;

  const [primary, ...rest] = films;
  const openFilm = films.find((film) => film.id === openId) ?? null;
  const primaryPlayable = Boolean(videoEmbedUrl(primary));

  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      <div className="absolute inset-0">
        <Frame
          photo={primary.poster}
          ratio="fill"
          sizes="100vw"
          className="h-full w-full"
          imageClassName="opacity-55"
          plateAlign="top"
          editField={`films:${primary.id}:imagePath`}
        />
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/55 to-ink/90"
        aria-hidden="true"
      />

      <div className="shell relative flex min-h-[80svh] flex-col items-center justify-center py-24 text-center">
        <p data-reveal="" className="eyebrow text-gold">
          Wedding Films
        </p>
        <h2
          data-reveal=""
          style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
          className="display-1 mt-5"
        >
          <span className="block" {...editableSetting('film.heading1')}>
            {copy.heading1}
          </span>
          <span className="block" {...editableSetting('film.heading2')}>
            {copy.heading2}
          </span>
        </h2>

        {primaryPlayable ? (
          <>
            <button
              type="button"
              onClick={() => setOpenId(primary.id)}
              data-reveal=""
              style={{ '--reveal-delay': '160ms' } as React.CSSProperties}
              className="group mt-12 flex flex-col items-center gap-5"
              aria-label={`Play ${primary.title}`}
            >
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-ivory/35 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105 group-hover:border-gold">
                <PlayIcon className="ml-1 h-6 w-6 text-ivory transition-colors group-hover:text-gold" />
                <span className="absolute inset-0 animate-ping rounded-full border border-gold/20 [animation-duration:3s]" />
              </span>
              <span className="text-[0.7rem] tracking-[0.24em] uppercase">{copy.cta}</span>
            </button>
            <p className="mt-5 font-serif text-lg text-ivory/60">{primary.title}</p>
          </>
        ) : (
          <div
            data-reveal=""
            className="mt-12 max-w-[46ch] border border-gold/25 px-6 py-5"
            style={{ '--reveal-delay': '160ms' } as React.CSSProperties}
          >
            <p className="text-[0.6875rem] leading-relaxed tracking-[0.06em] text-gold/80 uppercase">
              Film placeholder
            </p>
            <p className="body-copy mt-2 text-ivory/65">
              {primary.subtitle ||
                'Add an authorized wedding highlight film in the admin panel to enable the player here.'}
            </p>
          </div>
        )}

        {rest.length > 0 && (
          <ul className="mt-14 flex flex-wrap justify-center gap-4">
            {rest.map((film) => {
              const playable = Boolean(videoEmbedUrl(film));
              return (
                <li key={film.id}>
                  <button
                    type="button"
                    onClick={() => playable && setOpenId(film.id)}
                    disabled={!playable}
                    className="group w-40 text-left disabled:opacity-60"
                  >
                    <span className="relative block overflow-hidden">
                      <Frame
                        photo={film.poster}
                        ratio="landscape"
                        zoomOnHover
                        sizes="10rem"
                        compact
                      />
                      {playable && (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <PlayIcon className="h-5 w-5 text-ivory" />
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-[0.65rem] tracking-[0.14em] text-ivory/60 uppercase">
                      {film.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {openFilm && <VideoModal film={openFilm} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function VideoModal({ film, onClose }: { film: Film; onClose: () => void }) {
  const src = videoEmbedUrl(film);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-ink/97 p-4 backdrop-blur-sm sm:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center text-ivory/70 transition-colors hover:text-ivory sm:top-6 sm:right-6"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      <div className="animate-zoom-in w-full max-w-6xl">
        <div className="relative aspect-video w-full bg-black">
          {film.provider === 'MP4' ? (
            <video
              src={src}
              poster={film.poster.src ?? undefined}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          ) : (
            <iframe
              src={src}
              title={film.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
        <p className="mt-4 text-center text-[0.7rem] tracking-[0.18em] text-ivory/55 uppercase">
          {film.title}
        </p>
      </div>
    </div>
  );
}
