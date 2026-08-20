import Link from 'next/link';
import type { Service, Settings } from '@/lib/content';
import { NAV_LINKS, mailHref, telHref, whatsappHref } from '@/lib/site';
import { editableSetting } from '@/lib/edit';
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/ui/icons';

/**
 * Footer. The bottom padding is deliberately large below `lg` — the sticky mobile CTA
 * bar is fixed over this area, and without the clearance it covers the copyright line.
 */
export function SiteFooter({
  settings,
  services,
  year,
}: {
  settings: Settings;
  services: Service[];
  /** Passed in from the page so the whole tree renders from one clock reading. */
  year: number;
}) {
  const socials = [
    { href: settings['social.instagram'], label: 'Instagram', Icon: InstagramIcon },
    { href: settings['social.facebook'], label: 'Facebook', Icon: FacebookIcon },
    { href: settings['social.youtube'], label: 'YouTube', Icon: YouTubeIcon },
  ].filter((social) => social.href.trim().length > 0);

  const quickLinks = NAV_LINKS.filter((link) =>
    ['Home', 'About', 'Services', 'Portfolio', 'Packages', 'Contact'].includes(link.label),
  );

  return (
    <footer className="bg-ink pt-[clamp(3.5rem,7vw,6rem)] pb-28 text-ivory lg:pb-10">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div>
            <p className="font-serif text-2xl leading-tight font-light">
              {settings['brand.name']}
            </p>
            <p
              className="mt-4 max-w-[34ch] font-serif text-base leading-relaxed text-gold-soft/85"
              {...editableSetting('brand.tagline', { multiline: true })}
            >
              {settings['brand.tagline']}
            </p>
            <p
              className="body-copy mt-5 max-w-[38ch] text-ivory/50"
              {...editableSetting('footer.blurb', { multiline: true })}
            >
              {settings['footer.blurb']}
            </p>

            {socials.length > 0 && (
              <ul className="mt-7 flex gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center border border-ivory/15 text-ivory/70 transition-colors hover:border-gold hover:text-gold"
                    >
                      <Icon className="h-[1.1rem] w-[1.1rem]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Quick links">
            <h2 className="eyebrow text-gold">Quick Links</h2>
            <ul className="mt-6 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.875rem] text-ivory/60 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h2 className="eyebrow text-gold">Services</h2>
            <ul className="mt-6 space-y-3">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-[0.875rem] text-ivory/60 transition-colors hover:text-ivory"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-gold">Contact</h2>
            <ul className="mt-6 space-y-4 text-[0.875rem] text-ivory/60">
              <li>
                <a
                  href={telHref(settings)}
                  className="flex items-start gap-3 transition-colors hover:text-ivory"
                >
                  <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                  {settings['contact.phone']}
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref(settings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-ivory"
                >
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={mailHref(settings)}
                  className="flex items-start gap-3 break-all transition-colors hover:text-ivory"
                >
                  <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                  {settings['contact.email']}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                {settings['contact.addressLine']}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ivory/10 pt-7 text-[0.6875rem] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings['footer.copyrightHolder']}. All Rights Reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {settings['footer.credit'] && <span>{settings['footer.credit']}</span>}
            <Link href="/portfolio" className="transition-colors hover:text-ivory">
              Full Portfolio
            </Link>
            <Link href="/#contact" className="transition-colors hover:text-ivory">
              Book Your Date
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
