import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Admin authentication: one shared password, a signed session cookie, no user table.
 *
 * That is a deliberate ceiling on the feature, not an oversight. There is exactly one
 * person who edits this site, and a users/roles/reset-email system for an audience of
 * one is more code to get wrong than it protects. If the studio ever takes on a second
 * editor, this is the file to replace — and the rest of the panel does not care how
 * `requireAdmin()` decides.
 *
 * The cookie is `expiry.hmac`, signed with a key derived from ADMIN_PASSWORD, so
 * changing the password invalidates every existing session for free. It is httpOnly,
 * sameSite=lax and Secure in production; there is no server-side session store, which
 * means a stolen cookie is valid until it expires — acceptable for a marketing CMS,
 * and the reason the lifetime is 7 days rather than a month.
 */

const COOKIE = 'patil_admin';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** Unset password = the panel is closed. It must never fall open. */
export function isAdminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? '').length >= 8;
}

function signingKey(): string {
  const password = process.env.ADMIN_PASSWORD ?? '';
  // A distinct secret is preferred, so rotating one does not force the other. Without
  // it the password doubles as the signing key, which is weaker but never absent.
  return process.env.ADMIN_SESSION_SECRET || `patilstudio:${password}`;
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, so compare lengths first — and note
  // that leaking the length of a password or an HMAC is not useful to an attacker.
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Checks a submitted password.
 *
 * Rate limiting is in-process and per-container, like the enquiry limiter. Unlike that
 * one this counts *attempts*, because here a wrong guess is exactly the thing worth
 * rationing.
 */
const attempts = new Map<string, { count: number; first: number }>();
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

export function checkPassword(candidate: string, ip: string): 'ok' | 'invalid' | 'locked' {
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && now - record.first > ATTEMPT_WINDOW_MS) attempts.delete(ip);

  const current = attempts.get(ip);
  if (current && current.count >= MAX_ATTEMPTS) return 'locked';

  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (expected.length >= 8 && equals(candidate, expected)) {
    attempts.delete(ip);
    return 'ok';
  }

  if (current) current.count += 1;
  else {
    attempts.set(ip, { count: 1, first: now });
    // Bound the map against a spray of unique IPs.
    if (attempts.size > 2000) {
      for (const key of attempts.keys()) {
        if (key !== ip) attempts.delete(key);
      }
    }
  }
  return 'invalid';
}

export async function startSession(): Promise<void> {
  const expiry = String(Date.now() + SESSION_MS);
  // A nonce keeps two sessions issued in the same millisecond from sharing a value.
  const nonce = randomBytes(8).toString('base64url');
  const payload = `${expiry}.${nonce}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;

  const parts = raw.split('.');
  if (parts.length !== 3) return false;
  const [expiry, nonce, signature] = parts;
  if (!equals(sign(`${expiry}.${nonce}`), signature)) return false;

  const expiresAt = Number(expiry);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/**
 * Gate for every admin page and server action.
 *
 * Called at the top of each one rather than relying on middleware: a server action is
 * a public POST endpoint reachable by its id, so a middleware matcher that only covers
 * `/admin/*` page navigations would leave the mutations open.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await hasSession())) redirect('/admin/login');
}
