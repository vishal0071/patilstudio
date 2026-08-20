# uploads

Photographs uploaded through the admin panel are stored here and served back at
`/media/<name>` by [app/media/[...path]/route.ts](../app/media).

**Not under `public/`, on purpose.** Next indexes `public` when it builds, so a file
written there at runtime is never served — the upload succeeds and then 404s. The
Dockerfile also copies `public` into the runtime image, which would shadow a bind mount
over it.

**In production this is a Docker volume** (`patil_uploads`, mounted at `/app/uploads`).
Without it every upload is destroyed by the next `docker compose up --build`.

Files are written by [app/api/admin/upload/route.ts](../app/api/admin/upload/route.ts)
with generated 24-hex-character names and a fixed extension allow-list; nothing the
browser sends is used to build the path. Set `UPLOAD_DIR` to move the directory.

Photographs are data, not source — the directory and this README are tracked, the
images are not.
