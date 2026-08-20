import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness only — deliberately does NOT touch Postgres. The container healthcheck
 * drives whether Traefik keeps routing here, and a database blip should degrade the
 * enquiry form, not take the whole site off the internet.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
