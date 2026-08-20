'use client';

import { useEffect } from 'react';

const SELECTOR = '[data-reveal=""],[data-reveal-image=""]';

/**
 * Drives every scroll animation on the site from one place.
 *
 * The alternative — a `<Reveal>` wrapper component — would make each animated
 * section a client component, and there are forty of them. Instead the sections stay
 * server-rendered and carry a bare `data-reveal` attribute; this one small client
 * component finds them and switches them on. The CSS in globals.css owns the actual
 * motion, so there is no per-frame JavaScript.
 *
 * The engine is also the only thing that can un-hide `[data-reveal]` content, which
 * is why it takes care of the three ways that could otherwise fail: reduced-motion
 * users, browsers without IntersectionObserver, and elements the visitor has already
 * scrolled past before hydration.
 */
export function RevealEngine() {
  useEffect(() => {
    const reveal = (el: Element) => {
      const node = el as HTMLElement;
      if (node.dataset.reveal === '') node.dataset.reveal = 'shown';
      if (node.dataset.revealImage === '') node.dataset.revealImage = 'shown';
    };

    const revealEverything = () => document.querySelectorAll(SELECTOR).forEach(reveal);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      revealEverything();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      // Fires a little before the element is fully in view, so the transition is
      // already running by the time the visitor is looking at it.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        // Already scrolled past — a deep link to #packages, or a reload partway down
        // the page. Show it now; it would otherwise stay invisible unless the
        // visitor happened to scroll back up through it.
        if (el.getBoundingClientRect().bottom < 0) reveal(el);
        else observer.observe(el);
      });
    };

    observe(document);

    // The portfolio filter and the admin panel mount new nodes after this runs.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;
          if (el.matches(SELECTOR)) {
            if (el.getBoundingClientRect().bottom < 0) reveal(el);
            else observer.observe(el);
          }
          observe(el);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
