import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { uploadsDirectory } from '@/lib/admin/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serves the studio's uploaded photographs from `/media/<file>`.
 *
 * Why a route handler and not `public/uploads`: Next indexes `public` when it BUILDS,
 * so a file written at runtime is not in the static manifest and every request for it
 * 404s. Found the hard way — uploads succeeded, then could not be displayed. Keeping
 * the files outside `public` also means the volume is a plain data directory rather
 * than something a `docker compose up --build` can shadow.
 *
 * The path is validated, not trusted: only a single flat segment matching the
 * generated-filename pattern is served. Both `..` traversal and any nested path are
 * rejected before touching the filesystem, and `path.resolve` is checked to be inside
 * the upload directory as a second, independent guard.
 */

const FILENAME = /^[0-9a-f]{24}\.(jpg|png|webp|avif)$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // One segment only. A nested path is not something this route ever generates.
  if (segments.length !== 1 || !FILENAME.test(segments[0])) {
    return new NextResponse('Not found', { status: 404 });
  }

  const directory = uploadsDirectory();
  const filePath = path.resolve(directory, segments[0]);
  // Independent of the pattern check above: if resolution ever escapes, refuse.
  if (!filePath.startsWith(path.resolve(directory) + path.sep)) {
    return new NextResponse('Not found', { status: 404 });
  }

  let size: number;
  let modified: Date;
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) return new NextResponse('Not found', { status: 404 });
    size = stats.size;
    modified = stats.mtime;
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const extension = segments[0].split('.').pop() as string;
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      'content-type': CONTENT_TYPES[extension],
      'content-length': String(size),
      'last-modified': modified.toUTCString(),
      // Filenames are random and never reused, so a URL's bytes never change.
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
