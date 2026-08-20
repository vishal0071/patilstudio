import Image from 'next/image';
import type { Photo } from '@/lib/content';
import { ApertureIcon } from './icons';

const RATIO_CLASS: Record<Photo['ratio'], string> = {
  landscape: 'aspect-[3/2]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  tall: 'aspect-[2/3]',
};

type FrameProps = {
  photo: Photo;
  /** Responsive `sizes` — required, because a wrong one is the single biggest
   *  image-payload mistake and a default here would hide it. */
  sizes: string;
  /** Only the hero should set this. Preloading anything below the fold competes with the LCP. */
  priority?: boolean;
  /** Override the photo's own aspect ratio (e.g. a hero that must fill the screen). */
  ratio?: Photo['ratio'] | 'fill';
  className?: string;
  imageClassName?: string;
  /** Zoom the photograph on hover of the nearest `.group` ancestor. */
  zoomOnHover?: boolean;
  /** Suppress the art-direction caption inside a placeholder (small tiles). */
  compact?: boolean;
  /**
   * Field reference (see lib/edit.ts) that makes this frame replaceable in place from
   * the live editor. Renders an inert data attribute plus a Replace control that stays
   * hidden until an admin turns edit mode on.
   */
  editField?: string;
  /**
   * Where the placeholder's marker sits. `top` is for frames that have page copy
   * overlaid on them — the hero and the film section — where a centred marker lands
   * underneath the headline and reads as a rendering fault.
   */
  plateAlign?: 'center' | 'top';
};

/**
 * A photograph slot.
 *
 * When `photo.src` is set this is a plain `next/image` with `fill`, so uploaded
 * files of any dimension crop predictably and Next serves AVIF/WebP at the right
 * width.
 *
 * When it is not set — the state this site ships in — it renders a deliberately
 * designed, clearly labelled placeholder instead. That is a product decision, not a
 * stub: the studio's own photographs are the only ones this site may display, so
 * until they are uploaded the honest thing to show is an empty frame that says so
 * and tells whoever is filling it what belongs there. Substituting stock photography
 * would misrepresent the studio's work.
 */
export function Frame({
  photo,
  sizes,
  priority = false,
  ratio,
  className = '',
  imageClassName = '',
  zoomOnHover = false,
  compact = false,
  plateAlign = 'center',
  editField,
}: FrameProps) {
  const shape = ratio === 'fill' ? '' : RATIO_CLASS[ratio ?? photo.ratio];
  const zoom = zoomOnHover
    ? 'transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]'
    : '';

  return (
    <div
      className={`relative overflow-hidden bg-charcoal ${shape} ${className}`}
      {...(editField ? { 'data-edit-image': editField } : {})}
    >
      {editField && (
        /* A <span>, not a <button>: this frame is frequently already inside a <button>
           (a portfolio tile) or an <a> (a service card), and nesting interactive elements
           is invalid HTML that fails hydration for EVERY visitor, not just an admin.
           Clicks are handled by a delegated capture-phase listener in live-editor.tsx,
           so no interactive element is needed — and it is aria-hidden because it does not
           exist for anyone who is not editing. */
        <span data-edit-replace="" aria-hidden="true">
          Replace
        </span>
      )}
      {photo.src ? (
        <Image
          src={photo.src}
          alt={photo.alt || photo.brief}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          quality={82}
          className={`object-cover ${zoom} ${imageClassName}`}
        />
      ) : (
        <PlaceholderPlate photo={photo} compact={compact} align={plateAlign} />
      )}
    </div>
  );
}

/**
 * The empty-slot plate. Gold-on-charcoal, film-grained, with the frame's art
 * direction as its caption — it should read as "this frame is reserved", never as a
 * broken image or a stand-in photograph.
 *
 * The gradient's origin is derived from the slot's id so a grid of placeholders has
 * some variation in it instead of nine identical rectangles.
 */
function PlaceholderPlate({
  photo,
  compact,
  align,
}: {
  photo: Photo;
  compact: boolean;
  align: 'center' | 'top';
}) {
  const seed = hash(photo.id);
  const x = 24 + (seed % 52);
  const y = 18 + ((seed >> 3) % 58);
  const tint = 6 + ((seed >> 6) % 6);

  return (
    <div
      className={`grain absolute inset-0 flex flex-col items-center gap-3 overflow-hidden px-5 text-center ${
        align === 'top' ? 'justify-start pt-24 sm:pt-28' : 'justify-center'
      }`}
      style={{
        background: `radial-gradient(120% 110% at ${x}% ${y}%, rgb(176 141 87 / 0.${String(tint).padStart(2, '0')}) 0%, #17171b 55%, #0f0f12 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-3 border border-gold/15" />
      <ApertureIcon className={compact ? 'h-5 w-5 text-gold/45' : 'h-7 w-7 text-gold/50'} />
      {!compact && (
        <p className="max-w-[24ch] text-[0.6875rem] leading-relaxed text-ivory/45">
          {photo.brief}
        </p>
      )}
      <span className="eyebrow text-[0.5rem] text-gold/55">Photograph placeholder</span>
    </div>
  );
}

/** djb2, trimmed. Only needs to be stable and cheap, not good. */
function hash(value: string): number {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) & 0xffffff;
  return h;
}
