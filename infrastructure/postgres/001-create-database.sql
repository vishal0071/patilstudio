-- ═══════════════════════════════════════════════════════════════════════════
--  Patil Studio — provision its database inside GalleryFlow's Postgres 17.
--  Run ONCE, by hand, as the superuser. This is not an init script: GalleryFlow's
--  infrastructure/postgres/init.sql only ever runs on FIRST initialization of the
--  data volume, so it cannot help an already-running production database.
--
--  How to run it (from the GalleryFlow repo root, stack up):
--
--    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
--      psql -U galleryflow -d postgres -v patil_password="$PATIL_DB_PASSWORD" \
--      < /opt/patilstudio/infrastructure/postgres/001-create-database.sql
--
--  The password is passed IN, never written into this file. This repository is
--  public, and a tracked file is exactly the wrong place for a live credential —
--  editing it locally and committing would publish the database password. So:
--
--    PATIL_DB_PASSWORD="$(openssl rand -base64 24)"; echo "$PATIL_DB_PASSWORD"
--
--  then invoke with -v (see below) and put the identical value in patilstudio/.env's
--  DATABASE_URL. If the variable is unset psql fails with a syntax error rather than
--  creating a role with a literal or empty password.
--
--  NOTE: `CREATE DATABASE` cannot run inside a transaction block, which is why
--  this file has no BEGIN/COMMIT. psql runs each statement autocommit.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. The role ────────────────────────────────────────────────────────────
-- No SUPERUSER, no CREATEDB, no CREATEROLE. It owns exactly one database and
-- can do nothing else on this server.
CREATE ROLE patilstudio WITH LOGIN PASSWORD :'patil_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

-- ── 2. The database ────────────────────────────────────────────────────────
-- Owned by that role, so Prisma migrations can create/alter its own tables. On
-- Postgres 15+ the `public` schema is owned by pg_database_owner, so the database
-- owner gets CREATE there without any extra grant.
CREATE DATABASE patilstudio WITH OWNER patilstudio ENCODING 'UTF8';

-- ── 3. Isolation — ONE-directional, and that is the direction that matters ──
-- Postgres grants CONNECT on every database to PUBLIC by default. Table data is
-- NOT readable that way (no privileges are granted to PUBLIC on tables), but the
-- catalog is — so without the first revoke below, this site's role could connect to
-- the SaaS database and enumerate every table and column name. Metadata, not
-- photographs, but there is no reason to allow it.
--
-- What this DOES achieve: patilstudio cannot connect to galleryflow. Verified.
--
-- What it does NOT achieve: the `galleryflow` role can still connect to
-- `patilstudio`, and no grant in this file changes that — the Postgres image creates
-- POSTGRES_USER as a SUPERUSER (`select rolsuper from pg_roles`), and a superuser
-- bypasses every privilege check. The second revoke below is therefore only
-- effective against non-superuser roles added later; it is kept because it costs
-- nothing and makes the intent explicit.
--
-- Demoting the galleryflow superuser is deliberately NOT attempted here: it owns the
-- SaaS schema, its migrations and its extensions, and breaking the product to
-- harden a marketing site's database is the wrong trade. Anything with superuser on
-- this server can reach every database on it, which was already true before this
-- file existed.
--
-- Revoking from PUBLIC does not lock out a database's OWNER — an owner's rights are
-- inherent to ownership, not stored ACL grants. Verified in step 4.
REVOKE CONNECT ON DATABASE galleryflow FROM PUBLIC;
GRANT CONNECT ON DATABASE galleryflow TO galleryflow;

REVOKE CONNECT ON DATABASE patilstudio FROM PUBLIC;
GRANT CONNECT ON DATABASE patilstudio TO patilstudio;

-- ── 4. Verify (run these by hand; they are not part of the script) ─────────
--
--   -- GalleryFlow still works:
--   docker compose exec postgres psql -U galleryflow -d galleryflow -c 'select 1'
--
--   -- The new role reaches its own database:
--   docker compose exec postgres psql -U patilstudio -d patilstudio -c 'select current_database()'
--
--   -- ...and is refused by the SaaS one. EXPECTED OUTPUT:
--   --   FATAL: permission denied for database "galleryflow"
--   --   DETAIL: User does not have CONNECT privilege.
--   docker compose exec postgres psql -U patilstudio -d galleryflow -c 'select 1'
--
--   -- The reverse is NOT blocked and is not expected to be — galleryflow is a
--   -- superuser, so this succeeds. See the note in step 3.
--   docker compose exec postgres psql -U galleryflow -d patilstudio -c 'select 1'
--
-- ── Rollback ──────────────────────────────────────────────────────────────
--   DROP DATABASE patilstudio;   -- destroys the site's data
--   DROP ROLE patilstudio;
--   GRANT CONNECT ON DATABASE galleryflow TO PUBLIC;   -- restores the default
