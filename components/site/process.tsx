import type { ProcessStep, Settings } from '@/lib/content';
import { editableSetting } from '@/lib/edit';

/**
 * The five steps, as a vertical timeline that becomes a horizontal one on desktop.
 *
 * The connecting rule is a pseudo-element on the list rather than a border on each
 * item, so it runs continuously behind the numbers instead of breaking at every gap.
 */
export function Process({ steps, settings }: { steps: ProcessStep[]; settings: Settings }) {
  return (
    <section className="section bg-ivory">
      <div className="shell">
        <header className="mx-auto max-w-2xl text-center">
          <p data-reveal="" className="eyebrow text-gold-dim">
            Our Process
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5"
            {...editableSetting('process.heading')}
          >
            {settings['process.heading']}
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
            className="lede mt-5 text-ink/60"
            {...editableSetting('process.subheading', { multiline: true })}
          >
            {settings['process.subheading']}
          </p>
        </header>

        <ol className="relative mt-16 grid gap-12 lg:grid-cols-5 lg:gap-6">
          <div
            className="absolute top-3 left-[0.6875rem] h-[calc(100%-1.5rem)] w-px bg-ink/12 lg:top-[0.6875rem] lg:left-0 lg:h-px lg:w-full"
            aria-hidden="true"
          />
          {steps.map((step, i) => (
            <li
              key={step.id}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 120}ms` } as React.CSSProperties}
              className="relative pl-12 lg:pl-0"
            >
              <span
                className="absolute top-1 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-gold/40 bg-ivory lg:top-0 lg:left-0"
                aria-hidden="true"
              >
                <span className="block h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              <div className="lg:pt-12">
                <span className="numeral text-sm text-gold-dim">{step.number}</span>
                <h3 className="display-3 mt-2">{step.title}</h3>
                <p className="body-copy mt-3 max-w-[32ch] text-ink/60">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
