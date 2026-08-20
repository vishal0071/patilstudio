import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewInquiry } from '@/lib/notify';
import { clientIp } from '@/lib/client-ip';
import { validateInquiry } from '@/lib/validation';

export const runtime = 'nodejs';
// This route writes to the database, so it must never be statically evaluated.
export const dynamic = 'force-dynamic';

/**
 * Public, unauthenticated write. Three things keep that from being a liability:
 * every field is length-capped before it reaches Postgres, the honeypot field
 * absorbs the bulk of drive-by bots, and a per-IP window bounds the rest.
 *
 * The limiter counts only submissions that actually WROTE a row. Counting attempts
 * instead — the obvious implementation — means a visitor who mistypes their email
 * twice and then fixes it has burned three of five, and the fourth correction is
 * met with a 429. On an enquiry form that is a lost booking, which is the entire
 * cost this site exists to avoid. Rejected payloads never reach Postgres, so they
 * are not the thing worth rationing.
 *
 * In-process, therefore per-container — fine at the one replica this site runs.
 * Move it to the Redis already on the box if it ever scales out; do not quietly
 * keep trusting it after that.
 */
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const writes = new Map<string, number[]>();

function recentWrites(ip: string): number[] {
  const now = Date.now();
  const recent = (writes.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length > 0) writes.set(ip, recent);
  else writes.delete(ip);
  return recent;
}

function recordWrite(ip: string): void {
  const recent = recentWrites(ip);
  recent.push(Date.now());
  writes.set(ip, recent);
  // Bound the map so a spray of unique IPs cannot grow it without limit.
  if (writes.size > 5000) for (const k of writes.keys()) if (k !== ip) writes.delete(k);
}

/** Trim, cap, and turn blank into null so optional fields stay clean. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * The ticked service checkboxes. Bounded on both axes — a caller can post an array of
 * any length, and this is an unauthenticated endpoint writing to a text[] column.
 */
function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export async function POST(request: Request) {
  // See lib/client-ip.ts for why this is the LAST forwarded hop and not the first.
  // Still best-effort abuse control rather than authentication.
  const ip = clientIp(request.headers);
  if (recentWrites(ip).length >= LIMIT) {
    return NextResponse.json(
      { error: 'Too many enquiries from this connection. Please try again later.' },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  // Honeypot tripped: accept it so the bot sees success and moves on, store nothing.
  if (text(payload.company, 100)) return NextResponse.json({ ok: true });

  // Same rules the form applies in the browser — see lib/validation.ts. The server stays
  // the authority; the shared module only stops the two from disagreeing.
  const { values, errors } = validateInquiry(payload);
  if (Object.keys(errors).length > 0) {
    // Field-keyed, so the form can put each message against the input that caused it
    // instead of showing one sentence at the bottom. `error` is kept for any caller that
    // only reads a single string.
    return NextResponse.json(
      { error: Object.values(errors)[0], errors },
      { status: 400 },
    );
  }
  const { name, email, message, phone } = values;

  let inquiry;
  try {
    inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        message,
        phone,
        eventType: text(payload.eventType, 120),
        eventDate: text(payload.eventDate, 120),
        eventLocation: text(payload.eventLocation, 200),
        eventCount: text(payload.eventCount, 120),
        budget: text(payload.budget, 120),
        services: stringList(payload.services, 20, 80),
        source: text(payload.source, 200) ?? 'website',
      },
    });
  } catch (error) {
    // Never surface a database error to a visitor; it says more about the stack
    // than it does about their form.
    console.error('[inquiries] failed to persist enquiry', error);
    return NextResponse.json(
      { error: 'We could not record that just now. Please try again or call us.' },
      { status: 500 },
    );
  }

  recordWrite(ip);

  // Awaited, not fired and forgotten: on a serverless-style runtime a floating promise
  // can be killed the moment the response is returned. `notifyNewInquiry` never
  // throws and gives up after 8 seconds, so the enquiry is already safe in Postgres
  // whatever the email provider does.
  await notifyNewInquiry(inquiry);

  return NextResponse.json({ ok: true }, { status: 201 });
}
