import { getContent } from '@/lib/content';
import { hasSession } from '@/lib/admin/auth';
import { whatsappHref } from '@/lib/site';
import { RevealEngine } from '@/components/ui/reveal-engine';
import { TiltEngine } from '@/components/ui/tilt-engine';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { FloatingCta } from '@/components/site/floating-cta';
import { LiveEditorMount } from '@/components/site/live-editor-mount';


/**
 * Rendered per request, never prerendered at build.
 *
 * The content lives in Postgres, and the Docker build machine cannot reach it — a
 * build-time prerender would therefore bake the seed defaults into the HTML and the
 * first visitor after every deploy would see them. `getContent()` is cached by tag and
 * invalidated on save, so this costs one cached read per request, not ten queries.
 */
export const dynamic = 'force-dynamic';

/**
 * The chrome every public page shares.
 *
 * `getContent()` is wrapped in React's `cache()`, so this call and the ones in each
 * page body and `generateMetadata` collapse into a single database read per request.
 *
 * The year is read here and passed down rather than read inside the footer, so a
 * render never straddles midnight with two different years on the page.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, services } = await getContent();
  // Decides whether the on-page editor is served at all. A visitor gets none of its
  // JavaScript; the `data-edit` attributes in the markup are inert without it, and
  // /api/admin/inline re-checks the session on every write regardless.
  const isAdmin = await hasSession();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:bg-gold focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:text-ink focus:uppercase"
      >
        Skip to content
      </a>

      <SiteNav
        brandName={settings['brand.name']}
        whatsappUrl={whatsappHref(settings)}
        bookCta={settings['hero.primaryCta']}
      />

      <main id="main">{children}</main>

      <SiteFooter settings={settings} services={services} year={new Date().getFullYear()} />
      <FloatingCta settings={settings} />
      <RevealEngine />
      <TiltEngine />
      {isAdmin && <LiveEditorMount />}
    </>
  );
}
