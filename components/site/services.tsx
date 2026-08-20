import Link from 'next/link';
import type { Service, Settings } from '@/lib/content';
import { Frame } from '@/components/ui/frame';
import { ArrowRightIcon } from '@/components/ui/icons';
import { editableRow, editableSetting } from '@/lib/edit';

/**
 * The service grid. Each card is one link — the whole tile is the target, not just
 * the "Explore Service" text, which on a phone is a three-millimetre tap target.
 */
export function Services({ services, settings }: { services: Service[]; settings: Settings }) {
  return (
    <section id="services" className="section bg-ink text-ivory">
      <div className="shell">
        <header className="max-w-3xl">
          <p data-reveal="" className="eyebrow text-gold">
            Services
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5"
            {...editableSetting('services.heading')}
          >
            {settings['services.heading']}
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
            className="lede mt-6 text-ivory/65"
            {...editableSetting('services.subheading', { multiline: true })}
          >
            {settings['services.subheading']}
          </p>
        </header>

        <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <li
              key={service.id}
              data-reveal=""
              style={{ '--reveal-delay': `${(i % 4) * 90}ms` } as React.CSSProperties}
            >
              <Link href={`/services/${service.slug}`} className="group block" data-tilt="">
                <div data-tilt-inner="">
                  <div data-reveal-image="" className="overflow-hidden">
                    <Frame
                      photo={service.photo}
                      ratio="portrait"
                      zoomOnHover
                      sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 22vw"
                      compact
                      editField={`services:${service.id}:imagePath`}
                    />
                  </div>
                  {/* Lifts toward the viewer in the card's own 3D space, so it
                      parallaxes against the photograph as the plane turns. */}
                  <div data-tilt-lift="">
                    <h3
                      className="display-3 mt-6 transition-colors group-hover:text-gold-soft"
                      {...editableRow('services', service.id, 'title')}
                    >
                      {service.title}
                    </h3>
                    <p
                      className="body-copy mt-3 text-ivory/60"
                      {...editableRow('services', service.id, 'blurb', { multiline: true })}
                    >
                      {service.blurb}
                    </p>
                    <span className="link-quiet mt-5 text-gold-soft">
                      Explore Service
                      <ArrowRightIcon className="arrow h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
