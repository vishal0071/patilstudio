import type { Settings, ValueProp } from '@/lib/content';
import { VALUE_ICONS } from '@/components/ui/icons';
import { editableSetting } from '@/lib/edit';

/** Four short reasons, on the darkest panel of the page so it reads as a statement. */
export function Values({ values, settings }: { values: ValueProp[]; settings: Settings }) {
  return (
    <section className="section relative overflow-hidden bg-ink-soft text-ivory">
      {/* A single warm wash behind the grid — no photograph, because this section sits
          between two image-heavy ones and needs to breathe. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(80% 60% at 15% 0%, rgb(176 141 87 / 0.14) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="shell relative">
        <header className="max-w-2xl">
          <p data-reveal="" className="eyebrow text-gold">
            Why Us
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5"
            {...editableSetting('values.heading')}
          >
            {settings['values.heading']}
          </h2>
        </header>

        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => {
            const Icon = VALUE_ICONS[value.icon];
            return (
              <li
                key={value.id}
                data-reveal=""
                style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}
                className="border-t border-ivory/12 pt-7"
              >
                <Icon className="h-7 w-7 text-gold" />
                <h3 className="display-3 mt-6">{value.title}</h3>
                <p className="body-copy mt-3 text-ivory/60">{value.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
