import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { COLLECTIONS, COLLECTION_KEYS, delegateFor } from '@/lib/admin/collections';
import { isOn, settingDefaults, type SettingKey } from '@/lib/content/settings';
import { SeedEverythingButton } from '@/components/admin/seed-everything';

/**
 * Dashboard, built around a launch checklist rather than a wall of counters.
 *
 * The site ships full of clearly-marked placeholders — empty photograph frames,
 * '₹XX,XXX' prices, flagged testimonials, an unset phone number. That is the honest
 * default, but it is only defensible if the person who has to replace them can see, on
 * one screen, exactly what is still outstanding. This page is that list.
 *
 * Counts come straight from Postgres, not from `getContent()`: that helper falls back
 * to the seed defaults for an empty table, which is right for the public site and
 * exactly wrong here — an empty Portfolio table would otherwise report eighteen
 * photographs.
 */
export default async function AdminDashboard() {
  await requireAdmin();

  const state = await readState();

  if (!state) {
    return (
      <div className="adm-card border-red-300 p-6">
        <h1 className="font-serif text-2xl">Cannot reach the database</h1>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-stone">
          The panel is up but Postgres is not answering, so nothing can be read or
          saved. The public site is still serving — it falls back to its built-in
          defaults when the database is unavailable. Check{' '}
          <code className="bg-ivory-dim px-1">DATABASE_URL</code> and the container logs.
        </p>
      </div>
    );
  }

  const { counts, settings, inquiries, photoStats, pendingPrices, placeholderTestimonials, playableFilms } =
    state;

  const checklist = [
    {
      done: photoStats.withImage > 0,
      label: `Upload the studio's own photographs (${photoStats.withImage} of ${photoStats.total} portfolio frames have one)`,
      href: '/admin/collections/portfolio',
      note: 'Every empty frame renders a marked placeholder on the site. Nothing else is shown in its place.',
    },
    {
      done: Boolean(settings['hero.imagePath']),
      label: 'Set the hero photograph',
      href: '/admin/settings',
      note: 'The first full screen a visitor sees.',
    },
    {
      done: Boolean(settings['about.imagePath']),
      label: 'Set the About portrait',
      href: '/admin/settings',
    },
    {
      done: isOn(settings['contact.detailsConfirmed']),
      label: 'Confirm the real phone, WhatsApp number and email',
      href: '/admin/settings',
      note: 'Until this is confirmed the contact section shows a placeholder warning.',
    },
    {
      done: pendingPrices === 0,
      label: `Publish real package prices (${pendingPrices} still marked as placeholders)`,
      href: '/admin/collections/packages',
      note: 'Cards say “Placeholder — not a quote” while the flag is on.',
    },
    {
      done: placeholderTestimonials === 0 && counts.testimonials > 0,
      label:
        counts.testimonials === 0
          ? 'Add real client testimonials'
          : `Replace placeholder testimonials (${placeholderTestimonials} remaining)`,
      href: '/admin/collections/testimonials',
      note: 'Placeholders are labelled on the page and excluded from search-engine review markup.',
    },
    {
      done: isOn(settings['stats.confirmed']),
      label: 'Confirm the statistics are accurate',
      href: '/admin/settings',
      note: 'They are shown with a “to be confirmed” note until you flip stats.confirmed.',
    },
    {
      done: playableFilms > 0,
      label: 'Add an authorized wedding film',
      href: '/admin/collections/films',
      note: 'Without one the cinematic section shows a poster and no player.',
    },
    {
      done: Boolean(settings['seo.ogImagePath']),
      label: 'Set the social sharing image',
      href: '/admin/settings',
      note: 'This is what appears when a link is shared on WhatsApp.',
    },
    {
      done: isOn(settings['seo.indexable']),
      label: 'Allow search engines to index the site',
      href: '/admin/settings',
      note: 'Leave off until launch. While off, robots.txt disallows everything.',
    },
  ];

  const outstanding = checklist.filter((item) => !item.done).length;

  return (
    <div>
      <header>
        <h1 className="font-serif text-3xl font-light">Dashboard</h1>
        <p className="mt-2 text-[0.875rem] text-stone">
          Everything on the public site is editable from here.
        </p>
      </header>

      <Link
        href="/"
        className="adm-card mt-8 flex flex-wrap items-center gap-4 border-gold/40 bg-gold/[0.06] p-5 transition-colors hover:border-gold"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-[1.05rem] text-ink"
        >
          ✎
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-medium">Edit the live page</span>
          <span className="mt-1 block text-[0.75rem] leading-relaxed text-stone">
            Open the site and press <strong className="font-medium">Edit page</strong> in the
            Studio toolbar (bottom left). Click any heading or paragraph to change it, and
            hover a photograph for Replace. Publishing, prices, ordering and SEO stay here.
          </span>
        </span>
        <span className="text-[0.75rem] whitespace-nowrap text-gold-dim">Open site →</span>
      </Link>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Enquiries" value={inquiries.total} href="/admin/inquiries" />
        <Stat label="New / unread" value={inquiries.unread} href="/admin/inquiries" accent />
        <Stat label="Portfolio frames" value={counts.portfolio} href="/admin/collections/portfolio" />
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">Before launch</h2>
          <span className="text-[0.75rem] text-stone">
            {outstanding === 0 ? 'All clear' : `${outstanding} outstanding`}
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="adm-card p-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.5rem] ${
                    item.done
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gold/60 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className={`text-[0.875rem] hover:underline ${item.done ? 'text-stone line-through decoration-stone/40' : 'font-medium'}`}
                  >
                    {item.label}
                  </Link>
                  {item.note && !item.done && (
                    <p className="mt-1 text-[0.6875rem] leading-relaxed text-stone">{item.note}</p>
                  )}
                </div>
                <span className="sr-only">{item.done ? 'Done' : 'Outstanding'}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl">Content</h2>
        <p className="mt-1.5 text-[0.75rem] text-stone">
          An empty collection falls back to the built-in starter content on the public
          site. Open one and choose “Load starter content” to turn it into editable rows.
        </p>
        {Object.values(counts).every((count) => count === 0) && (
          <div className="mt-4">
            <SeedEverythingButton />
          </div>
        )}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {COLLECTION_KEYS.map((key) => (
            <li key={key}>
              <Link
                href={`/admin/collections/${key}`}
                className="adm-card flex items-center justify-between p-4 transition-colors hover:border-ink/25"
              >
                <span className="text-[0.875rem]">{COLLECTIONS[key].label}</span>
                <span className="text-[0.75rem] text-stone">
                  {counts[key] === 0 ? 'using defaults' : `${counts[key]} rows`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  accent = false,
}: {
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="adm-card block p-5 transition-colors hover:border-ink/25">
      <span
        className={`numeral block text-3xl leading-none ${accent && value > 0 ? 'text-gold-dim' : ''}`}
      >
        {value}
      </span>
      <span className="mt-2 block text-[0.6875rem] tracking-[0.14em] text-stone uppercase">
        {label}
      </span>
    </Link>
  );
}

async function readState() {
  try {
    const [settingRows, inquiryTotal, inquiryUnread, portfolioRows, packageRows, testimonialRows, filmRows] =
      await Promise.all([
        prisma.siteSetting.findMany(),
        prisma.inquiry.count(),
        prisma.inquiry.count({ where: { status: 'NEW' } }),
        prisma.portfolioImage.findMany({ select: { imagePath: true } }),
        prisma.package.findMany({ select: { pricePending: true } }),
        prisma.testimonial.findMany({ select: { isPlaceholder: true } }),
        prisma.film.findMany({ select: { videoRef: true } }),
      ]);

    const countEntries = await Promise.all(
      COLLECTION_KEYS.map(async (key) => [key, await delegateFor(key).count()] as const),
    );

    const settings = { ...settingDefaults } as Record<SettingKey, string>;
    for (const row of settingRows) {
      if (row.key in settings) settings[row.key as SettingKey] = row.value;
    }

    return {
      counts: Object.fromEntries(countEntries) as Record<(typeof COLLECTION_KEYS)[number], number>,
      settings,
      inquiries: { total: inquiryTotal, unread: inquiryUnread },
      photoStats: {
        total: portfolioRows.length,
        withImage: portfolioRows.filter((row) => (row.imagePath ?? '').trim().length > 0).length,
      },
      pendingPrices: packageRows.filter((row) => row.pricePending).length,
      placeholderTestimonials: testimonialRows.filter((row) => row.isPlaceholder).length,
      playableFilms: filmRows.filter((row) => row.videoRef.trim().length > 0).length,
    };
  } catch (error) {
    console.error('[admin] dashboard could not read state', error);
    return null;
  }
}
