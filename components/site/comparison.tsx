import type { ComparisonRow, Package } from '@/lib/content';
import { CheckIcon } from '@/components/ui/icons';

/**
 * Feature-by-feature comparison.
 *
 * Two renderings of the same data rather than one that scrolls sideways: a
 * four-column table at 375px is either unreadable or the source of the horizontal
 * page scroll this site is not allowed to have. Below `lg` each package becomes its
 * own card with the features as rows.
 *
 * Column headings come from the packages themselves, so renaming a package in the
 * admin panel does not leave the table disagreeing with the cards above it.
 */
export function Comparison({
  rows,
  packages,
}: {
  rows: ComparisonRow[];
  packages: Package[];
}) {
  if (rows.length === 0) return null;

  // The table's three value columns are fixed by the schema, so fall back to the
  // canonical names if a package has been renamed away or unpublished.
  const names = {
    essential: packages[0]?.name ?? 'Essential',
    signature: packages[1]?.name ?? 'Signature',
    luxury: packages[2]?.name ?? 'Luxury',
  };

  return (
    <section className="bg-ivory pb-[clamp(4.5rem,9vw,9rem)]">
      <div className="shell">
        <h3 data-reveal="" className="display-2 text-center">
          Compare Inclusions
        </h3>

        {/* Desktop */}
        <div data-reveal="" className="mt-10 hidden lg:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Feature comparison across the {names.essential}, {names.signature} and{' '}
              {names.luxury} packages
            </caption>
            <thead>
              <tr className="border-b border-ink/15">
                <th scope="col" className="py-4 pr-4 text-[0.65rem] tracking-[0.2em] uppercase">
                  Feature
                </th>
                {[names.essential, names.signature, names.luxury].map((name) => (
                  <th
                    key={name}
                    scope="col"
                    className="w-[18%] py-4 font-serif text-lg font-normal"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/8">
                  <th scope="row" className="py-4 pr-4 text-sm font-normal text-ink/80">
                    {row.feature}
                  </th>
                  <Cell value={row.essential} />
                  <Cell value={row.signature} />
                  <Cell value={row.luxury} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / tablet */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:hidden">
          {(['essential', 'signature', 'luxury'] as const).map((key) => (
            <article key={key} data-reveal="" className="border border-ink/12 bg-white/50 p-6">
              <h4 className="display-3">{names[key]}</h4>
              <dl className="mt-5 space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-baseline justify-between gap-4 border-b border-ink/8 pb-2.5 last:border-0"
                  >
                    <dt className="text-[0.8125rem] text-ink/60">{row.feature}</dt>
                    <dd className="text-right text-[0.8125rem] text-ink">
                      {row[key] === 'Yes' ? (
                        <CheckIcon className="ml-auto h-4 w-4 text-gold-dim" />
                      ) : (
                        row[key]
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ value }: { value: string }) {
  return (
    <td className="py-4 text-sm text-ink/70">
      {value === 'Yes' ? (
        <>
          <CheckIcon className="h-4 w-4 text-gold-dim" />
          <span className="sr-only">Included</span>
        </>
      ) : value === '—' ? (
        <>
          <span aria-hidden="true" className="text-ink/25">
            —
          </span>
          <span className="sr-only">Not included</span>
        </>
      ) : (
        value
      )}
    </td>
  );
}
