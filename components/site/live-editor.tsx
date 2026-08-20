'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * On-page editing for a signed-in admin.
 *
 * Toggle edit mode and every CMS-backed string on the page becomes directly editable
 * where it sits, in its real typeface at its real size; every photograph gets a Replace
 * control. That is the point — a photographer judging a headline needs to see it in
 * Cormorant at 7rem over their own photograph, not in a textarea in a side panel.
 *
 * Mounted only when the session cookie is valid (the layout decides), so a visitor is
 * served none of this. The `data-edit` attributes themselves are in the HTML for
 * everyone, which keeps the markup identical and cacheable; they are inert without the
 * script, and /api/admin/inline re-checks the session and allow-lists every field name
 * before anything reaches the database.
 *
 * Implementation notes worth keeping:
 *
 *   - `contentEditable` is applied through the DOM, never as a JSX prop. These elements
 *     belong to server components; React does not own their children, so it will not
 *     fight the browser over them, and a `router.refresh()` replaces them wholesale with
 *     the freshly rendered server output.
 *   - `plaintext-only` keeps pasted rich text from injecting markup into a heading.
 *   - Clicks are swallowed while editing. Half of these fields sit inside `<a>` — the
 *     hero CTAs, every service card — and without this, clicking to place the caret
 *     navigates away and loses the edit.
 */

type Pending = Map<string, string>;

export function LiveEditor() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pending = useRef<Pending>(new Map());
  const originals = useRef<Map<string, string>>(new Map());
  const fileInput = useRef<HTMLInputElement>(null);
  const imageTarget = useRef<string | null>(null);

  const bump = () => setDirtyCount(pending.current.size);

  /* ── Text fields ─────────────────────────────────────────────── */

  // Drives the CSS in globals.css that reveals the Replace controls and the frame
  // outlines. One class on <body> rather than a prop threaded through forty sections.
  useEffect(() => {
    document.body.classList.toggle('editing', editing);
    return () => document.body.classList.remove('editing');
  }, [editing]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-edit]'));

    if (!editing) {
      for (const node of nodes) {
        node.removeAttribute('contenteditable');
        node.removeAttribute('data-edit-on');
      }
      return;
    }

    for (const node of nodes) {
      const field = node.dataset.edit;
      if (!field) continue;
      if (!originals.current.has(field)) {
        originals.current.set(field, node.innerText);
      }
      node.setAttribute('contenteditable', 'plaintext-only');
      node.setAttribute('data-edit-on', '');
      node.spellcheck = false;
    }

    const onInput = (event: Event) => {
      const node = (event.target as HTMLElement).closest?.('[data-edit]') as HTMLElement | null;
      const field = node?.dataset.edit;
      if (!node || !field) return;
      const value = node.innerText;
      if (value === originals.current.get(field)) pending.current.delete(field);
      else pending.current.set(field, value);
      bump();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const node = (event.target as HTMLElement).closest?.('[data-edit]') as HTMLElement | null;
      if (!node) return;
      if (event.key === 'Escape') {
        // Revert this one field and let go of it.
        const field = node.dataset.edit;
        if (field && originals.current.has(field)) {
          node.innerText = originals.current.get(field) as string;
          pending.current.delete(field);
          bump();
        }
        node.blur();
        return;
      }
      // Enter commits a single-line field rather than injecting a line break into a
      // heading. Fields marked multiline (about copy, FAQ answers) keep normal Enter.
      if (event.key === 'Enter' && !node.hasAttribute('data-edit-multiline')) {
        event.preventDefault();
        node.blur();
      }
    };

    // Capture phase, so it runs before the anchor's own navigation.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-editor-ui]')) return;
      if (target.closest('[data-edit],[data-edit-image]')) {
        event.preventDefault();
        event.stopPropagation();
        const node = target.closest('[data-edit]') as HTMLElement | null;
        node?.focus();
      }
    };

    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('input', onInput);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick, true);
    };
  }, [editing]);

  /* ── Photographs ─────────────────────────────────────────────── */

  const replaceImage = useCallback(async (file: File) => {
    const field = imageTarget.current;
    if (!field) return;
    setStatus('Uploading…');

    const body = new FormData();
    body.set('file', file);
    const upload = await fetch('/api/admin/upload', { method: 'POST', body });
    const result = (await upload.json()) as { path?: string; error?: string };
    if (!upload.ok || !result.path) {
      setStatus(result.error ?? 'Upload failed.');
      return;
    }

    // Photographs save immediately rather than joining the pending batch: the file is
    // already on the server, and a visible new frame that is somehow "unsaved" is a
    // confusing state to leave someone in.
    const save = await fetch('/api/admin/inline', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ edits: [{ field, value: result.path }] }),
    });
    if (!save.ok) {
      const body = (await save.json()) as { error?: string };
      setStatus(body.error ?? 'Could not save the photograph.');
      return;
    }

    setStatus('Photograph replaced.');
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!editing) return;

    const onImageClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest?.('[data-edit-replace]') as
        | HTMLElement
        | null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const frame = button.closest('[data-edit-image]') as HTMLElement | null;
      imageTarget.current = frame?.dataset.editImage ?? null;
      fileInput.current?.click();
    };

    document.addEventListener('click', onImageClick, true);
    return () => document.removeEventListener('click', onImageClick, true);
  }, [editing]);

  /* ── Save / discard ──────────────────────────────────────────── */

  const save = async () => {
    if (pending.current.size === 0) return;
    setSaving(true);
    setStatus(null);

    const edits = Array.from(pending.current, ([field, value]) => ({ field, value }));
    try {
      const response = await fetch('/api/admin/inline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ edits }),
      });
      const body = (await response.json()) as { error?: string; saved?: number };
      if (!response.ok) {
        setStatus(body.error ?? 'Could not save.');
        return;
      }
      // Only clear the pending set once the server has confirmed, so a failed save keeps
      // the studio's words on screen instead of silently dropping them.
      pending.current.clear();
      originals.current.clear();
      bump();
      setStatus(`Saved ${body.saved ?? edits.length} change${body.saved === 1 ? '' : 's'}.`);
      router.refresh();
    } catch {
      setStatus('Could not reach the server. Your changes are still on screen.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    for (const [field, original] of originals.current) {
      const node = document.querySelector<HTMLElement>(`[data-edit="${cssEscape(field)}"]`);
      if (node && pending.current.has(field)) node.innerText = original;
    }
    pending.current.clear();
    originals.current.clear();
    bump();
    setStatus('Changes discarded.');
  };

  // Leaving with unsaved text is almost always an accident.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <>
      <div
        data-editor-ui=""
        /* Clears the sticky mobile CTA bar (56px + safe area) below `lg`, and sits above
           everything of ours. It cannot outrank Next's dev indicator, which renders in a
           shadow root at a far higher z-index — that badge is moved to the opposite
           corner in next.config.ts instead. */
        className="no-print fixed bottom-24 left-4 z-[90] flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 border border-gold/50 bg-ink/95 px-3 py-2.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.75)] backdrop-blur-xl lg:bottom-6 lg:left-6"
      >
        <span className="mr-1 text-[0.5625rem] tracking-[0.22em] text-gold uppercase">
          Studio
        </span>

        <button
          type="button"
          onClick={() => {
            if (editing && dirtyCount > 0) discard();
            setEditing((on) => !on);
          }}
          className={`px-3 py-2 text-[0.65rem] tracking-[0.14em] uppercase transition-colors ${
            editing ? 'bg-gold text-ink' : 'bg-ivory text-ink hover:bg-white'
          }`}
        >
          {editing ? 'Editing' : 'Edit page'}
        </button>

        {editing && (
          <>
            <button
              type="button"
              onClick={save}
              disabled={dirtyCount === 0 || saving}
              className="bg-ivory px-3 py-2 text-[0.65rem] tracking-[0.14em] text-ink uppercase disabled:opacity-40"
            >
              {saving ? 'Saving…' : dirtyCount > 0 ? `Save ${dirtyCount}` : 'Saved'}
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={dirtyCount === 0 || saving}
              className="px-3 py-2 text-[0.65rem] tracking-[0.14em] text-ivory/60 uppercase hover:text-ivory disabled:opacity-30"
            >
              Discard
            </button>
          </>
        )}

        <a
          href="/admin"
          className="px-2 py-2 text-[0.65rem] tracking-[0.14em] text-ivory/50 uppercase hover:text-ivory"
        >
          Panel
        </a>

        {status && (
          <span role="status" className="w-full text-[0.6875rem] text-gold-soft">
            {status}
          </span>
        )}
      </div>

      {editing && (
        <p
          data-editor-ui=""
          className="no-print fixed top-24 left-4 z-[90] max-w-[16rem] border border-gold/25 bg-ink/90 px-3 py-2 text-[0.625rem] leading-relaxed text-ivory/60 backdrop-blur-xl lg:left-6"
        >
          Click any text to edit it. Enter commits, Escape reverts that field. Hover a
          photograph for Replace. Nothing is written until you press Save.
        </p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceImage(file);
          event.target.value = '';
        }}
      />
    </>
  );
}

/** Field names contain dots and colons — both meaningful inside a CSS selector. */
function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value;
}
