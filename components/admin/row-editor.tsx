'use client';

import { useState } from 'react';
import type { ClientCollection } from '@/lib/admin/collections';
import { deleteRow, reorderRow, saveRow } from '@/app/admin/actions';
import { ActionForm, SubmitButton } from './action-form';
import { FieldControl } from './fields';

type Row = Record<string, unknown> & { id: string };

/**
 * One editable row, collapsed by default.
 *
 * Collapsed-by-default is the whole reason this is usable: the portfolio has eighteen
 * rows with eight fields each, and rendering 144 inputs expanded turns the page into
 * something nobody wants to open. `<details>` also means the browser handles the
 * keyboard and the open/closed state for free.
 */
export function RowEditor({
  collection,
  row,
  index,
  count,
}: {
  collection: ClientCollection;
  row: Row;
  index: number;
  count: number;
}) {
  const title = String(row[collection.titleField] ?? '') || `Untitled ${collection.singular}`;
  const published = row.published !== false;
  const hasImage = typeof row.imagePath === 'string' && row.imagePath.length > 0;
  const needsImage = collection.fields.some((field) => field.type === 'image');

  return (
    <details className="adm-card group">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="numeral w-6 shrink-0 text-xs text-stone">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{title}</span>

        {needsImage && !hasImage && (
          <span className="adm-chip bg-gold/12 text-gold-dim">No photo</span>
        )}
        {!published && <span className="adm-chip bg-ink/8 text-stone">Hidden</span>}

        <span className="text-[0.6875rem] text-stone group-open:hidden">Edit</span>
        <span className="hidden text-[0.6875rem] text-stone group-open:inline">Close</span>
      </summary>

      <div className="border-t border-ink/8 p-4 sm:p-5">
        <ActionForm
          action={saveRow}
          hidden={{ __collection: collection.key, __id: row.id }}
          className="grid gap-5"
        >
          {collection.fields.map((field) => (
            <FieldControl key={field.name} field={field} value={row[field.name]} />
          ))}
          <div>
            <SubmitButton>Save {collection.singular}</SubmitButton>
          </div>
        </ActionForm>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
          <ActionForm
            action={reorderRow}
            hidden={{ __collection: collection.key, __id: row.id, __direction: 'up' }}
            quiet
          >
            <SubmitButton variant="secondary" pendingLabel="…">
              ↑ Move up
            </SubmitButton>
          </ActionForm>
          <ActionForm
            action={reorderRow}
            hidden={{ __collection: collection.key, __id: row.id, __direction: 'down' }}
            quiet
          >
            <SubmitButton variant="secondary" pendingLabel="…">
              ↓ Move down
            </SubmitButton>
          </ActionForm>
          <span className="text-[0.6875rem] text-stone">
            {index + 1} of {count}
          </span>

          <ActionForm
            action={deleteRow}
            hidden={{ __collection: collection.key, __id: row.id }}
            className="ml-auto"
          >
            <SubmitButton
              variant="danger"
              pendingLabel="Deleting…"
              confirm={`Delete this ${collection.singular}? This cannot be undone.`}
            >
              Delete
            </SubmitButton>
          </ActionForm>
        </div>
      </div>
    </details>
  );
}

/** The "add new" form: the same fields, with no id, behind a disclosure. */
export function NewRowEditor({ collection }: { collection: ClientCollection }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="adm-btn adm-btn-primary">
        + Add {collection.singular}
      </button>
    );
  }

  return (
    <div className="adm-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[0.875rem] font-medium">New {collection.singular}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[0.75rem] text-stone hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <ActionForm
        action={saveRow}
        hidden={{ __collection: collection.key, __id: '' }}
        className="grid gap-5"
      >
        {collection.fields.map((field) => (
          <FieldControl key={field.name} field={field} value={field.initial} />
        ))}
        <div>
          <SubmitButton pendingLabel="Adding…">Add {collection.singular}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
