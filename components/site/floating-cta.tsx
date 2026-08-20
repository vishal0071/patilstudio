import Link from 'next/link';
import type { Settings } from '@/lib/content';
import { whatsappHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/icons';

/**
 * The persistent conversion affordances.
 *
 * On mobile: a two-button bar pinned to the bottom, with `env(safe-area-inset-bottom)`
 * padding so it clears the iPhone home indicator rather than sitting under it.
 * On desktop: a single floating WhatsApp pill, bottom-right, which expands its label
 * on hover.
 *
 * Both are plain links, so this stays a server component — a floating CTA does not
 * need to ship JavaScript.
 */
export function FloatingCta({ settings }: { settings: Settings }) {
  const href = whatsappHref(settings);

  return (
    <>
      {/* Mobile bar */}
      <div
        className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-ivory/10 bg-ink/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[3.5rem] items-center justify-center gap-2 text-[0.65rem] tracking-[0.18em] text-ivory uppercase"
        >
          <WhatsAppIcon className="h-4 w-4 text-gold" />
          {settings['whatsapp.label']}
        </a>
        <Link
          href="/#contact"
          className="flex min-h-[3.5rem] items-center justify-center bg-gold text-[0.65rem] tracking-[0.18em] text-ink uppercase"
        >
          Enquire Now
        </Link>
      </div>

      {/* Desktop pill */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-print group fixed right-7 bottom-7 z-40 hidden items-center gap-3 bg-gold px-5 py-4 text-ink shadow-[0_18px_45px_-18px_rgb(10_10_11/0.55)] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-gold-soft lg:flex"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span className="max-w-0 overflow-hidden text-[0.65rem] tracking-[0.18em] whitespace-nowrap uppercase transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:max-w-[10rem]">
          {settings['whatsapp.label']}
        </span>
      </a>
    </>
  );
}
