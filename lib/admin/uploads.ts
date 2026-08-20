import path from 'node:path';

/**
 * Where uploaded photographs live on disk.
 *
 * Deliberately NOT under `public/`. Next indexes `public` at build time, so a file
 * written there at runtime is never served — and a bind mount over `public` would also
 * be shadowed by `COPY --from=builder /app/public` in the Dockerfile. This directory is
 * a plain Docker volume, and [app/media/[...path]/route.ts](../../app/media) serves it.
 *
 * Override with UPLOAD_DIR if the volume is mounted somewhere else.
 */
export function uploadsDirectory(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), 'uploads');
}

/** Public URL for a stored file. Must match the route's own filename pattern. */
export function mediaUrl(filename: string): string {
  return `/media/${filename}`;
}
