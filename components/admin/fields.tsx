'use client';

import type { Field } from '@/lib/admin/collections';
import { ImageField } from './image-field';

/**
 * Renders one declared field. The switch here and the `coerce()` switch in
 * app/admin/actions.ts are the two halves of the same contract — a new `FieldType`
 * needs both.
 */
export function FieldControl({ field, value }: { field: Field; value: unknown }) {
  const id = `f-${field.name}`;

  if (field.type === 'image') {
    return (
      <ImageField
        name={field.name}
        label={field.label}
        help={field.help}
        defaultValue={typeof value === 'string' ? value : ''}
      />
    );
  }

  if (field.type === 'boolean') {
    const checked = value === true;
    return (
      <div>
        <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
          {/* Paired hidden input: an unticked checkbox posts nothing at all, so without
              this a form could never turn a boolean OFF. Both names are the same, and
              the action reads the LAST posted value — see normaliseSetting in
              app/admin/actions.ts for why `FormData.get()` is wrong here. */}
          <input type="hidden" name={field.name} value="false" />
          <input
            id={id}
            type="checkbox"
            name={field.name}
            value="on"
            defaultChecked={checked}
            className="mt-0.5 h-4 w-4 accent-[#b08d57]"
          />
          <span>
            <span className="text-[0.8125rem] font-medium">{field.label}</span>
            {field.help && <span className="adm-help !mt-0.5 block">{field.help}</span>}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label htmlFor={id} className="adm-label">
          {field.label}
        </label>
        <select
          id={id}
          name={field.name}
          defaultValue={typeof value === 'string' ? value : String(field.initial ?? '')}
          className="adm-select"
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {field.help && <p className="adm-help">{field.help}</p>}
      </div>
    );
  }

  if (field.type === 'textarea' || field.type === 'list') {
    const text =
      field.type === 'list'
        ? Array.isArray(value)
          ? value.join('\n')
          : ''
        : typeof value === 'string'
          ? value
          : '';
    return (
      <div>
        <label htmlFor={id} className="adm-label">
          {field.label}
          {field.required && <span className="ml-1 text-gold-dim">*</span>}
        </label>
        <textarea
          id={id}
          name={field.name}
          defaultValue={text}
          rows={field.type === 'list' ? 6 : 4}
          required={field.required}
          className="adm-textarea"
        />
        {field.help && <p className="adm-help">{field.help}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="adm-label">
        {field.label}
        {field.required && <span className="ml-1 text-gold-dim">*</span>}
      </label>
      <input
        id={id}
        type={field.type === 'number' ? 'number' : 'text'}
        name={field.name}
        defaultValue={
          typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : String(field.initial ?? '')
        }
        required={field.required}
        className="adm-input"
      />
      {field.help && <p className="adm-help">{field.help}</p>}
    </div>
  );
}
