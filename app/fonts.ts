import localFont from 'next/font/local';

/**
 * Both faces are checked into the repo (`app/fonts/*.woff2`) and loaded with
 * `next/font/local` rather than `next/font/google`.
 *
 * Two reasons. The Docker build stays hermetic — the image builds on a machine with
 * no route to fonts.googleapis.com, which `next/font/google` would fail on. And the
 * baked Content-Security-Policy in next.config.ts declares `font-src 'self' data:`;
 * self-hosting means that stays true and no third-party font origin has to be
 * allowed.
 *
 * Both files are variable fonts covering their whole weight range, so the four
 * Cormorant weights the design uses cost one 37KB download, not four.
 *
 * Each face ships `latin` and `latin-ext`. The extended subset is not optional here:
 * the rupee sign (U+20B9) lives in it, and every price on the site starts with one — a
 * `₹` falling back to a system font next to Cormorant numerals is immediately visible.
 *
 * The cost of that choice: `next/font` skips emitting a `<link rel="preload">` when a
 * weight/style has more than one source file, because it cannot know which subset the
 * page will need. The faces are still self-hosted and discovered from the head
 * stylesheet, and both declare a metric-adjusted fallback below, so the swap does not
 * reflow. Dropping `latin-ext` would buy the preload back and break the prices; this is
 * the right side of that trade.
 */

export const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin.woff2', weight: '300 600', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-ext.woff2', weight: '300 600', style: 'normal' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
  // Cormorant is a small-x-height Garamond; the fallback needs adjusting or the
  // swap visibly reflows every heading on the page.
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  preload: true,
});

export const inter = localFont({
  src: [
    { path: './fonts/inter-latin.woff2', weight: '300 700', style: 'normal' },
    { path: './fonts/inter-latin-ext.woff2', weight: '300 700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'sans-serif',
  ],
  preload: true,
});
