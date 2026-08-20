'use client';

import dynamic from 'next/dynamic';

/**
 * Loads the on-page editor as its own chunk.
 *
 * `next/dynamic` called from a *server* component does not split here — webpack keeps a
 * module this small inside the parent layout chunk, which every visitor downloads.
 * Measured before and after: the editor's code stayed in `(site)/layout-*.js` either way.
 *
 * Crossing a client boundary first is what actually produces a separate chunk, fetched
 * only when this component renders — i.e. only for a signed-in admin. `ssr: false` because
 * an editing toolbar has nothing useful to contribute to server-rendered HTML.
 */
const LiveEditor = dynamic(
  () => import('./live-editor').then((m) => m.LiveEditor),
  { ssr: false },
);

export function LiveEditorMount() {
  return <LiveEditor />;
}
