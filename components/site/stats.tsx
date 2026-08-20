import type { Settings } from '@/lib/content';
import { isOn } from '@/lib/content';
import type { SettingKey } from '@/lib/content';
import { editableSetting } from '@/lib/edit';

/**
 * The trust strip.
 *
 * The figures are editable and, until the studio confirms them, explicitly labelled
 * as unconfirmed. That notice is not decoration: numbers like "500+ moments
 * captured" are a factual claim about someone's business, and this site has no way
 * to verify them. Flip `stats.confirmed` to `true` in the admin panel once the owner
 * has checked each one, and the notice disappears.
 */
export function Stats({ settings }: { settings: Settings }) {
  const confirmed = isOn(settings['stats.confirmed']);
  const items = ([1, 2, 3, 4] as const)
    .map((n) => ({
      valueKey: `stats.${n}.value` as SettingKey,
      labelKey: `stats.${n}.label` as SettingKey,
      value: settings[`stats.${n}.value` as SettingKey],
      label: settings[`stats.${n}.label` as SettingKey],
    }))
    .filter((item) => item.value && item.label);

  return (
    <section className="relative bg-ink text-ivory">
      <div className="shell py-14 sm:py-20">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.label}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
              className="text-center lg:text-left"
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span
                  className="numeral block text-[clamp(2.5rem,5vw,3.75rem)] leading-none text-gold-soft"
                  {...editableSetting(item.valueKey)}
                >
                  {item.value}
                </span>
                <span
                  className="mt-3 block text-[0.65rem] tracking-[0.24em] text-ivory/55 uppercase"
                  {...editableSetting(item.labelKey)}
                >
                  {item.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-ivory/10 pt-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <p
            className="font-serif text-lg font-light text-ivory/75 sm:text-xl"
            {...editableSetting('stats.statement', { multiline: true })}
          >
            {settings['stats.statement']}
          </p>
          {!confirmed && (
            <p className="max-w-[34ch] text-[0.6875rem] leading-relaxed text-gold/70">
              Figures above are placeholders awaiting the studio&apos;s confirmation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
