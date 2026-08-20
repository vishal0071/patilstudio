import type { InstagramItem, Settings } from '@/lib/content';
import { Frame } from '@/components/ui/frame';
import { InstagramIcon } from '@/components/ui/icons';
import { editableSetting } from '@/lib/edit';

/**
 * The Instagram grid.
 *
 * Admin-managed, not scraped. Instagram's Basic Display API needs the account
 * owner's own OAuth token, and pulling the grid off the public profile page without
 * one is both against Instagram's terms and a re-publication of images this site has
 * no licence for. So the studio picks the frames it wants shown, and the tiles link
 * to the posts they came from.
 *
 * If the studio later authorizes an API token, `lib/content` is where the fetch
 * belongs — the tiles below would then come from a cached feed instead of the table,
 * and nothing in this component changes.
 */
export function InstagramSection({
  items,
  settings,
}: {
  items: InstagramItem[];
  settings: Settings;
}) {
  const profileUrl = settings['social.instagram'];
  const handle = settings['social.instagramHandle'];

  return (
    <section id="instagram" className="section bg-ivory">
      <div className="shell">
        <header className="mx-auto max-w-2xl text-center">
          <p data-reveal="" className="eyebrow text-gold-dim">
            Instagram
          </p>
          <h2
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
            className="display-1 mt-5"
            {...editableSetting('instagram.heading')}
          >
            {settings['instagram.heading']}
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
            className="lede mt-5 text-ink/60"
            {...editableSetting('instagram.subheading', { multiline: true })}
          >
            {settings['instagram.subheading']}
          </p>
        </header>

        {items.length > 0 && (
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {items.map((item, i) => {
              const tile = (
                <span className="group relative block overflow-hidden">
                  <Frame
                    photo={item.photo}
                    ratio="square"
                    zoomOnHover
                    sizes="(max-width: 640px) 47vw, 31vw"
                    compact
                    editField={`instagram:${item.id}:imagePath`}
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-ink/45 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <InstagramIcon className="h-6 w-6 text-ivory" />
                  </span>
                </span>
              );

              return (
                <li
                  key={item.id}
                  data-reveal=""
                  style={{ '--reveal-delay': `${(i % 3) * 90}ms` } as React.CSSProperties}
                >
                  {item.permalink ? (
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View this post on Instagram`}
                    >
                      {tile}
                    </a>
                  ) : (
                    tile
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 flex justify-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal=""
            className="btn btn-dark"
          >
            <InstagramIcon className="h-4 w-4" />
            Follow {handle}
          </a>
        </div>
      </div>
    </section>
  );
}
