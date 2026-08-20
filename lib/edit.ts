import { COLLECTIONS, isCollectionKey } from '@/lib/admin/collections';
import { SETTING_KEYS, type SettingKey } from '@/lib/content/settings';

/**
 * Field addressing for live inline editing.
 *
 * A rendered piece of text carries a `data-edit` attribute naming the exact database
 * field behind it, so the on-page editor can write it back without guessing. Two shapes:
 *
 *   settings:hero.line1              → SiteSetting row, key `hero.line1`
 *   services:<uuid>:title            → Service row, column `title`
 *
 * The attribute goes on the element that already exists — `editable()` returns props to
 * spread — rather than wrapping it. A wrapper would change the layout and the typography
 * of the very thing being edited, which is the one thing an inline editor must not do.
 *
 * Attributes are rendered for every visitor, not only signed-in ones, so the HTML is
 * identical for everybody and stays cacheable. They are inert without a session: the
 * editor script is only served to an admin, and `parseField` below is what actually
 * guards the write.
 */

export type EditableProps = {
  'data-edit': string;
  'data-edit-multiline'?: '';
};

/** Props for an editable single-line string. */
export function editable(field: string, options?: { multiline?: boolean }): EditableProps {
  return {
    'data-edit': field,
    // Tells the editor to allow Enter (paragraph breaks) instead of committing.
    ...(options?.multiline ? { 'data-edit-multiline': '' as const } : {}),
  };
}

/** `settings:<key>` for one of the flat KV settings. */
export function editableSetting(key: SettingKey, options?: { multiline?: boolean }) {
  return editable(`settings:${key}`, options);
}

/** `<collection>:<id>:<column>` for a row field. */
export function editableRow(
  collection: string,
  id: string,
  column: string,
  options?: { multiline?: boolean },
) {
  return editable(`${collection}:${id}:${column}`, options);
}

export type ParsedField =
  | { kind: 'setting'; key: SettingKey }
  | { kind: 'row'; collection: string; id: string; column: string; isImage: boolean };

/**
 * Validates a field reference from the browser.
 *
 * This is the security boundary for inline editing, and it is an allow-list on purpose:
 * the string arrives from a client and ends up as a Prisma column name. Anything not
 * declared in `settingDefaults` or in a collection's own field list is rejected outright
 * rather than passed through — which also means an inline editor can never reach
 * `published`, `sortOrder` or `pricePending`, since those are booleans and numbers and
 * are excluded below.
 */
export function parseField(field: unknown): ParsedField | null {
  if (typeof field !== 'string' || field.length > 200) return null;
  const parts = field.split(':');

  if (parts[0] === 'settings') {
    if (parts.length !== 2) return null;
    return (SETTING_KEYS as string[]).includes(parts[1])
      ? { kind: 'setting', key: parts[1] as SettingKey }
      : null;
  }

  if (parts.length !== 3) return null;
  const [collection, id, column] = parts;
  if (!isCollectionKey(collection)) return null;
  // uuid(7) — same shape every id in this schema has.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const declared = COLLECTIONS[collection].fields.find((f) => f.name === column);
  // Only free-text and image fields are editable in place. A checkbox or a sort order has
  // no sensible inline representation, and allowing them here would be the hole.
  if (!declared || !['text', 'textarea', 'list', 'image'].includes(declared.type)) return null;

  return {
    kind: 'row',
    collection,
    id,
    column,
    isImage: declared.type === 'image',
  };
}

/**
 * Setting keys whose value is an image path, so the admin form offers an upload button
 * and a thumbnail instead of a bare text input.
 *
 * Suffix-matched rather than listed, so a new `*.imagePath` or `*.logoPath` key gets the
 * upload widget without anyone having to remember to add it here.
 */
export function isImageSetting(key: string): boolean {
  return key.endsWith('.imagePath') || key.endsWith('.logoPath') || key === 'seo.ogImagePath';
}
