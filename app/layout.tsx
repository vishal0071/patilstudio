import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { cormorant, inter } from './fonts';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  return buildMetadata(settings);
}

/**
 * Root layout: the document shell and the fonts, nothing else.
 *
 * The marketing chrome (navigation, footer, floating CTAs) lives in the `(site)`
 * route group instead, because /admin shares this document but must not inherit a
 * "Book Your Date" bar over its forms.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        {/* Scroll-reveal hides its targets in CSS and RevealEngine un-hides them. If
            JavaScript is off or fails to load, this makes the whole page visible
            rather than leaving a visitor looking at empty sections. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal-image] > *{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
