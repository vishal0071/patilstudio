import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { ActionForm, SubmitButton } from '@/components/admin/action-form';
import { deleteInquiry, setInquiryStatus } from '../actions';

const STATUSES = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLE: Record<Status, string> = {
  NEW: 'bg-gold/15 text-gold-dim',
  READ: 'bg-ink/8 text-ink/70',
  REPLIED: 'bg-green-600/12 text-green-800',
  ARCHIVED: 'bg-ink/5 text-stone',
};

type Search = { params: Promise<Record<string, string | undefined>> };

/**
 * The enquiry inbox.
 *
 * Newest first, archived hidden by default, and each row carries the tap-to-call,
 * mailto and WhatsApp links pre-addressed to that enquirer — the studio replies from a
 * phone, and making it retype a number is how an enquiry goes cold.
 *
 * Reads are capped at 200 rather than paginated. Past that the studio should be
 * exporting, not scrolling, and an unbounded `findMany` on a public write endpoint's
 * table is a slow-page-in-a-year problem waiting to happen.
 */
export default async function InquiriesPage({ searchParams }: { searchParams: Search['params'] }) {
  await requireAdmin();

  const params = await searchParams;
  const filter = STATUSES.includes(params.status as Status) ? (params.status as Status) : null;

  let inquiries: Awaited<ReturnType<typeof prisma.inquiry.findMany>> = [];
  let counts: Record<string, number> = {};
  let readError = false;

  try {
    const grouped = await prisma.inquiry.groupBy({ by: ['status'], _count: { _all: true } });
    counts = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]));
    inquiries = await prisma.inquiry.findMany({
      where: filter ? { status: filter } : { status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  } catch (error) {
    console.error('[admin] could not read enquiries', error);
    readError = true;
  }

  return (
    <div>
      <header>
        <h1 className="font-serif text-3xl font-light">Enquiries</h1>
        <p className="mt-2 text-[0.875rem] text-stone">
          Everything submitted through the site&apos;s form.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter enquiries">
        <FilterLink href="/admin/inquiries" active={!filter}>
          Open
        </FilterLink>
        {STATUSES.map((status) => (
          <FilterLink
            key={status}
            href={`/admin/inquiries?status=${status}`}
            active={filter === status}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
            {counts[status] ? ` (${counts[status]})` : ''}
          </FilterLink>
        ))}
      </nav>

      {readError ? (
        <p className="adm-card mt-8 border-red-300 p-5 text-[0.8125rem] text-red-700">
          Could not read enquiries from the database.
        </p>
      ) : inquiries.length === 0 ? (
        <p className="adm-card mt-8 p-6 text-[0.8125rem] text-stone">
          Nothing here yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <details className="adm-card group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`adm-chip ${STATUS_STYLE[inquiry.status as Status]}`}
                  >
                    {inquiry.status.toLowerCase()}
                  </span>
                  <span className="text-[0.875rem] font-medium">{inquiry.name}</span>
                  <span className="text-[0.75rem] text-stone">
                    {inquiry.eventType ?? 'No event type'}
                    {inquiry.eventDate ? ` · ${inquiry.eventDate}` : ''}
                  </span>
                  <span className="ml-auto text-[0.6875rem] text-stone">
                    {formatDate(inquiry.createdAt)}
                  </span>
                </summary>

                <div className="border-t border-ink/8 p-4 sm:p-5">
                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Detail label="Phone" value={inquiry.phone} href={inquiry.phone ? `tel:${inquiry.phone.replace(/[^\d+]/g, '')}` : null} />
                    <Detail label="Email" value={inquiry.email} href={`mailto:${inquiry.email}`} />
                    <Detail label="Location" value={inquiry.eventLocation} />
                    <Detail label="Number of events" value={inquiry.eventCount} />
                    <Detail label="Budget" value={inquiry.budget} />
                    <Detail
                      label="Services"
                      value={inquiry.services.length ? inquiry.services.join(', ') : null}
                    />
                    <Detail label="Source" value={inquiry.source} />
                  </dl>

                  <div className="mt-5">
                    <p className="text-[0.625rem] tracking-[0.16em] text-stone uppercase">
                      Message
                    </p>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed whitespace-pre-wrap">
                      {inquiry.message}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
                    {inquiry.phone && (
                      <a
                        href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-btn adm-btn-secondary"
                      >
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${inquiry.email}?subject=${encodeURIComponent('Re: your photography enquiry')}`}
                      className="adm-btn adm-btn-secondary"
                    >
                      Reply by email
                    </a>

                    {STATUSES.filter((status) => status !== inquiry.status).map((status) => (
                      <ActionForm
                        key={status}
                        action={setInquiryStatus}
                        hidden={{ id: inquiry.id, status }}
                        quiet
                      >
                        <SubmitButton variant="secondary" pendingLabel="…">
                          Mark {status.toLowerCase()}
                        </SubmitButton>
                      </ActionForm>
                    ))}

                    <ActionForm
                      action={deleteInquiry}
                      hidden={{ id: inquiry.id }}
                      className="ml-auto"
                      quiet
                    >
                      <SubmitButton
                        variant="danger"
                        pendingLabel="Deleting…"
                        confirm="Delete this enquiry permanently?"
                      >
                        Delete
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`adm-btn ${active ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
    >
      {children}
    </Link>
  );
}

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div>
      <dt className="text-[0.625rem] tracking-[0.16em] text-stone uppercase">{label}</dt>
      <dd className="mt-0.5 text-[0.8125rem] break-words">
        {value ? (
          href ? (
            <a href={href} className="underline decoration-ink/25 hover:decoration-ink">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-stone">—</span>
        )}
      </dd>
    </div>
  );
}

/** Fixed locale and timezone: the studio is in India, and the container is in UTC. */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}
