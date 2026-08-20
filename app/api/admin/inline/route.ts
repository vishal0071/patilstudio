import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONTENT_TAG } from '@/lib/content';
import { hasSession } from '@/lib/admin/auth';
import { delegateFor } from '@/lib/admin/collections';
import { parseField } from '@/lib/edit';
import type { CollectionKey } from '@/lib/admin/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Writes a batch of inline edits made on the live page.
 *
 * Everything hostile about this endpoint is handled by `parseField`, which allow-lists the
 * field reference against `settingDefaults` and the collections' own declared field lists.
 * A column name never reaches Prisma unless it was declared as a text or image field —
 * so this route cannot be talked into setting `published: false` across the site, and
 * cannot name a column that does not exist.
 *
 * Edits are applied in one transaction. A partial save is worse than a failed one here:
 * the studio is looking at the page and will believe whatever it shows, so either the
 * whole batch lands or none of it does and the toolbar keeps the pending changes.
 */

const MAX_EDITS = 100;
const MAX_LENGTH = 8000;

type Edit = { field: string; value: string };

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let payload: { edits?: unknown };
  try {
    payload = (await request.json()) as { edits?: unknown };
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (!Array.isArray(payload.edits) || payload.edits.length === 0) {
    return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
  }
  if (payload.edits.length > MAX_EDITS) {
    return NextResponse.json(
      { error: `Too many changes in one save (limit ${MAX_EDITS}).` },
      { status: 413 },
    );
  }

  const settingWrites: { key: string; value: string }[] = [];
  const rowWrites: { collection: CollectionKey; id: string; column: string; value: string }[] = [];

  for (const raw of payload.edits as Edit[]) {
    const parsed = parseField(raw?.field);
    if (!parsed) {
      return NextResponse.json(
        { error: `Not an editable field: ${String(raw?.field).slice(0, 80)}` },
        { status: 400 },
      );
    }

    // contentEditable hands back non-breaking spaces and CRLFs; normalise before storing
    // so the saved copy matches what a form in the admin panel would have written.
    const value = String(raw?.value ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/ /g, ' ')
      .trim()
      .slice(0, MAX_LENGTH);

    if (parsed.kind === 'setting') {
      settingWrites.push({ key: parsed.key, value });
    } else {
      rowWrites.push({
        collection: parsed.collection as CollectionKey,
        id: parsed.id,
        column: parsed.column,
        // A cleared image or optional text becomes NULL, not '', so the placeholder
        // logic on the public site keeps working.
        value,
      });
    }
  }

  try {
    await prisma.$transaction([
      ...settingWrites.map(({ key, value }) =>
        prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
      ...rowWrites.map(({ collection, id, column, value }) =>
        delegateFor(collection).update({
          where: { id },
          data: { [column]: value.length > 0 ? value : null },
        }),
      ),
    ] as never);
  } catch (error) {
    console.error('[inline] failed to save edits', error);
    return NextResponse.json(
      { error: 'Could not save. Nothing was changed.' },
      { status: 500 },
    );
  }

  revalidateTag(CONTENT_TAG);
  return NextResponse.json({ ok: true, saved: settingWrites.length + rowWrites.length });
}
