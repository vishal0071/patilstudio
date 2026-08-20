import { getContent } from '@/lib/content';
import { buildJsonLd, jsonLdScript } from '@/lib/seo';
import { Hero } from '@/components/site/hero';
import { Stats } from '@/components/site/stats';
import { About } from '@/components/site/about';
import { Services } from '@/components/site/services';
import { PortfolioSection } from '@/components/site/portfolio-section';
import { WeddingStory } from '@/components/site/wedding-story';
import { Packages } from '@/components/site/packages';
import { Comparison } from '@/components/site/comparison';
import { Values } from '@/components/site/values';
import { Process } from '@/components/site/process';
import { Testimonials } from '@/components/site/testimonials';
import { FilmSection } from '@/components/site/film-section';
import { InstagramSection } from '@/components/site/instagram-section';
import { Faq } from '@/components/site/faq';
import { ContactSection } from '@/components/site/contact-section';

/**
 * The home page.
 *
 * Section order is the conversion argument, not a list of features: photograph →
 * proof → who we are → what we do → the work → one story told properly → price →
 * why us → how it works → other couples → the films → the feed → objections → ask.
 *
 * Every section is a server component fed from one `getContent()` read. The only
 * JavaScript that ships is the navigation, the gallery lightbox, the testimonial
 * carousel, the video modal, the enquiry form and the ~1KB reveal engine.
 */
export default async function HomePage() {
  const content = await getContent();
  const { settings, services, portfolio, packages, comparison, testimonials, story, films, faqs, instagram, values, process } = content;

  // The home page shows the featured edit; /portfolio has everything. Falling back to
  // the first 12 keeps the section populated if nobody has ticked "featured" yet.
  const featured = portfolio.filter((item) => item.featured);
  const homeEdit = (featured.length > 0 ? featured : portfolio).slice(0, 18);

  const jsonLd = buildJsonLd({ settings, services, faqs, testimonials });

  return (
    <>
      <script
        type="application/ld+json"
        // Rendered from our own CMS content, never from visitor input.
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <Hero settings={settings} />
      <Stats settings={settings} />
      <About settings={settings} />
      <Services services={services} settings={settings} />
      <PortfolioSection items={homeEdit} settings={settings} totalCount={portfolio.length} />
      <WeddingStory chapters={story} settings={settings} />
      <Packages packages={packages} settings={settings} />
      <Comparison rows={comparison} packages={packages} />
      <Values values={values} settings={settings} />
      <Process steps={process} settings={settings} />
      <Testimonials testimonials={testimonials} heading={settings['testimonials.heading']} />
      <FilmSection
        films={films}
        copy={{
          heading1: settings['film.heading1'],
          heading2: settings['film.heading2'],
          cta: settings['film.cta'],
        }}
      />
      <InstagramSection items={instagram} settings={settings} />
      <Faq faqs={faqs} settings={settings} />
      {/*<ContactSection settings={settings} />*/}
    </>
  );
}
