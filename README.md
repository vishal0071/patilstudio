# Ganesh Patil Photography — patilstudio.in

Public website for **Ganesh Patil Photography**, a wedding photography and
cinematography studio in Pune. A **separate project** from GalleryFlow: its own
repo-able folder, its own dependencies, its own database, its own deploy. It shares
exactly two things with the SaaS, both on purpose:

1. **The server and its Traefik instance** — Traefik routes by `Host` header, so one
   IP serves `galleryflow.in`, `app.`, `api.` and `patilstudio.in` on :443.
2. **The Postgres 17 engine** — but a different database (`patilstudio`) and a
   different role, which is refused `CONNECT` on `galleryflow` (verified). Note the
   asymmetry: GalleryFlow's own role is a Postgres **superuser**, so it can still
   reach this database. That is inherent to superuser and not worth breaking the
   SaaS to change — see the note in
   [001-create-database.sql](infrastructure/postgres/001-create-database.sql).

It is **not** a white-label GalleryFlow tenant. `StudioSettings.customDomain` exists
in the SaaS schema but nothing reads it for routing; if you later want
`patilstudio.in` to serve that studio's actual galleries, that is a feature in
GalleryFlow, not this project.

## Stack

Next.js 15 (App Router, standalone output) · React 19 · Tailwind v4 (CSS-first, no
`tailwind.config`) · Prisma 6 → Postgres. Deliberately mirrors GalleryFlow's
conventions so both feel the same to work in. Port **3002** (3000 = marketing,
3001 = studio app, 4000 = API are taken).

**No runtime dependencies beyond that list.** No animation library (CSS + one small
IntersectionObserver), no icon package (fourteen inline SVGs), no carousel library
(native scroll-snap), no mail library (Resend's HTTP API over `fetch`), no auth library
(one signed cookie). Fonts are checked into the repo and self-hosted, so the Docker
build needs no network and the CSP names no third-party origin.

## The site

One long home page plus two real routes, all under `app/(site)/`:

| Route | What it is |
| --- | --- |
| `/` | Hero → stats → about → services → portfolio edit → wedding story → packages → comparison → why us → process → testimonials → film → Instagram → FAQ → enquiry |
| `/portfolio` | The full gallery, filterable, dark ground |
| `/services/<slug>` | One page per service — this is what ranks for "pre wedding photographer Pune", not a home-page anchor |
| `/admin` | The studio's CMS (see below) |

Sections are server components fed by a single `getContent()` read. The only JavaScript
that ships is the navigation, the gallery lightbox, the testimonial carousel, the video
modal, the enquiry form, the admin panel, and a ~1KB scroll-reveal engine
([components/ui/reveal-engine.tsx](components/ui/reveal-engine.tsx)) that lets forty
animated sections stay server-rendered.

## Photographs: nothing is invented

**The site ships with no photographs, on purpose.** Only the studio's own authorized
work may appear here, and this repository has none of it — so every frame renders a
designed, clearly-labelled placeholder carrying art direction for whoever fills it
([components/ui/frame.tsx](components/ui/frame.tsx)). Stock photography is never
substituted, because presenting it as the studio's work would misrepresent the studio.

The same rule runs through the copy:

- **Prices** are `₹XX,XXX` and each card says *"Placeholder — not a quote"* until the
  studio clears `pricePending`.
- **Testimonials** are flagged `isPlaceholder`, labelled as such on the page, and
  excluded from the `Review` structured data — publishing invented ratings to Google is
  both dishonest and a manual-action risk.
- **Statistics** ("500+ moments captured") carry a *"awaiting the studio's
  confirmation"* note until `stats.confirmed` is set.
- **Contact details** are `+91 00000 00000` and say so until `contact.detailsConfirmed`
  is set. A placeholder number that looks real is worse than one that admits it.
- **The Instagram grid is admin-managed, not scraped.** Pulling the public profile
  without the account owner's own API token is against Instagram's terms and
  re-publishes images this site has no licence for.
- **No superlatives.** "Best wedding photographer in Pune" is a keyword to rank for,
  not a claim to print unverified.

`/admin` opens on a launch checklist of exactly what is still outstanding.

## Content & the admin panel

Every string, photograph, price, package, testimonial, FAQ and SEO field is editable at
`/admin` — nothing on the public site is hard-coded.

Three pieces:

- **[lib/content/settings.ts](lib/content/settings.ts)** — one flat, dotted-key
  namespace (`hero.line1`, `contact.whatsapp`, `seo.description`, …) stored in
  `SiteSetting`. Flat because the owner will want to change wording nobody anticipated,
  and that should be a line in this file plus a row, not an `ALTER TABLE`. The admin
  form is generated from it, so a new key appears in the panel automatically.
- **[lib/admin/collections.ts](lib/admin/collections.ts)** — nine collections (services,
  portfolio, packages, comparison, testimonials, story, films, FAQ, Instagram) declared
  as field lists. One generic editor renders and saves all nine; adding a field is a
  line here.
- **[lib/content/defaults.ts](lib/content/defaults.ts)** — the complete seed content the
  site falls back to for any collection still empty, so it renders a finished page from
  the first boot. "Load starter content" in the panel copies it into editable rows.

### Live editing on the page

**Sign in at `/admin/login` in the browser first** — the toolbar keys off the session
cookie, so it is invisible until you have one. `/admin` then carries an **Edit the live
page** card, and the sidebar an **Edit live page** link, because a floating toolbar is only
discoverable if you already know it is there.

Signed in, the public site itself becomes the editor. A **Studio** toolbar appears bottom
left; press **Edit page** and every CMS-backed string on the page is directly editable
where it sits, and every photograph grows a **Replace** control. 113 text fields and 35
photographs on the home page.

That is the point of it: judging a headline means seeing it in Cormorant at 7rem over the
actual photograph, not in a textarea in a side panel. Text edits batch up (`Save 3`) and
write in one transaction; a replaced photograph saves immediately, because the file is
already on the server and a visibly-changed frame that is somehow "unsaved" is a confusing
state to leave someone in. Enter commits a field, Escape reverts that one field, Discard
rolls back everything pending, and closing the tab with unsaved text warns first.

Everything else — publishing, ordering, prices, SEO, deleting rows, enquiries — stays in
`/admin`, which is the right place for it.

How it hangs together:

- **[lib/edit.ts](lib/edit.ts)** addresses fields as `settings:hero.line1` or
  `services:<uuid>:title`, and `editable()` returns props to **spread onto the element that
  already exists**. No wrapper: a wrapper would change the layout and typography of the
  very thing being judged.
- **[live-editor.tsx](components/site/live-editor.tsx)** is served only when the session
  cookie is valid. The `data-edit` attributes are in the HTML for everyone, so the markup
  stays identical and cacheable — they are inert without the script.
- **[/api/admin/inline](app/api/admin/inline/route.ts)** is the security boundary, and it
  is an allow-list: a field name arriving from a browser is checked against
  `settingDefaults` and the collections' own declared field lists, and only `text`,
  `textarea`, `list` and `image` types pass. An inline edit therefore *cannot* reach
  `published`, `sortOrder` or `pricePending` — they are booleans and numbers, so they are
  not in the list. Verified by trying each one.

Auth is one password (`ADMIN_PASSWORD`) and a signed cookie — no user table, no reset
flow. Deliberate: there is one editor, and a users/roles system for an audience of one
is more code to get wrong than it protects. **With `ADMIN_PASSWORD` unset the panel
refuses every sign-in rather than falling open.**

Photograph uploads go to `/app/uploads` (a Docker volume) and are served at
`/media/<name>` — see [uploads/README.md](uploads/README.md) for why that is not
`public/uploads`.

## 3D and motion

The site uses real 3D — CSS `perspective`, `rotateX/Y`, `translateZ` — not WebGL. Nothing
here loads a 3D library and every effect is a transform on the compositor, so the cost does
not show up in the bundle: First Load JS is **103 kB shared / 189 kB on the home page**,
unchanged from before the 3D was added.

| Effect | Where | Driven by |
| --- | --- | --- |
| Perspective reveal | every section | the existing IntersectionObserver + CSS transition |
| Cursor tilt (±5°), label lifting off the card on Z | service, portfolio and package cards | [tilt-engine.tsx](components/ui/tilt-engine.tsx) — one delegated listener, one rAF per frame |
| Hero photograph tipping back and receding | hero | CSS `animation-timeline: view()` — no JS |
| Coverflow turn (±15°) as panels cross the track | wedding story | CSS `animation-timeline: view(inline)` — no JS |
| Opens forward out of depth | lightbox | CSS keyframes |

Four rules hold it together, and breaking any of them is how this turns tacky:

- **Nothing exceeds 15°, and cards stay at 5°.** Past roughly 8° on a card, text visibly
  keystones and starts to read as a slideshow transition rather than a surface.
- **Scroll-driven effects sit behind `@supports (animation-timeline: view())`.** A browser
  without it gets the static layout, not a broken one — none of this is load-bearing for
  legibility.
- **Tilt is gated on `(hover: hover) and (pointer: fine)`, not screen width.** A touch
  device has no hover state to tilt toward and a tilt-on-tap fights the scroll gesture.
  Verified inert under touch emulation; the scroll-driven effects still run there.
- **`prefers-reduced-motion` zeroes all of it** — transforms *and* animations, which is why
  that block lists the 3D selectors explicitly. A `transform: none` alone would leave the
  scroll-timeline animations running.

Two implementation traps, both hit while building this:

- **A coverflow animation and a reveal transition cannot share an element.** Both want
  `transform`, the animation wins, and the reveal silently never runs. The turn lives on an
  inner `.story-panel`, the reveal stays on the `<li>`.
- **`overflow: hidden` flattens 3D.** A `translateZ` inside the image frame does nothing,
  which is why depth is applied to the card plane and to the caption — never inside the
  frame.

## Importing photographs

The admin panel uploads one frame at a time, which is right for swapping a hero and wrong
for a wedding's worth of exports. For that:

```bash
pnpm import:photos ~/exports/sharma-wedding --category WEDDING --featured
pnpm import:photos ~/exports/prewedding     --category PRE_WEDDING
pnpm import:photos ~/exports/hero.jpg       --into hero --alt "Bride and groom at the varmala"
pnpm import:photos ~/exports/some-folder    --dry-run     # look before writing
```

For each file it reads the real pixel dimensions out of the header, picks the matching
crop (3:2 landscape, 4:5 portrait, 1:1 square, 2:3 tall), derives starting alt text from
the filename, copies the original into the upload directory under a generated name, writes
the row, and asks the running site to drop its cached content so the import is visible
immediately. `--into` also accepts `instagram`, `hero` and `about`.

**Import the originals, not Instagram downloads.** Instagram re-compresses everything to
around 1080px; the hero here is served at up to 2560px and the difference is plainly
visible. `next/image` derives every smaller size and AVIF/WebP variant at request time, so
there is nothing to gain by shrinking anything first — give it the full-resolution export.
The importer warns on any file under 1600px wide.

Re-running the same folder is a no-op: files are matched by content hash, so a second
import reports them as already present rather than duplicating them. The exception is
`--into hero` and `--into about`, which happily point at a photograph that is already in
the portfolio — usually exactly what you want — and reuse the stored copy rather than
writing the bytes twice.

Alt text derived from a filename is a starting point, not a finished job. Give
`/admin/collections/portfolio` a pass afterwards; it matters for search and for anyone
using a screen reader.

## Instagram

The studio's account is [@ganesh_patil_photography](https://www.instagram.com/ganesh_patil_photography/)
— a public Creator account whose bio already links `patilstudio.in`.

**Nothing on this site scrapes it.** Public profile metadata (name, category, follower and
post counts, bio) is readable without a token, and the recent posts' image URLs are
reachable through an undocumented internal endpoint — but that endpoint is rate-limited,
breaks without notice, is against Instagram's terms, and serves ~1080px re-compressions of
photographs the studio already holds at full resolution. So the Instagram section is an
admin-managed grid: the studio picks the frames and optionally links the posts they came
from.

If a live feed is wanted later, the legitimate route is the **Instagram API with Instagram
Login** — the account is already `is_professional_account: true`, so no conversion is
needed. It wants a Meta app, a one-time OAuth grant by the account owner, and a token
refreshed every 60 days. `lib/content/index.ts` is where that fetch belongs; the tiles
would come from a cached feed instead of the table and
[components/site/instagram-section.tsx](components/site/instagram-section.tsx) would not
change.

## Pre-deploy security review

Reviewed before first deploy. Three real findings, all fixed; each is verified in
"What has been verified".

- **The rate limiters keyed on a spoofable value.** Both the enquiry limiter and the admin
  password limiter read `X-Forwarded-For.split(',')[0]`. Traefik *appends* the peer address
  to whatever the client sent, so the first entry is attacker-controlled — rotating one
  header gave an unlimited budget, which for the login limiter defeated brute-force lockout
  entirely. Now [lib/client-ip.ts](lib/client-ip.ts) counts back `TRUSTED_PROXY_HOPS`
  (default 1) from the end, and a request arriving with fewer hops than expected collapses
  to a single shared bucket rather than a fresh one per forged value.
- **The upload allow-list keyed on the claimed `Content-Type`.** `File.type` is
  caller-supplied, so any bytes could be stored as `.png`. Now the extension comes from the
  file's actual magic bytes ([lib/image-sniff.ts](lib/image-sniff.ts)). Consequences were
  bounded — the media route serves a fixed Content-Type with `nosniff`, so nothing could
  ever be served as HTML or script — but the check was decorative.
- **JSON-LD was `JSON.stringify` straight into a `<script>`.** Every string in that graph
  comes from the admin panel, so a value containing `</script>` closed the element early:
  an admin could XSS every visitor. `jsonLdScript()` escapes `<` and U+2028/U+2029.

Accepted, with reasons:

- **`script-src 'unsafe-inline'`** is required by Next's hydration bootstrap. No
  user-supplied content is ever rendered as HTML — React escapes everything, and the one
  `dangerouslySetInnerHTML` is the JSON-LD above — so the practical XSS surface is small.
  Nonce-based CSP is the upgrade if that changes.
- **The admin session cannot be revoked server-side.** No session store, so a stolen cookie
  is valid until it expires; hence a 7-day lifetime and a signing key derived from the
  password, so changing the password invalidates every session.
- **`/api/admin/revalidate` accepts the admin password as a bearer token** so the import CLI
  can use it. Over HTTPS, and the password is already in that machine's `.env`.
- **This container publishes no ports** — Traefik on the shared Docker network is the only
  route in. That is load-bearing for the IP logic above: publishing a port would let a
  caller reach the app directly and forge the whole `X-Forwarded-For` chain.
- **Responses vary by session** (an admin gets the editor toolbar). Traefik does not cache,
  but do not put a caching CDN in front without varying on the cookie, or one admin request
  could be cached and served to visitors.

## Deploying

The full runbook — with the verification after each step and what each failure mode
actually means — is **[DEPLOY.md](DEPLOY.md)**. Kept there rather than duplicated here
so the two cannot drift.

The shape of it, so you know what you are in for:

1. Confirm the host, and that the **production** Traefik stack is the one running.
2. Get the code to `/opt/patilstudio` (rsync or git). **Build on the server** — a Mac
   bakes arm64 Prisma engines, and the image will not start on x86_64.
3. Provision the database once, from `/opt/galleryflow`, and run the three
   verification queries.
4. Both DNS `A` records, resolving **before** the first start (HTTP-01).
5. `cp .env.example .env`: `SITE_DOMAIN`, the `DATABASE_URL` password, and
   `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` — the panel is closed until the first of
   those is set.
6. `docker compose up -d --build`, then verify from outside the server, including that
   `/admin` redirects to the login rather than opening.
7. Load starter content in the panel and upload photographs; confirm one is served at
   `/media/<name>`, which is what proves the volume is mounted.
8. Back up **both** the new database (`backup-db.sh` dumps only `galleryflow`) and the
   `patil_uploads` volume — the photographs are not in Postgres, so no dump contains
   them.

## Things that will bite you

- **`traefik.docker.network` is load-bearing.** Traefik must be told which shared
  network to dial the container on. Wrong or absent, the symptom is a 502 with
  nothing useful in the logs.
- **Router names are global to the Traefik instance.** `web`, `app`, `api` and their
  `-secure` twins belong to GalleryFlow. Everything here is prefixed `patil-`.
- **`postgres:5432`, not `localhost:5433`.** 5433 is the port published to the host;
  container-to-container traffic uses the service name and the internal port.
- **No `depends_on` on Postgres** — it lives in another compose project, so compose
  cannot order against it. If the database is down at boot, `migrate deploy` fails,
  the container exits, and `restart: unless-stopped` retries. That is preferred over
  serving pages against an unmigrated schema.
- **The CSP is baked at build time** ([next.config.ts](next.config.ts)). Adding an
  external origin later (analytics, a maps embed, an image CDN) means naming it there
  and rebuilding — the browser blocks it silently otherwise. This is the same class
  of bug that broke GalleryFlow's uploads when the R2 origin was missing from
  `connect-src`.
- **Enquiry validation rules live in one module used by BOTH sides**
  ([lib/validation.ts](lib/validation.ts)). They were split before — HTML attributes in the
  browser, a separate regex on the server — and the two disagreed in three ways that each
  looked like broken validation: `someone@localhost` satisfies `type="email"` so it only
  failed after a round trip; a name of three spaces satisfies `required` and then came back
  as the generic "Name, email and a message are required"; and `type="tel"` validates
  nothing, so "not a phone at all" was accepted and stored. If you add a rule, add it there
  — not to the form and not to the route handler.
- **The form is `noValidate`, deliberately.** Native bubbles would duplicate and sometimes
  contradict the inline messages, and cannot be styled. The constraint attributes stay on
  each input for assistive technology; the JavaScript owns the messaging.
- **Field errors complain on blur and forgive on input.** Validating every keystroke tells
  someone their email is wrong while they are still typing the local part; leaving a message
  up after it has been corrected is worse. So a field is only flagged once left (or on a
  submit attempt), and once flagged it re-checks on every keystroke so the message clears
  the moment it becomes valid.
- **The inquiry rate limiter counts writes, not attempts**, and is in-process
  (therefore per container). Counting attempts locks out a visitor who mistypes their
  email twice — found by testing, and on an enquiry form that is a lost booking. Fine
  at one replica; move it to the shared Redis if this ever scales out.
- **pnpm 11 reads install settings from `pnpm-workspace.yaml`, not `.npmrc`.** Both
  `nodeLinker: hoisted` and `allowBuilds` live there. A `.npmrc` `node-linker` line is
  silently ignored — the symptom is a container that builds fine and then cannot find
  `@prisma/engines` at boot.
- **`.dockerignore` is load-bearing.** Without it `COPY . .` overwrites the
  container's Linux `node_modules` with the host's macOS ones, and pnpm aborts the
  build with a stack trace that names nothing relevant.
- **Uploads are a volume, and losing it loses every photograph.** `patil_uploads` at
  `/app/uploads` is the only data this container owns that is not in Postgres. Nothing
  warns you if it is missing — `docker compose up --build` just quietly starts the
  studio's image library from scratch.
- **Uploads are deliberately NOT under `public/`.** Next indexes `public` when it
  *builds*, so a file written there at runtime is never served — the upload succeeds and
  then 404s. Found by testing. They live outside it and are served by
  [app/media/[...path]/route.ts](app/media). The Dockerfile's `COPY /app/public` would
  shadow a mount over `public` anyway.
- **`/app/uploads` is created in the Dockerfile, not at runtime.** Docker seeds a fresh
  named volume with the ownership of the image's own directory. Create it at runtime
  instead and the volume arrives root-owned, and every upload fails with `EACCES` from a
  container running as uid 1001.
- **`IMAGE_CDN_HOSTS` must reach the BUILD**, not just the runtime — `images` in
  next.config.ts is evaluated during `next build`. Compose passes it as a build arg;
  changing it needs `up -d --build`, not a restart.
- **Public pages are `force-dynamic` on purpose.** They read content from Postgres, and
  the build machine cannot reach it — prerendering would bake the seed defaults into the
  HTML and the first visitor after every deploy would see them. Content is served from a
  tagged cache (`unstable_cache` + `revalidateTag`), so an admin save is live
  immediately and a normal visit is not ten queries.
- **Every admin server action calls `requireAdmin()` itself.** A server action is a
  public POST endpoint addressed by an opaque id; it is not protected by the fact that
  the page rendering its form was, and route middleware would not cover it. Verified by
  POSTing an action id with no session — 303 to the login page.
- **Inline editing must never grow a `field` parameter it does not validate.**
  `/api/admin/inline` takes a column name from the browser and hands it to Prisma; the only
  thing standing between that and an arbitrary write is `parseField`'s allow-list. If you
  add a `FieldType`, decide deliberately whether it belongs in that list — booleans and
  numbers are excluded on purpose.
- **`contentEditable` is applied through the DOM, never as a JSX prop.** These are server
  components' elements; React does not own their children, so it will not fight the browser
  over them, and `router.refresh()` replaces them wholesale. Setting it in JSX earns a
  React warning and unpredictable reconciliation.
- **Clicks are swallowed in edit mode, in the capture phase.** Half the editable fields sit
  inside an `<a>` — the hero CTAs, every service card — and without it, clicking to place
  the caret navigates away and loses the edit.
- **Nothing inside a `<Frame>` may be a `<button>` or an `<a>`.** A frame is regularly
  already inside one — a portfolio tile is a `<button>`, a service card is an `<a>` — and
  nesting interactive elements is invalid HTML that fails hydration for **every** visitor,
  not only an admin. The Replace control is therefore a `<span>` driven by a delegated
  listener. Caught by reading the browser console, which is the only place it showed up:
  the page looked perfect and typechecked clean.
- **The live-editor toolbar cannot outrank Next's dev indicator**, which renders in a
  shadow root above every z-index in this codebase and sits in the same corner. It is moved
  to `bottom-right` via `devIndicators` in next.config.ts. The toolbar also sits at
  `bottom-24` below `lg` to clear the sticky mobile CTA bar.
- **The edit affordance is `color-mix(… currentColor …)`, not gold.** A gold dashed outline
  on the gold CTA is invisible, and the button label is the field studios most want to
  rename. Caught by looking at a screenshot, not by reading the CSS.
- **Boolean form fields are a hidden `false` followed by a checkbox `true`, and the
  action reads the LAST value.** A checkbox posts nothing when unticked, so the pair is
  required — but `FormData.get()` returns the *first* match, which is always the hidden
  `false`. Read naively, no boolean could ever be switched on, and every row save
  silently unpublished the row. Found by testing; see `normaliseSetting` in
  [app/admin/actions.ts](app/admin/actions.ts).
- **A `Collection` cannot be passed to a client component.** It carries a `seed()`
  function and React refuses to serialise functions across the boundary. Use
  `forClient()`; the symptom otherwise is a 500 on every collection page.
- **The CSP now names YouTube and Vimeo in `frame-src`** because the film modal frames
  them. Self-hosted MP4 needs no exception. Still baked at build time.
- **Neither `documentElement.scrollWidth` nor `scrollTo()` will tell you whether this page
  has a horizontal-overflow bug.** `body { overflow-x: hidden }` propagates to the
  *viewport* per spec, leaving the body element itself `visible`, so the root reports a
  scrollWidth of ~771px at a 390px viewport. And `overflow: hidden` is defined as "clip and
  disallow **user** scrolling, but remain programmatically scrollable" — so `scrollTo(500,
  0)` genuinely moves `scrollX` to 396 and proves nothing. The two probes that do work:
  walk the tree for an element whose `scrollWidth > clientWidth` with no clipping ancestor,
  and dispatch real wheel/touch input and check `scrollX` afterwards. Both were needed to
  settle this; each on its own gave a misleading answer once.
- **A frame with page copy over it needs `plateAlign="top"`.** The placeholder plate
  centres its marker, which lands squarely under the hero headline and reads as a broken
  image. The hero, the film section and the service headers all set it.
- **The image is ~990MB**, most of it `next`, `@next/swc` and Prisma's engines. It
  carries the Prisma CLI on purpose so the container is self-provisioning; the
  alternative (a separate one-shot migrate service) trades that for roughly the same
  total disk. Not optimised further because nothing here is disk-constrained — if that
  changes, dropping the CLI from the runtime image is the biggest single cut.

## The database

`Inquiry` — enquiries from the site's form, written by
[app/api/inquiries/route.ts](app/api/inquiries/route.ts) and read at
`/admin/inquiries` — plus ten CMS tables: `SiteSetting`, `Service`, `PortfolioImage`,
`Package`, `ComparisonRow`, `Testimonial`, `StoryChapter`, `Film`, `FaqItem`,
`InstagramItem`.

**The public site does not require any of the CMS tables to be populated, or even
reachable.** [lib/content/index.ts](lib/content/index.ts) swallows a database error and
serves the built-in defaults, for the same reason the health check does not touch
Postgres: a database blip should cost the studio its enquiry form, not its whole
website.

Migrations are hand-checked the same way GalleryFlow does it — generate with
`prisma migrate diff`, drop into `prisma/migrations/<timestamp>_<name>/migration.sql`,
apply with `migrate deploy`:

```bash
node node_modules/prisma/build/index.js migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel  prisma/schema.prisma --script
```

Enquiries are read at `/admin/inquiries` — filterable by status, with pre-addressed
WhatsApp, call and reply links, because the studio answers these from a phone. `pnpm
db:studio` still works for anything the panel does not cover.

## Local development

```bash
pnpm install
cp .env.example .env      # point DATABASE_URL at localhost:5433, not postgres:5432
                          # and set ADMIN_PASSWORD, or /admin stays closed
pnpm db:deploy
pnpm dev                  # http://localhost:3002 · /admin for the CMS
```

Uploads land in `./uploads` (gitignored). The site renders complete without a database —
useful for design work — but the admin panel needs one.

## What has been verified

Checked end to end on a throwaway Postgres 17 on the same Docker network, then torn
down — nothing in the GalleryFlow stack was touched:

- `pnpm build` and `pnpm typecheck` pass (exit 0).
- Both migrations apply clean to an empty database **and** `20260819120000_cms` applies
  on top of an existing `20260819000000_init` — additive only, nothing rewritten.
- The image builds, and the Prisma CLI resolves inside it
  (`prisma 6.19.3`, binaryTarget `linux-musl-arm64-openssl-3.0.x`).
- The entrypoint applies `20260819000000_init` against the `patilstudio` database on
  first boot, then the server starts.
- `GET /api/health` → `{"status":"ok"}`; the home page renders; the CSP, HSTS and
  `X-Frame-Options` headers are present on the response.
- `POST /api/inquiries` → 201 and the row lands in Postgres with all ten fields
  including `services[]`. Missing fields and a malformed email → 400. A tripped honeypot
  → 200 with **no** row written. Five successful writes exhaust the per-IP budget; three
  rejected attempts then a valid one → 201, so failures do not consume it.
- The whole admin panel, driven over HTTP against the running server: wrong password →
  refused with no cookie; correct → `303` and an `HttpOnly` session; **Load all starter
  content** writes 8/18/3/12/3/6/1/10/6 rows and a second press is a no-op; a settings
  group saves and the change is on the public page on the next request (tagged
  revalidation); a boolean setting goes true *and* back to false; a portfolio row saves
  an uploaded photograph, unpublishes, and republishes; reorder moves a FAQ; a blank
  required field → *"Question is required"*; a duplicate package slug → the unique-slug
  message; delete removes the row; an enquiry moves `NEW → REPLIED` and an invalid status
  is refused; logout clears the cookie and `/admin` gates again.
- Upload: a PNG → `201` and `/media/<24 hex>.png`; a text file and an SVG → `415`; no
  session → `401`; `/media/../package.json`, a nested path, an unknown name and a
  mismatched extension → `404`; `next/image` optimises the stored file to AVIF.
- In the built container: uploads persist across `docker restart` on the volume, the
  volume is owned by `nextjs:nodejs`, and both fonts are self-hosted from
  `.next/static/media` with no request to Google.
- The 3D, measured rather than eyeballed: a synthetic pointer at a card's top-right corner
  yields `--tilt-rx: 3.50deg / --tilt-ry: 3.51deg`, dead centre yields ~0°, and leaving the
  card resets both to `0deg` and drops `data-tilt-active`. The six story panels read
  +13.9° / +7.2° / 0° / −5.3° / −12.7° / −13.9° mid-track — a symmetric coverflow with the
  centre frame square to the viewer. `hero-recede` and `story-turn` are both attached and
  running. Under touch emulation `(hover: hover)` is false, no tilt listener attaches and
  the inner transform stays `matrix(1, 0, 0, 1, 0, 0)`, while the scroll-driven effects and
  the 3D reveals still run.
- Tilting a card does not reintroduce horizontal overflow at either width.
- **Live editing, driven end to end in a real browser as a signed-in admin:** the toolbar
  mounts and nothing is editable until toggled (0 `contenteditable` nodes); toggling sets
  113 of them, adds the `editing` class and reveals the Replace controls; typing into two
  fields shows `Save 2`; Save reports "Saved 2 changes", both values land in Postgres, and
  they appear in the server-rendered HTML for an anonymous visitor on the next request.
  Escape reverts one field and clears its dirty flag, Enter commits a single-line field
  without inserting a newline, Discard rolls everything back. Replacing the hero photograph
  from the page uploaded the file, wrote `/media/<hex>.png` to `hero.imagePath` and
  re-rendered the frame. An anonymous request contains no editor markup at all.
- The browser console is clean on `/`, `/portfolio` and a service page, signed in and
  anonymous — checked explicitly, and it is what surfaced the nested-interactive-element
  hydration failure and the `images.qualities` requirement coming in Next 16.
- The toolbar is inside the viewport and its Edit button is the topmost element at its own
  centre (`elementFromPoint`) at both 1440px and 390px; at 390px it clears the sticky CTA
  bar (toolbar bottom edge 96px, bar top edge 57px).
- **Enquiry validation, driven with real mouse and key events in a browser** (synthetic
  `focus()`/`blur()` does not fire what React listens to, and a `scrollIntoView` read mid
  smooth-scroll clicks the wrong place — both produced false failures before the harness was
  fixed): an untouched submit flags all four fields, moves focus to the first, and issues no
  request; `A` / `abc` / `x@y` / `hi` each get their own message; correcting a field clears
  its message without leaving it; a valid submission returns 201, shows the success panel
  and offers WhatsApp. The same five payloads posted directly to the route — bypassing the
  form entirely — return 400 with field-keyed errors, and a valid one returns 201.
- The security fixes, each with a test that failed before it: a forged `X-Forwarded-For`
  plus a real appended hop now exhausts after 5 writes and returns 429 (previously 201
  forever), a different real client still gets its own budget, and an unproxied request
  collapses to one shared bucket. A PHP payload and a bare `GIF89a` both claiming
  `image/png` → 415; a real PNG → 201. Saving `</script><script>alert(1)</script>` into
  `seo.description` renders as `\u003c/script` with no raw injection anywhere in the page.
  `robots.txt` on a fresh database is `Disallow: /`.
- The editor's JavaScript genuinely does not reach visitors: it is a separate chunk
  (`chunks/37.*.js`), and a network trace shows an anonymous page load fetching 10 chunks
  without it while an admin fetches 11 with it. An earlier claim of this was wrong — a
  plain import kept the code inside the shared `(site)/layout` chunk, and only crossing a
  client boundary with `next/dynamic` actually split it.
- The inline endpoint's allow-list, one attempt each: no session → 401; unknown setting key,
  `published`, `sortOrder`, an invented collection and an id of `1 OR 1=1` → 400; 101 edits
  → 413; a declared text field → 200.
- Turning `seo.indexable` off from the panel flips `robots.txt` to `Disallow: /` and the
  page meta to `noindex, nofollow`; turning it back on restores both.
- `pnpm import:photos` against six generated exports: dimensions read correctly from both
  the PNG and the JPEG parsers, all four crops classified right, the sub-1600px warning
  fires, non-images and subfolders are ignored, a second run of the same folder imports
  nothing, `--into hero` reuses the already-stored copy without duplicating bytes, and the
  imported frames serve as AVIF at 640/1280/2560px. `POST /api/admin/revalidate` → 401
  with no auth, 401 with a wrong bearer, 200 with the right one.
- The hero photograph is the only preloaded image; every other frame renders
  `loading="lazy"` with a responsive `srcset`.
- **Rendered and inspected in headless Chrome at 390×844 and 1440×900**, driven over the
  DevTools protocol. Zero elements overflow their container and nothing paints past the
  viewport edge; six synthetic horizontal wheel events and a 400px touch drag leave
  `scrollX` at `0` at both widths. The wedding-story track holds 1945px of content inside
  a 375px scroll container, as intended.
- `001-create-database.sql` runs clean, and `patilstudio` is refused `CONNECT` on
  `galleryflow` (`FATAL: permission denied for database`). The reverse is not blocked,
  because GalleryFlow's role is a superuser — see the note in that file.
- `docker compose config` resolves, and the external network name
  `galleryflow_galleryflow` matches the one on the machine.

**Not verified, and only possible on the server:** DNS, Let's Encrypt issuance for
`patilstudio.in`, and Traefik actually routing the Host header — the local test hit
the container directly on :3002.
