import type { Film, Settings } from '@/lib/content';

/** Primary navigation. Anchors are on-page; `/portfolio` is a real route. */
export const NAV_LINKS = [
  { label: 'Home', href: '/#top' },
  { label: 'About', href: '/#about' },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: '/#portfolio' },
  { label: 'Packages', href: '/#packages' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Instagram', href: '/#instagram' },
  { label: 'Contact', href: '/#contact' },
] as const;

/**
 * A wa.me link with the studio's prefilled enquiry message.
 *
 * `context` appends where the visitor clicked from ("Luxury package", "Wedding
 * Photography"), which is the difference between a lead the studio has to qualify
 * over three messages and one it can answer immediately.
 */
export function whatsappHref(settings: Settings, context?: string): string {
  const digits = settings['contact.whatsapp'].replace(/\D/g, '');
  const message = context
    ? `${settings['whatsapp.message']}\n\n(Enquiring about: ${context})`
    : settings['whatsapp.message'];
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telHref(settings: Settings): string {
  return `tel:${settings['contact.phone'].replace(/[^\d+]/g, '')}`;
}

export function mailHref(settings: Settings, subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${settings['contact.email']}${query}`;
}

/**
 * Turns whatever the studio pasted into an embeddable URL.
 *
 * Admins paste watch URLs, share URLs and bare ids interchangeably, so accept all
 * three rather than making the field's format a support question. Returns null for
 * an unset film — the section then shows its poster and no player.
 *
 * Note the CSP: embedding YouTube or Vimeo needs those origins in `frame-src`, which
 * is baked at build time in next.config.ts. Self-hosted MP4 needs no exception.
 */
export function videoEmbedUrl(film: Film): string | null {
  const ref = film.videoRef.trim();
  if (!ref) return null;

  if (film.provider === 'MP4') return ref;

  if (film.provider === 'YOUTUBE') {
    const id = youTubeId(ref);
    return id
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : null;
  }

  const vimeoId = ref.match(/(?:vimeo\.com\/(?:video\/)?)?(\d{6,})/)?.[1];
  return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0` : null;
}

function youTubeId(ref: string): string | null {
  if (/^[\w-]{11}$/.test(ref)) return ref;
  return (
    ref.match(/[?&]v=([\w-]{11})/)?.[1] ??
    ref.match(/youtu\.be\/([\w-]{11})/)?.[1] ??
    ref.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ??
    null
  );
}

/** Blank-line-separated prose → paragraphs. Used by the About and service copy. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function siteBaseUrl(): string {
  return (process.env.SITE_BASE_URL ?? 'https://patilstudio.in').replace(/\/$/, '');
}
