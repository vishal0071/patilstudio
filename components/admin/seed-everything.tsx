'use client';

import { useActionState } from 'react';
import { seedEverything } from '@/app/admin/actions';

/**
 * One button for the first-run case: nine empty tables, and the studio wants all of the
 * starter content as editable rows rather than nine trips to nine pages.
 *
 * Only rendered while every collection is empty — see the dashboard. Once anything has
 * been edited, per-collection loading is the safer path.
 */
export function SeedEverythingButton() {
  // The server action is passed directly, not wrapped in a client arrow — that is what
  // lets React render the progressive-enhancement fields so this works without JS too.
  const [state, run, pending] = useActionState(seedEverything, null);

  return (
    <form action={run}>
      <button type="submit" disabled={pending} className="adm-btn adm-btn-primary">
        {pending ? 'Loading…' : 'Load all starter content'}
      </button>
      {state && (
        <p
          role="status"
          className={`mt-2 text-[0.75rem] leading-relaxed ${state.ok ? 'text-green-700' : 'text-red-700'}`}
        >
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
