import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { CONTENT_TAG } from '@/lib/content';
import { hasSession } from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Drops the cached site content.
 *
 * The public pages read through a tagged cache that the admin panel invalidates on save.
 * A CLI import writes rows straight to Postgres and cannot call `revalidateTag`, so
 * without this the studio would import forty photographs and see nothing change for up
 * to an hour — and reasonably conclude the import had failed.
 *
 * Two ways in: an admin session cookie, or `Authorization: Bearer <ADMIN_PASSWORD>` for
 * scripts. The bearer form exists because `scripts/import-photos.mjs` runs on the
 * photographer's machine with the password already in `.env` and no browser involved.
 */
export async function POST(request: Request) {
  const authorized = (await hasSession()) || bearerMatches(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  revalidateTag(CONTENT_TAG);
  return NextResponse.json({ ok: true, revalidated: CONTENT_TAG });
}

function bearerMatches(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  // Same rule as the panel: an unset password closes the door rather than opening it.
  if (expected.length < 8) return false;

  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (presented.length === 0) return false;

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
