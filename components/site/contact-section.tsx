import type { Settings } from '@/lib/content';
import { isOn } from '@/lib/content';
import { mailHref, telHref, whatsappHref } from '@/lib/site';
import { editableSetting } from '@/lib/edit';
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/ui/icons';
import { EnquiryForm } from './enquiry-form';

/**
 * Contact and booking. The heaviest section on the page by design — everything above
 * it exists to get someone here.
 *
 * The contact details carry a visible caveat until `contact.detailsConfirmed` is set,
 * because a placeholder phone number that looks real is worse than one that admits
 * it: a visitor who dials +91 00000 00000 and gets nothing concludes the studio is
 * defunct.
 */
export function ContactSection({ settings }: { settings: Settings }) {
  const confirmed = isOn(settings['contact.detailsConfirmed']);

  const details = [
    {
      icon: PhoneIcon,
      label: 'Phone',
      value: settings['contact.phone'],
      href: telHref(settings),
    },
    {
      icon: WhatsAppIcon,
      label: 'WhatsApp',
      value: settings['whatsapp.label'],
      href: whatsappHref(settings),
      external: true,
    },
    {
      icon: MailIcon,
      label: 'Email',
      value: settings['contact.email'],
      href: mailHref(settings, 'Photography enquiry'),
    },
    {
      icon: PinIcon,
      label: 'Studio',
      value: settings['contact.addressLine'],
      href: null,
    },
  ];

  return (
    <section id="contact" className="section bg-ink-soft text-ivory">
      <div className="shell grid gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <p data-reveal="" className="eyebrow text-gold">
            Enquire
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5 max-w-[18ch]"
            {...editableSetting('contact.heading')}
          >
            {settings['contact.heading']}
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
            className="lede mt-5 max-w-[42ch] text-ivory/65"
            {...editableSetting('contact.subheading', { multiline: true })}
          >
            {settings['contact.subheading']}
          </p>

          <ul data-reveal="" className="mt-12 space-y-6">
            {details.map((detail) => {
              const Icon = detail.icon;
              const content = (
                <>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>
                    <span className="block text-[0.6rem] tracking-[0.24em] text-ivory/40 uppercase">
                      {detail.label}
                    </span>
                    <span className="mt-1 block text-[0.9375rem] text-ivory/85">
                      {detail.value}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={detail.label}>
                  {detail.href ? (
                    <a
                      href={detail.href}
                      {...(detail.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="flex gap-4 transition-opacity hover:opacity-70"
                    >
                      {content}
                    </a>
                  ) : (
                    <span className="flex gap-4">{content}</span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-10 border-t border-ivory/10 pt-6">
            <p className="text-[0.6rem] tracking-[0.24em] text-ivory/40 uppercase">
              Where we work
            </p>
            <p
              className="body-copy mt-2 max-w-[36ch] text-ivory/60"
              {...editableSetting('contact.serviceArea', { multiline: true })}
            >
              {settings['contact.serviceArea']}
            </p>
            <p className="mt-4 text-[0.6875rem] text-ivory/40">{settings['contact.hours']}</p>
          </div>

          {!confirmed && (
            <p className="mt-8 border border-gold/25 px-4 py-3 text-[0.6875rem] leading-relaxed text-gold/75">
              Contact details above are placeholders. Set the real phone, WhatsApp
              number and email in the admin panel before launch.
            </p>
          )}
        </div>

        <div data-reveal="" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
          <EnquiryForm
            copy={{
              submitLabel: settings['contact.submitLabel'],
              successTitle: settings['contact.successTitle'],
              successBody: settings['contact.successBody'],
              whatsappUrl: whatsappHref(settings),
              whatsappAfterSubmitUrl: whatsappHref(settings, 'Just submitted the enquiry form'),
            }}
          />
        </div>
      </div>
    </section>
  );
}
