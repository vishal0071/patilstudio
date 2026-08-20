import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { hasSession } from '@/lib/admin/auth';
import { mediaUrl, uploadsDirectory } from '@/lib/admin/uploads';
import { sniffImageFormat } from '@/lib/image-sniff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Photograph upload for the admin panel.
 *
 * Files land in the upload directory (a Docker volume — see docker-compose.yml) and are
 * served back by app/media/[...path]/route.ts. Without that volume every upload would be
 * erased by the next `docker compose up --build`, which is the kind of data loss only
 * discovered months later. See lib/admin/uploads.ts for why the directory is not under
 * `public/`.
 *
 * This is an authenticated write to the filesystem, so it is narrow on purpose:
 *
 *  - Session required. No session, no write, and the 401 says nothing else.
 *  - The extension comes from the file's ACTUAL magic bytes, never from the client's
 *    filename and never from the `Content-Type` it claims — that header is caller-supplied,
 *    so keying the allow-list off it let any bytes be stored as `.png`. SVG is deliberately
 *    unsupported: it is a document that can carry script, served from this site's origin.
 *  - The filename is generated, so a caller cannot traverse out of the directory or
 *    overwrite an existing file by guessing its name.
 *  - 12MB cap, checked before the bytes are buffered.
 *
 * An image CDN would be the better long-term home for these; `next.config.ts` already
 * reads an allow-list of remote hosts, and the admin field accepts an absolute URL, so
 * moving to one needs no change here.
 */

const MAX_BYTES = 12 * 1024 * 1024;

/** Only for the friendlier error message; the stored extension comes from the bytes. */
const CLAIMED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function POST(request: Request) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Malformed upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 12MB.` },
      { status: 413 },
    );
  }

  if (!CLAIMED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP and AVIF images can be uploaded.' },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffImageFormat(bytes);
  if (!extension) {
    // Claimed an image type but the bytes say otherwise.
    return NextResponse.json(
      { error: 'That file is not a JPEG, PNG, WebP or AVIF image.' },
      { status: 415 },
    );
  }

  // Generated name, so nothing the client sent reaches the filesystem path. 24 hex
  // characters, which is the pattern the media route validates against.
  const name = `${randomBytes(12).toString('hex')}.${extension}`;
  const directory = uploadsDirectory();

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), bytes);
  } catch (error) {
    console.error('[admin] upload failed to write', error);
    return NextResponse.json(
      { error: 'Could not save the file on the server. Check the uploads volume.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ path: mediaUrl(name) }, { status: 201 });
}
