import type { Metadata } from 'next';
import Link from 'next/link';
import { hasSession } from '@/lib/admin/auth';
import { COLLECTIONS, COLLECTION_KEYS } from '@/lib/admin/collections';
import { logout } from './actions';

export const metadata: Metadata = {
  title: 'Studio admin',
  // Belt and braces alongside robots.ts — this must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 *
 * The sidebar renders only for a signed-in session, so /admin/login shares the layout
 * without advertising the navigation. Authorisation itself is not done here: every
 * page and every action calls `requireAdmin()` for itself, because a layout is not a
 * security boundary — Next may serve a nested page without re-running an ancestor
 * layout, and server actions never run one at all.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await hasSession();

  if (!signedIn) {
    return <div className="min-h-screen bg-ivory text-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ivory text-ink lg:flex">
      <aside className="border-b border-ink/10 bg-white lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="font-serif text-lg leading-none">Studio Admin</p>
            <p className="mt-1.5 text-[0.5625rem] tracking-[0.22em] text-gold-dim uppercase">
              Ganesh Patil Photography
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-[0.6875rem] text-stone hover:text-ink lg:hidden"
          >
            View site ↗
          </Link>
        </div>

        <nav className="px-3 pb-4 lg:pb-0" aria-label="Admin sections">
          <SidebarGroup title="Overview">
            <SidebarLink href="/admin">Dashboard</SidebarLink>
            <SidebarLink href="/admin/inquiries">Enquiries</SidebarLink>
            <li>
              <Link
                href="/"
                className="mt-1 flex items-center gap-2 rounded-sm bg-gold/12 px-2 py-2 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-gold/20"
              >
                <span aria-hidden="true" className="text-gold-dim">
                  ✎
                </span>
                Edit live page
              </Link>
            </li>
          </SidebarGroup>

          <SidebarGroup title="Content">
            <SidebarLink href="/admin/settings">Text & settings</SidebarLink>
            {COLLECTION_KEYS.map((key) => (
              <SidebarLink key={key} href={`/admin/collections/${key}`}>
                {COLLECTIONS[key].label}
              </SidebarLink>
            ))}
          </SidebarGroup>
        </nav>

        <div className="hidden border-t border-ink/10 p-3 lg:block">
          <Link
            href="/"
            target="_blank"
            className="adm-btn adm-btn-secondary mb-2 w-full justify-start"
          >
            View site ↗
          </Link>
          <form action={logout}>
            <button type="submit" className="adm-btn adm-btn-secondary w-full justify-start">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">{children}</div>
        <div className="border-t border-ink/10 px-5 py-6 lg:hidden">
          <form action={logout}>
            <button type="submit" className="adm-btn adm-btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="px-2 pb-2 text-[0.5625rem] tracking-[0.2em] text-stone uppercase">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-sm px-2 py-2 text-[0.8125rem] text-ink/75 transition-colors hover:bg-ivory-dim hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
