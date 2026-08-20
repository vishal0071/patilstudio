'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionResult } from '@/app/admin/actions';

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

/**
 * A form bound to a server action, with its result rendered inline.
 *
 * Exists so the nine collection editors, the settings groups and the enquiry controls
 * all report success and failure the same way. `useActionState` keeps the returned
 * message next to the form that produced it, which matters on a page with twenty
 * separate forms — a single page-level toast would leave the studio guessing which
 * save it referred to.
 */
export function ActionForm({
  action,
  hidden,
  children,
  className = '',
  /** Hide the inline confirmation (used where the parent shows its own). */
  quiet = false,
}: {
  action: Action;
  hidden?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  quiet?: boolean;
}) {
  const [state, dispatch] = useActionState(action, null);

  return (
    <form action={dispatch} className={className}>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {!quiet && state && (
        <p
          role="status"
          className={`mt-3 text-[0.75rem] ${state.ok ? 'text-green-700' : 'text-red-700'}`}
        >
          {state.ok ? (state.message ?? 'Saved.') : state.error}
        </p>
      )}
    </form>
  );
}

/**
 * Submit button that reports the enclosing form's pending state.
 *
 * `useFormStatus` only reads the form it is rendered inside, which is exactly the
 * behaviour wanted here — one spinner per form, not one for the page.
 */
export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  variant = 'primary',
  confirm,
  className = '',
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Browser confirm before submitting — for the destructive ones. */
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={confirm ? (event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      } : undefined}
      className={`adm-btn adm-btn-${variant} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
