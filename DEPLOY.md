# Deploying patilstudio.in

Step-by-step, first deploy onwards. Every step has a verification, and the two that
can quietly go wrong — DNS before ACME, and a database nothing backs up — are called
out where they bite.

Assumes the GalleryFlow production stack is already serving `galleryflow.in` from
`/opt/galleryflow` on the same host.

**Build on the server, not on your laptop.** A Mac builds `linux-musl-arm64` Prisma
engines; if the VPS is x86_64 that image will not start. Every command below builds
on the host, which is correct either way. Never `docker save`/`docker load` the local
image across architectures.

---

## 0. Confirm you are on the right host, and that TLS is live

```bash
ssh <your-server>
cd /opt/galleryflow
grep -E '^(NODE_ENV|APP_DOMAIN|WEB_DOMAIN|ACME_EMAIL)=' .env
uname -m
```

Expect `NODE_ENV=production`, the `galleryflow.in` domains, and a non-empty
`ACME_EMAIL` — certificate issuance for the new domain uses that same ACME account,
so an empty value fails the whole step later.

Then prove the **production** Traefik config is the one running, because this site's
router labels use the `websecure` entrypoint and the `le` cert resolver, and neither
exists in the base (development) stack:

```bash
curl -sI https://galleryflow.in | head -3
docker network ls | grep galleryflow
```

Expect a `200`/`301` over real TLS, and a network named exactly
`galleryflow_galleryflow`. If the network has a different name, correct it in this
project's `docker-compose.yml` (two places: the label and the `networks:` block).

If `https://` does not work, you are running the base stack. Stop — bring the prod
overlay up first (`-f docker-compose.yml -f docker-compose.prod.yml`), or this site
will build fine and never be reachable.

---

## 1. Get the code onto the server

**Option A — rsync from your machine** (no git remote needed). Run this locally,
from the parent of the project directory:

```bash
rsync -av --delete \
  --exclude node_modules --exclude .next --exclude .env \
  --exclude '*.tsbuildinfo' --exclude next-env.d.ts --exclude .git \
  ~/Documents/Project/patilstudio/ <your-server>:/opt/patilstudio/
```

The excludes matter: `node_modules` from a Mac carries the wrong native binaries, and
shipping them makes the container build fail with a pnpm stack trace that names
nothing relevant. They mirror `.dockerignore`.

**Option B — git** (better once this changes more than once):

```bash
# locally, one time
cd ~/Documents/Project/patilstudio && git init && git add -A && git commit -m "init"
git remote add origin <your-remote> && git push -u origin main

# on the server
git clone <your-remote> /opt/patilstudio
```

Deliberately a **sibling** of `/opt/galleryflow`, not inside it — a separate project
with a separate deploy.

---

## 2. Provision the database

Once, and only once. This creates a `patilstudio` database and a non-superuser role
inside GalleryFlow's existing Postgres container.

```bash
cd /opt/patilstudio
openssl rand -base64 24          # copy the output
nano infrastructure/postgres/001-create-database.sql   # replace REPLACE_ME with it
```

Apply it **from the GalleryFlow directory**, because that is where the `postgres`
service is defined:

```bash
cd /opt/galleryflow
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U galleryflow -d postgres < /opt/patilstudio/infrastructure/postgres/001-create-database.sql
```

Expect exactly: `CREATE ROLE`, `CREATE DATABASE`, `REVOKE`, `GRANT`, `REVOKE`, `GRANT`.

**Verify — all four, before moving on.** The third must fail; that is the point.

```bash
cd /opt/galleryflow
C="docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres"

$C psql -U galleryflow -d galleryflow -tAc 'select 1'                    # 1
$C psql -U patilstudio -d patilstudio -tAc 'select current_database()'   # patilstudio
$C psql -U patilstudio -d galleryflow -tAc 'select 1'                    # must FAIL
```

The third is expected to print
`FATAL: permission denied for database "galleryflow"`. If it returns `1` instead, the
revoke did not apply and the site's role can read GalleryFlow's catalog — fix that
before continuing.

The first one succeeding is what proves the revoke did not lock GalleryFlow out of its
own database.

---

## 3. DNS — before you start the container

Both records, at your registrar or DNS host:

| Type | Name  | Value            |
| ---- | ----- | ---------------- |
| A    | `@`   | your server's IP |
| A    | `www` | your server's IP |

**Wait for them to resolve before step 5.** Certificates issue over HTTP-01 on port
80; if the name does not resolve when Traefik asks, issuance fails and Let's Encrypt
rate-limits repeated failures for hours.

```bash
dig +short patilstudio.in
dig +short www.patilstudio.in
```

Both must return your server's IP. Check from somewhere other than the server.

> **If patilstudio.in sits behind Cloudflare**, leave the record **DNS-only (grey
> cloud)** for the first deploy so HTTP-01 is unambiguous, and set SSL mode to
> Full (strict) before turning the proxy on. GalleryFlow's own Cloudflare notes are
> in `/opt/galleryflow/docs/cloudflare-cdn-plan.md`; HTTP-01 survives proxying, but
> `tlsChallenge` does not — do not switch to it.

---

## 4. Configure

```bash
cd /opt/patilstudio
cp .env.example .env
openssl rand -base64 24     # ADMIN_PASSWORD
openssl rand -base64 32     # ADMIN_SESSION_SECRET
nano .env
```

Four values must be right before the first start:

| Variable               | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| `SITE_DOMAIN`          | `patilstudio.in`                                            |
| `DATABASE_URL`         | the **same password** you put in the SQL in step 2          |
| `ADMIN_PASSWORD`       | the first `openssl` output — the owner's sign-in at `/admin` |
| `ADMIN_SESSION_SECRET` | the second — lets the password rotate independently         |

URL-encode the database password if it contains `@ : / ? #` or `%`. A raw `@`
truncates the host and the error points somewhere unhelpful.

**With `ADMIN_PASSWORD` unset the panel refuses every sign-in** rather than falling
open, so a forgotten value is a locked panel, not an exposed one. That is the safe
failure, but it does mean the studio cannot edit anything until it is set.

`TRUSTED_PROXY_HOPS` stays at `1` — Traefik is the only proxy today. **Raise it to 2
the day Cloudflare goes in front of Traefik**, or every visitor resolves to the
Cloudflare edge address, they all share one rate-limit bucket, and five enquiries
throttle the whole site. That failure is silent.

Optional: `RESEND_API_KEY` / `INQUIRY_NOTIFY_TO` / `INQUIRY_NOTIFY_FROM` add an email
per enquiry. Unset, each enquiry is still written to Postgres and readable at
`/admin/inquiries`, and logged as one greppable line — so this can wait.

```bash
grep -c REPLACE_ME .env      # must print 0
grep -E '^(ADMIN_PASSWORD|SITE_DOMAIN)=' .env | grep -v '=$'   # both must appear
```

## 5. Build and start

```bash
cd /opt/patilstudio
docker compose up -d --build
```

First build pulls the Node image and installs dependencies — a few minutes. Then:

```bash
docker compose logs -f site
```

You are looking for, in order: `2 migrations found`, both
`20260819000000_init` and `20260819120000_cms` applied,
`All migrations have been successfully applied`, then `✓ Ready`. Ctrl-C to stop
following; the container keeps running.

**Never use `docker compose down -v` on this project.** The `-v` destroys the
`patil_uploads` volume, which is the studio's entire photograph library — the only
data this container owns that is not in Postgres. A plain `up -d --build` is safe and
preserves it; that is the normal way to deploy a change.

**No GalleryFlow restart is needed.** Traefik watches the Docker socket and picks up
the new container within seconds.

---

## 6. Verify from outside the server

Do this from your laptop, not over SSH — half of what you are testing is DNS and TLS.

```bash
curl -sI https://patilstudio.in | head -3          # 200, valid certificate
curl -s  https://patilstudio.in/api/health         # {"status":"ok"}
curl -sI http://patilstudio.in | head -3           # 301 -> https
curl -sI https://www.patilstudio.in | head -3      # 200
curl -s  https://patilstudio.in/robots.txt         # names the sitemap
```

**Confirm the admin panel is shut to strangers**, since it is one password and it is
now on the public internet:

```bash
curl -sI https://patilstudio.in/admin | head -3    # redirect to /admin/login
```

It must **not** return the panel. Then sign in at
`https://patilstudio.in/admin/login` in a browser with the password from step 4 and
confirm a wrong password is refused.

Then open the site and submit the enquiry form once. Confirm the row landed:

```bash
cd /opt/galleryflow
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U patilstudio -d patilstudio -c 'select name, email, "createdAt" from "Inquiry" order by "createdAt" desc limit 5;'
```

**And confirm you did not break the SaaS** — the two things this deploy touched that
GalleryFlow also uses are Traefik and Postgres:

```bash
curl -sI https://galleryflow.in     | head -2
curl -sI https://app.galleryflow.in | head -2
curl -s  https://api.galleryflow.in/health
```

---

## 6b. First-run content and photographs

The site renders a finished page immediately from `lib/content/defaults.ts`, so
nothing here is blocking — but until you do it, the content is the defaults rather
than editable rows.

1. Sign in at `/admin`, press **Load starter content**. That copies the defaults into
   `SiteSetting` and collection rows so they can be edited.
2. Upload photographs — either in the panel, or in bulk with the import script:

   ```bash
   cd /opt/patilstudio
   docker compose exec site node scripts/import-photos.mjs --help
   ```

3. Confirm an uploaded photograph is actually served, because this is the path that
   depends on the volume being mounted:

   ```bash
   curl -sI https://patilstudio.in/media/<uploaded-file-name> | head -3
   ```

   A `200` with an image `Content-Type` means the volume, the upload directory and
   the media route all line up. A `404` means `UPLOAD_DIR` and the mount disagree.

## 7. Back up the database **and the photograph volume**

Two separate things live outside GalleryFlow's existing backup, and neither is covered
today.

### The database

`/opt/galleryflow/scripts/backup-db.sh` runs `pg_dump … "$PG_DB"` — a **single**
database. A `patilstudio` database that nothing dumps looks backed up, because the
nightly job keeps succeeding.

**A — one line in the existing script** (one schedule, one retention policy). After
the existing `pg_dump` line in `scripts/backup-db.sh`:

```bash
docker compose exec -T postgres pg_dump -U "$PG_USER" patilstudio \
  | gzip -c > "${FILE%.sql.gz}-patilstudio.sql.gz"
```

**B — leave GalleryFlow's script alone**, and add a separate cron entry:

```bash
cd /opt/galleryflow && docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec -T postgres pg_dump -U galleryflow patilstudio | gzip -c \
  > /opt/patilstudio/backups/patilstudio-$(date +%F).sql.gz
```

### The photographs — this is the one that hurts

The `patil_uploads` volume holds every uploaded photograph. **It is not in Postgres,
so no database dump contains it**, and a dump alone would restore a site whose every
image is a broken link.

```bash
mkdir -p /opt/patilstudio/backups
docker run --rm \
  -v patil_uploads:/data:ro \
  -v /opt/patilstudio/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
ls -lh /opt/patilstudio/backups/ | tail -3
```

Restore is the same command inverted (`tar xzf` into a writable `-v patil_uploads:/data`).

**Restore both once, into a throwaway, before you trust either.** A dump that has
never been restored is a belief, not a backup — and check the sizes: a truncated
archive is worse than none, because it looks like one.

## Updating the site later

```bash
cd /opt/patilstudio
git pull                     # or re-run the rsync from step 1
docker compose up -d --build
```

Migrations apply on boot, and the `patil_uploads` volume survives — so a rebuild never
touches the photograph library. There is a few-seconds gap while the container
restarts; this is a marketing site, so that is acceptable. Add a second replica only if
it stops being.

Two things need a **rebuild**, not just a restart, because Next reads them at build
time: `IMAGE_CDN_HOSTS` (it becomes `images.remotePatterns`) and anything in the CSP in
`next.config.ts`. `up -d --build` covers both. Everything else in `.env` is read at
runtime, so `docker compose up -d` is enough.

---

## When something goes wrong

| Symptom                                | Cause                                                     | Fix                                                                                            |
| -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Browser shows Traefik's default cert   | DNS was not resolving when ACME ran                       | Fix DNS, then `docker compose -p galleryflow logs traefik \| grep -i acme` and restart Traefik |
| `404 page not found` from Traefik      | Router label not picked up, or wrong entrypoint           | `docker compose -p galleryflow logs traefik \| tail -50`; confirm the prod stack is running   |
| `502 Bad Gateway`                      | Traefik dialled the wrong network                         | Confirm `traefik.docker.network=galleryflow_galleryflow` and that the container is on it       |
| Container restart-loops at boot        | `migrate deploy` cannot reach Postgres, or wrong password | `docker compose logs site`; re-check `DATABASE_URL` and URL-encoding                            |
| `Cannot find module '@prisma/engines'` | Built without `pnpm-workspace.yaml`                       | Confirm it reached the server (it carries `nodeLinker: hoisted`), rebuild with `--no-cache`     |
| Site up, enquiry form returns 500      | Migrations did not run, or the role lacks rights          | `docker compose logs site`; re-run step 2's verification queries                               |
| `/admin/login` refuses the right password | `ADMIN_PASSWORD` empty or not reaching the container   | `docker compose exec site printenv ADMIN_PASSWORD`; it must be non-empty                       |
| Uploads fail, or `/media/<file>` 404s  | `UPLOAD_DIR` and the volume mount disagree                | Both must be `/app/uploads`: `docker compose exec site sh -c 'printenv UPLOAD_DIR; ls /app/uploads'` |
| Enquiry form 429s for everyone         | `TRUSTED_PROXY_HOPS` too low for the proxy chain          | 1 for Traefik alone, 2 behind Cloudflare; then `up -d`                                          |
| Photographs vanished after a deploy    | `docker compose down -v` destroyed `patil_uploads`        | Restore the uploads tarball from step 7. This is why that backup exists                        |

---

## Rollback

Nothing here touches GalleryFlow's data, so rollback is local to this site.

```bash
cd /opt/patilstudio
docker compose down          # site off; database AND photographs intact
```

**Never add `-v`.** It deletes the `patil_uploads` volume — every uploaded
photograph, unrecoverable except from the step 7 tarball.

To revert to the previous version of the code:

```bash
git log --oneline -5
git checkout <previous-commit>
docker compose up -d --build
```

Note that a **migration is not rolled back** by checking out older code. Both current
migrations are additive (they create tables), so older code runs fine against the newer
schema — but if you ever add a destructive migration, plan its reversal before
deploying it, not after.

To remove the site entirely, including its data, the `DROP` statements are at the
bottom of `infrastructure/postgres/001-create-database.sql`, and the volume goes with
`docker volume rm patil_uploads`. Note the last SQL statement restores Postgres's
default `CONNECT` grant on the GalleryFlow database.
