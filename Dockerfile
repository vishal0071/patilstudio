# syntax=docker/dockerfile:1
#
# Patil Studio site. Standalone Next.js build — this project is NOT part of the
# GalleryFlow pnpm workspace, so there is no `turbo prune` stage and nothing here
# can drag a GalleryFlow package in.
#
# Four stages: dev-dependency install, build, production-dependency install, runtime.
# The separate production install exists because the runtime needs the Prisma CLI
# (the entrypoint applies migrations), and the CLI is not something Next's file
# tracing can find — nothing imports it. Copying it piecemeal out of the builder
# fails on its transitive dependencies one at a time (@prisma/engines, then
# @prisma/config, then `effect`, …), so the runtime gets one complete,
# self-consistent production tree instead.

FROM node:22-alpine AS base
# libc6-compat for Next's native bits; openssl is required by Prisma's engines.
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
WORKDIR /app

# ── Dependencies (including dev — needed to build) ───────────────
FROM base AS deps
# pnpm-workspace.yaml carries `nodeLinker: hoisted` and `allowBuilds`. Omit it and
# Prisma's postinstall is skipped, so no query engine is downloaded and the site
# fails at runtime rather than here.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile

# ── Build ────────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# `images.remotePatterns` in next.config.ts is evaluated during the build, so an image
# CDN host must be present here and not only in the runtime environment.
ARG IMAGE_CDN_HOSTS=""
ENV IMAGE_CDN_HOSTS=$IMAGE_CDN_HOSTS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `build` runs `prisma generate` first (see package.json) so the client exists
# before Next type-checks the route handler that imports it.
RUN pnpm build
# Drop the node_modules that Next traced into the standalone output. The runtime
# gets the complete production tree below instead, and shipping both put the same
# ~150MB of `next` into two layers — which is why this image was 1.11GB. Nothing is
# lost: server.js resolves `next` and `@prisma/client` from /app/node_modules.
RUN rm -rf .next/standalone/node_modules

# ── Production dependencies + generated client ───────────────────
FROM base AS proddeps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
# `prisma` is a real dependency here, not a devDependency, precisely so this
# --prod install includes the CLI the entrypoint needs.
RUN pnpm install --prod --no-frozen-lockfile
COPY prisma ./prisma
RUN node node_modules/prisma/build/index.js generate
# `prisma generate` leaves a third copy of the 15MB query engine in the CLI's own
# directory. The client loads it from .prisma/client and the CLI from
# @prisma/engines; this one is read by neither.
RUN rm -f node_modules/prisma/libquery_engine-*

# ── Runtime ──────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Replaces the node_modules that came inside .next/standalone with the full
# production tree. Order matters: this line must come AFTER the standalone copy.
COPY --from=proddeps --chown=nextjs:nodejs /app/node_modules ./node_modules
# The schema, so `migrate deploy` has migrations to apply.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Uploaded photographs. Created here, owned by the runtime user, because Docker copies
# the image directory's ownership into a fresh named volume — create it at runtime
# instead and the volume arrives root-owned, so every upload fails with EACCES.
ENV UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
