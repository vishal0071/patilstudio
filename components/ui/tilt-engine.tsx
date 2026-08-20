'use client';

import { useEffect } from 'react';

/**
 * Cursor-following 3D tilt for anything marked `data-tilt`.
 *
 * Built the same way as the reveal engine: one delegated listener for the whole page
 * rather than a `<Tilt>` wrapper per card, so the service grid, the portfolio tiles and
 * the package cards all stay server components. Sections opt in with a bare attribute.
 *
 * Three things keep it cheap:
 *
 *   - **CSS owns the motion.** This only writes two custom properties; the transform,
 *     its easing and its transition live in globals.css. Nothing here touches layout,
 *     so the compositor handles every frame.
 *   - **One rAF per frame, not one per event.** Pointer moves fire faster than the
 *     display refreshes; writing on each one is wasted work and can force style
 *     recalculation mid-frame.
 *   - **Pointer capability, not screen width.** Gated on `(hover: hover) and
 *     (pointer: fine)` — a touch device has no hover state to tilt toward, and a
 *     tilt-on-tap would fight the scroll gesture. That also correctly includes a small
 *     laptop window and excludes a large tablet.
 */

/** Degrees of rotation at the very corner of a card. Past ~6 the type distorts. */
const MAX_TILT = 5;

export function TiltEngine() {
  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reducedMotion) return;

    let frame = 0;
    let queued: { card: HTMLElement; inner: HTMLElement; rx: number; ry: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!queued) return;
      const { inner, rx, ry } = queued;
      inner.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`);
      inner.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`);
      queued = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const card = target?.closest?.('[data-tilt]') as HTMLElement | null;
      if (!card) return;
      const inner = card.querySelector('[data-tilt-inner]') as HTMLElement | null;
      if (!inner) return;

      const box = card.getBoundingClientRect();
      // -1 … 1 from the card's centre.
      const x = (event.clientX - box.left) / box.width * 2 - 1;
      const y = (event.clientY - box.top) / box.height * 2 - 1;

      card.setAttribute('data-tilt-active', '');
      // Negated on X: the pointer moving down should tip the top of the card away,
      // which is what makes it read as a physical surface rather than a hinge.
      queued = { card, inner, rx: -y * MAX_TILT, ry: x * MAX_TILT };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onPointerOut = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest?.('[data-tilt]') as HTMLElement | null;
      if (!card) return;
      // `pointerout` also fires moving between a card's own children; ignore those, or
      // the card flickers back to rest as the cursor crosses the caption.
      const next = event.relatedTarget as Node | null;
      if (next && card.contains(next)) return;

      const inner = card.querySelector('[data-tilt-inner]') as HTMLElement | null;
      inner?.style.setProperty('--tilt-rx', '0deg');
      inner?.style.setProperty('--tilt-ry', '0deg');
      card.removeAttribute('data-tilt-active');
      if (queued?.card === card) queued = null;
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
