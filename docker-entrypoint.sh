#!/bin/sh
# Patil Studio container entrypoint. Applies pending Prisma migrations before the
# server starts, so a deploy is self-provisioning against its own database.
#
#   RUN_MIGRATIONS=false   skip `prisma migrate deploy`
#
# This runs against the `patilstudio` database only — the DATABASE_URL role has no
# rights on `galleryflow`, so a migration here cannot touch the SaaS schema.
#
# If Postgres is not up yet the deploy fails and the container exits; `restart:
# unless-stopped` retries. That is deliberate — a site serving pages against a
# schema it has not migrated is worse than a container that visibly restarts.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
  node node_modules/prisma/build/index.js migrate deploy
fi

echo "[entrypoint] Starting Patil Studio site..."
exec "$@"
