'use server';

import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CONTENT_TAG } from '@/lib/content';
import { SETTING_KEYS, type SettingKey } from '@/lib/content/settings';
import {
  COLLECTIONS,
  type CollectionKey,
  type Field,
  delegateFor,
  isCollectionKey,
} from '@/lib/admin/collections';
import { clientIp } from '@/lib/client-ip';
import {
  checkPassword,
  endSession,
  isAdminConfigured,
  requireAdmin,
  startSession,
} from '@/lib/admin/auth';

/**
 * Every mutation the admin panel can perform.
 *
 * Two invariants, both load-bearing:
 *
 *  1. **Each action calls `requireAdmin()` first.** A server action is a public POST
 *     endpoint addressed by an opaque id — it is not protected by the fact that the
 *     page rendering its form was. Route middleware would not cover these.
 *  2. **Each action ends with `revalidateTag(CONTENT_TAG)`.** The public site reads
 *     through a tagged cache, so without this a save is invisible until the hour-long
 *     revalidate window lapses, and the studio concludes the panel is broken.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requestIp(): Promise<string> {
  return clientIp(await headers());
}

/* ── Session ──────────────────────────────────────────────────────── */

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      error: 'ADMIN_PASSWORD is not set on the server, so the panel is closed.',
    };
  }

  const password = String(form.get('password') ?? '');
  const verdict = checkPassword(password, await requestIp());

  if (verdict === 'locked') {
    return { ok: false, error: 'Too many attempts. Try again in a few minutes.' };
  }
  if (verdict === 'invalid') {
    return { ok: false, error: 'That password is not right.' };
  }

  await startSession();
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await endSession();
  redirect('/admin/login');
}

/* ── Settings ─────────────────────────────────────────────────────── */

/**
 * Saves one group of settings.
 *
 * Only keys present in the submitted form are touched, so a group form cannot blank
 * out the keys belonging to another group. A value equal to its default is stored
 * anyway rather than deleted — the studio typing the default back in is an explicit
 * choice, and a row is the only record that the value was reviewed.
 */
export async function saveSettings(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const submitted = SETTING_KEYS.filter((key) => form.has(key));
  if (submitted.length === 0) return { ok: false, error: 'Nothing to save.' };

  try {
    await prisma.$transaction(
      submitted.map((key) => {
        const value = normaliseSetting(form, key);
        return prisma.siteSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }),
    );
  } catch (error) {
    console.error('[admin] failed to save settings', error);
    return { ok: false, error: 'Could not save. The database rejected the change.' };
  }

  revalidateTag(CONTENT_TAG);
  return { ok: true, message: `Saved ${submitted.length} setting${submitted.length === 1 ? '' : 's'}.` };
}

/**
 * Normalises one submitted value to the string the column stores.
 *
 * `lastValue`, not `form.get()`. A checkbox posts nothing when unticked, so every
 * boolean field in this panel is a hidden `false` followed by a checkbox `true` — and
 * `FormData.get()` returns the FIRST match, which is always the hidden `false`. Read
 * naively, a boolean could never be switched on: found by testing, and it would have
 * silently unpublished every row it touched.
 */
function normaliseSetting(form: FormData, key: SettingKey): string {
  const raw = lastValue(form, key);
  if (raw === null) return '';
  // Windows line endings in a textarea would otherwise defeat the blank-line
  // paragraph split in lib/site.ts.
  return String(raw).replace(/\r\n/g, '\n').trim().slice(0, 8000);
}

/** The last value posted under a name — see the note on normaliseSetting. */
function lastValue(form: FormData, name: string): FormDataEntryValue | null {
  const values = form.getAll(name);
  return values.length > 0 ? values[values.length - 1] : null;
}

/* ── Collections ──────────────────────────────────────────────────── */

export async function saveRow(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const key = String(form.get('__collection') ?? '');
  if (!isCollectionKey(key)) return { ok: false, error: 'Unknown collection.' };
  const collection = COLLECTIONS[key];
  const id = String(form.get('__id') ?? '');

  const data: Record<string, unknown> = {};
  for (const field of collection.fields) {
    // A field missing from the form is left untouched rather than nulled — that is
    // what lets a partial form (or a future per-field editor) be safe.
    if (!form.has(field.name) && field.type !== 'boolean') continue;
    const value = coerce(field, form);
    if (field.required && (value === null || value === '')) {
      return { ok: false, error: `${field.label} is required.` };
    }
    data[field.name] = value;
  }

  try {
    const delegate = delegateFor(key);
    if (id) await delegate.update({ where: { id }, data });
    else await delegate.create({ data });
  } catch (error) {
    console.error(`[admin] failed to save ${key} row`, error);
    return { ok: false, error: saveError(error) };
  }

  revalidateTag(CONTENT_TAG);
  return { ok: true, message: id ? 'Saved.' : `New ${collection.singular} added.` };
}

export async function deleteRow(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const key = String(form.get('__collection') ?? '');
  const id = String(form.get('__id') ?? '');
  if (!isCollectionKey(key) || !id) return { ok: false, error: 'Nothing to delete.' };

  try {
    await delegateFor(key).delete({ where: { id } });
  } catch (error) {
    console.error(`[admin] failed to delete ${key} row`, error);
    return { ok: false, error: 'Could not delete that row.' };
  }

  revalidateTag(CONTENT_TAG);
  return { ok: true, message: 'Deleted.' };
}

/**
 * Writes the seed rows for a collection.
 *
 * Refuses if the table already has rows. "Load starter content" that silently
 * duplicated eighteen portfolio slots would be a genuinely annoying thing to undo by
 * hand, and there is no undo here.
 */
export async function seedCollection(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const key = String(form.get('__collection') ?? '');
  if (!isCollectionKey(key)) return { ok: false, error: 'Unknown collection.' };

  try {
    const delegate = delegateFor(key);
    if ((await delegate.count()) > 0) {
      return {
        ok: false,
        error: 'This collection already has rows. Delete them first if you want to start over.',
      };
    }
    const rows = COLLECTIONS[key].seed();
    await delegate.createMany({ data: rows });
    revalidateTag(CONTENT_TAG);
    return { ok: true, message: `Loaded ${rows.length} starter rows.` };
  } catch (error) {
    console.error(`[admin] failed to seed ${key}`, error);
    return { ok: false, error: 'Could not load the starter content.' };
  }
}

/**
 * Loads the starter content for every collection that is still empty.
 *
 * Skips, rather than fails on, collections that already have rows — the studio may have
 * built its portfolio by hand and still want the FAQ seeded, and an all-or-nothing
 * button would make that impossible.
 *
 * Takes the standard `(prev, formData)` shape even though it uses neither, so it can be
 * handed straight to `useActionState`. Wrapping it in a client arrow instead — the
 * obvious way to write a no-argument action — makes React unable to emit the
 * progressive-enhancement fields, and the button silently does nothing without
 * JavaScript while every other form on the page still works.
 */
export async function seedEverything(
  _prev: ActionResult | null,
  _form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const loaded: string[] = [];
  const skipped: string[] = [];

  try {
    for (const key of Object.keys(COLLECTIONS) as CollectionKey[]) {
      const delegate = delegateFor(key);
      if ((await delegate.count()) > 0) {
        skipped.push(COLLECTIONS[key].label);
        continue;
      }
      await delegate.createMany({ data: COLLECTIONS[key].seed() });
      loaded.push(COLLECTIONS[key].label);
    }
  } catch (error) {
    console.error('[admin] failed to seed all collections', error);
    return { ok: false, error: 'Could not load the starter content. Nothing further was written.' };
  }

  revalidateTag(CONTENT_TAG);
  if (loaded.length === 0) {
    return { ok: true, message: 'Every collection already has rows — nothing to load.' };
  }
  return {
    ok: true,
    message: `Loaded ${loaded.join(', ')}.${skipped.length ? ` Skipped ${skipped.join(', ')} (already populated).` : ''}`,
  };
}

/** Nudges a row up or down by swapping its sortOrder with its neighbour's. */
export async function reorderRow(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const key = String(form.get('__collection') ?? '');
  const id = String(form.get('__id') ?? '');
  const direction = String(form.get('__direction') ?? '');
  if (!isCollectionKey(key) || !id) return { ok: false, error: 'Nothing to reorder.' };

  try {
    const delegate = delegateFor(key);
    const rows = (await delegate.findMany({ orderBy: { sortOrder: 'asc' } })) as {
      id: string;
      sortOrder: number;
    }[];
    const index = rows.findIndex((row) => row.id === id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= rows.length) return { ok: true };

    // Rewrite the whole column rather than swapping two values: seeded rows often
    // share a sortOrder, and swapping identical numbers moves nothing.
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    await prisma.$transaction(
      next.map((row, position) =>
        delegate.update({ where: { id: row.id }, data: { sortOrder: position } }),
      ) as never,
    );
  } catch (error) {
    console.error(`[admin] failed to reorder ${key}`, error);
    return { ok: false, error: 'Could not reorder.' };
  }

  revalidateTag(CONTENT_TAG);
  return { ok: true };
}

/* ── Enquiries ────────────────────────────────────────────────────── */

export async function setInquiryStatus(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  const allowed = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const;
  if (!id || !allowed.includes(status as (typeof allowed)[number])) {
    return { ok: false, error: 'Unknown status.' };
  }

  try {
    await prisma.inquiry.update({
      where: { id },
      data: { status: status as (typeof allowed)[number] },
    });
  } catch (error) {
    console.error('[admin] failed to update enquiry status', error);
    return { ok: false, error: 'Could not update that enquiry.' };
  }

  // Enquiries are not part of the public site's content, so no tag revalidation —
  // only the admin page needs to re-read, and it is dynamic already.
  return { ok: true };
}

export async function deleteInquiry(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(form.get('id') ?? '');
  if (!id) return { ok: false, error: 'Nothing to delete.' };

  try {
    await prisma.inquiry.delete({ where: { id } });
  } catch (error) {
    console.error('[admin] failed to delete enquiry', error);
    return { ok: false, error: 'Could not delete that enquiry.' };
  }
  return { ok: true, message: 'Enquiry deleted.' };
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/** FormData is all strings; each field type says what it should become. */
function coerce(field: Field, form: FormData): unknown {
  // Always the LAST value, for the paired-checkbox reason explained on normaliseSetting.
  const raw = lastValue(form, field.name);

  switch (field.type) {
    case 'boolean':
      return raw === 'on' || raw === 'true';
    case 'number': {
      const parsed = Number(String(raw ?? '').trim());
      return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }
    case 'list':
      return String(raw ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 40);
    default: {
      const value = String(raw ?? '')
        .replace(/\r\n/g, '\n')
        .trim()
        .slice(0, 8000);
      // Empty text on a nullable column should be NULL, so `imagePath: ''` does not
      // become a broken <img src="">.
      return value.length > 0 ? value : field.required ? '' : null;
    }
  }
}

function saveError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Unique constraint')) {
    return 'That slug is already used by another row. Slugs must be unique.';
  }
  return 'Could not save. The database rejected the change.';
}
