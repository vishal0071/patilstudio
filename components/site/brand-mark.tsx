import Image from 'next/image';

export type BrandLogo = {
  src: string;
  alt: string;
  /** Rendered height in px; width follows the file's own proportions. */
  height: number;
};

/**
 * The studio's mark: an uploaded logo when there is one, the typeset wordmark otherwise.
 *
 * The fallback is the point. A site whose header is empty until someone produces a logo
 * file is unusable on day one, so the wordmark — the brand's first name in Cormorant over
 * "PHOTOGRAPHY" letterspaced in gold — is a real, finished piece of design rather than a
 * placeholder. Uploading a logo replaces it; deleting the setting brings it back.
 *
 * **Sizing.** Height is fixed and width is `auto`, so any proportion works without
 * distortion. `next/image` still needs width and height attributes, so it gets a generous
 * pair for the intrinsic hint while CSS controls the real size — the standard approach for
 * a logo of unknown proportion. `max-w-*` keeps an unusually wide file from pushing the
 * navigation links off the row.
 *
 * A logo must read on a DARK ground: the navigation sits over photographs and the footer
 * is near-black. That is documented on the setting itself.
 */
export function BrandMark({
  logo,
  brandName,
  className = '',
}: {
  logo: BrandLogo | null;
  brandName: string;
  className?: string;
}) {
  if (logo) {
    return (
      <Image
        src={logo.src}
        alt={logo.alt || brandName}
        // Intrinsic hint only; the height below and `w-auto` decide what is drawn.
        width={logo.height * 8}
        height={logo.height}
        style={{ height: `${logo.height}px` }}
        // Logos are flat art at a small size — the optimiser's lossy pass is where a
        // crisp wordmark goes muddy, and the file is a few KB either way.
        unoptimized
        priority
        className={`w-auto max-w-[11rem] object-contain object-left sm:max-w-[15rem] ${className}`}
      />
    );
  }

  return (
    <span className={`block font-serif ${className}`}>
      <span className="block text-[0.95rem] leading-none tracking-[0.16em] uppercase sm:text-[1.05rem]">
        {brandName.split(' ')[0]}
      </span>
      <span className="mt-1 block text-[0.5rem] leading-none tracking-[0.42em] text-gold uppercase">
        Photography
      </span>
    </span>
  );
}

/** Builds the prop from settings, so nav and footer cannot disagree about it. */
export function brandLogoFrom(settings: Record<string, string>): BrandLogo | null {
  const src = settings['brand.logoPath']?.trim();
  if (!src) return null;
  const parsed = Number(settings['brand.logoHeight']);
  return {
    src,
    alt: settings['brand.logoAlt']?.trim() || settings['brand.name'],
    // Clamped: a stray value here would otherwise size the header off the page.
    height: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 16), 96) : 36,
  };
}
