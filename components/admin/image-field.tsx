'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

/**
 * The photograph field: a text input for the path, plus a real file upload.
 *
 * The text input is the source of truth and stays editable, so the studio can paste a
 * CDN URL instead of uploading if it ever moves its images off the box. Upload just
 * fills it in.
 *
 * Uploading is a plain `fetch` to /api/admin/upload rather than part of the form
 * submit: the form is a server action, and streaming a 6MB file through one to get a
 * path back — before the row is even saved — is the wrong shape.
 */
export function ImageField({
  name,
  defaultValue,
  label,
  help,
}: {
  name: string;
  defaultValue: string;
  label: string;
  help?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      const result = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !result.path) {
        setError(result.error ?? 'Upload failed.');
        return;
      }
      setValue(result.path);
    } catch {
      setError('Upload failed — could not reach the server.');
    } finally {
      setBusy(false);
      // Clear the picker so re-selecting the same file fires `change` again.
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <span className="adm-label">{label}</span>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ink/12 bg-ivory-dim">
          {value ? (
            // `unoptimized` because this is a 80px admin thumbnail of a file that may
            // have been uploaded seconds ago; running it through the optimiser here
            // buys nothing and fails noisily for an out-of-scope remote host.
            <Image src={value} alt="" fill sizes="80px" unoptimized className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-1 text-center text-[0.5rem] tracking-wider text-stone uppercase">
              Empty
            </span>
          )}
        </div>

        <div className="min-w-[14rem] flex-1">
          <input
            type="text"
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="/media/… or https://…"
            className="adm-input"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="adm-btn adm-btn-secondary"
            >
              {busy ? 'Uploading…' : 'Upload file'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => setValue('')}
                className="adm-btn adm-btn-secondary"
              >
                Clear
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </div>
          {error && <p className="mt-2 text-[0.6875rem] text-red-700">{error}</p>}
          {help && <p className="adm-help">{help}</p>}
        </div>
      </div>
    </div>
  );
}
