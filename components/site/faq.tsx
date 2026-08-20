import type { FaqItem, Settings } from '@/lib/content';
import { ChevronDownIcon } from '@/components/ui/icons';
import { editableRow, editableSetting } from '@/lib/edit';

/**
 * FAQ accordion built on `<details>`/`<summary>`.
 *
 * No JavaScript, no state, no `aria-expanded` to get wrong: the element already has
 * the semantics, the keyboard behaviour and the open/closed announcement, and it
 * works before hydration. `name` groups them so opening one closes the rest — the
 * accordion behaviour that used to need a component.
 *
 * The same questions and answers feed the FAQPage structured data in app/page.tsx, so
 * editing one in the admin panel updates both.
 */
export function Faq({ faqs, settings }: { faqs: FaqItem[]; settings: Settings }) {
  if (faqs.length === 0) return null;

  return (
    <section className="section bg-ivory">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-20">
        <header>
          <p data-reveal="" className="eyebrow text-gold-dim">
            FAQ
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5 max-w-[16ch]"
            {...editableSetting('faq.heading')}
          >
            {settings['faq.heading']}
          </h2>
          <p data-reveal="" className="body-copy mt-6 max-w-[36ch] text-ink/55">
            Anything not covered here, ask us directly — we answer honestly, including
            when the answer is &ldquo;that date is already booked&rdquo;.
          </p>
        </header>

        <div data-reveal="" className="border-t border-ink/12">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              name="faq"
              className="group border-b border-ink/12 [&[open]_.faq-chevron]:rotate-180"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span
                  className="font-serif text-lg leading-snug font-normal transition-colors group-hover:text-gold-dim sm:text-xl"
                  {...editableRow('faqs', faq.id, 'question')}
                >
                  {faq.question}
                </span>
                <ChevronDownIcon className="faq-chevron mt-1.5 h-4 w-4 shrink-0 text-gold-dim transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]" />
              </summary>
              <p
                className="body-copy max-w-[62ch] pr-8 pb-6 text-ink/65"
                {...editableRow('faqs', faq.id, 'answer', { multiline: true })}
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
