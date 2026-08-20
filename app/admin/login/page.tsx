import { redirect } from 'next/navigation';
import { hasSession, isAdminConfigured } from '@/lib/admin/auth';
import { ActionForm, SubmitButton } from '@/components/admin/action-form';
import { login } from '../actions';

export default async function LoginPage() {
  if (await hasSession()) redirect('/admin');
  const configured = isAdminConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="text-[0.5625rem] tracking-[0.24em] text-gold-dim uppercase">
          Ganesh Patil Photography
        </p>
        <h1 className="mt-3 font-serif text-3xl font-light">Studio admin</h1>

        {configured ? (
          <>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-stone">
              Sign in to edit the site&apos;s text, photographs, packages and enquiries.
              Once you&apos;re in, the live site gains a <strong className="font-medium">Studio</strong>{' '}
              toolbar at the bottom left for editing pages in place.
            </p>
            <ActionForm action={login} className="mt-8 grid gap-4">
              <div>
                <label htmlFor="password" className="adm-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  autoFocus
                  className="adm-input"
                />
              </div>
              <SubmitButton pendingLabel="Signing in…" className="w-full">
                Sign in
              </SubmitButton>
            </ActionForm>
          </>
        ) : (
          /* Never fall open. If the password is unset the panel says so rather than
             letting anyone in, and the fix is a server-side environment variable. */
          <div className="mt-6 border border-gold/35 bg-white p-5">
            <p className="text-[0.8125rem] font-medium">The admin panel is closed.</p>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-stone">
              Set <code className="bg-ivory-dim px-1">ADMIN_PASSWORD</code> (at least 8
              characters) in the server&apos;s environment and restart the container.
              Until then nobody can sign in — including you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
