#!/usr/bin/env node
/**
 * Bulk-imports the studio's own photographs.
 *
 *   pnpm import:photos <folder-or-files...> [options]
 *
 * Point it at a folder of full-resolution exports. It copies each file into the upload
 * directory under a generated name, reads the real pixel dimensions to pick the right
 * crop, derives starting alt text from the filename, and writes the content rows.
 *
 * Why a CLI and not the admin panel's upload button: 368 posts' worth of photographs is
 * not something anyone should click through one frame at a time, and the originals are
 * on the photographer's disk, not on a phone.
 *
 * **Import originals, not Instagram downloads.** Instagram re-compresses to ~1080px; the
 * hero on this site is served up to 2560px wide and the difference is plainly visible.
 * next/image derives every smaller size and modern format at request time, so there is
 * no reason to pre-shrink anything before it gets here.
 *
 * Options
 *   --into <target>   portfolio (default) | instagram | hero | about
 *   --category <CAT>  WEDDING PRE_WEDDING ENGAGEMENT MATERNITY BABY EVENTS FILMS
 *   --featured        mark portfolio rows as featured (the shorter home-page edit)
 *   --alt "<text>"    one alt text for every file, instead of deriving from filenames
 *   --unpublished     write the rows hidden, to review in the panel before they go live
 *   --dry-run         report what would happen and write nothing
 *
 * Examples
 *   pnpm import:photos ~/exports/sharma-wedding --category WEDDING --featured
 *   pnpm import:photos ~/exports/prewedding --category PRE_WEDDING
 *   pnpm import:photos ~/exports/hero.jpg --into hero
 */

import { createHash, randomBytes } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { classifyRatio, readImageSize } from './image-size.mjs';

const ACCEPTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const CATEGORIES = ['WEDDING', 'PRE_WEDDING', 'ENGAGEMENT', 'MATERNITY', 'BABY', 'EVENTS', 'FILMS'];
const TARGETS = ['portfolio', 'instagram', 'hero', 'about'];

const prisma = new PrismaClient({ log: ['error'] });

function uploadsDirectory() {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), 'uploads');
}

function parseArgs(argv) {
  const opts = {
    inputs: [],
    into: 'portfolio',
    category: 'WEDDING',
    featured: false,
    alt: null,
    published: true,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--into') opts.into = String(argv[++i] ?? '').toLowerCase();
    else if (arg === '--category') opts.category = String(argv[++i] ?? '').toUpperCase();
    else if (arg === '--alt') opts.alt = String(argv[++i] ?? '');
    else if (arg === '--featured') opts.featured = true;
    else if (arg === '--unpublished') opts.published = false;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg.startsWith('--')) fail(`Unknown option ${arg}`);
    else opts.inputs.push(arg);
  }
  return opts;
}

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

/** Filename → a readable starting point for alt text, editable in the panel afterwards. */
function altFromFilename(file) {
  const base = path.basename(file, path.extname(file));
  const words = base
    // Strip camera/export noise: DSC_0142, IMG-20260819-WA0003, -edit, -final, _2
    .replace(/^(dsc|img|dji|_mg|p)[-_]?\d+/i, '')
    .replace(/[-_]?(edit|final|export|copy|v\d+|\d{8}|wa\d+)$/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

async function collectFiles(inputs) {
  const files = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    let info;
    try {
      info = await stat(resolved);
    } catch {
      fail(`No such file or folder: ${input}`);
    }
    if (info.isDirectory()) {
      const entries = await readdir(resolved, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
        if (!entry.isFile()) continue;
        if (ACCEPTED.has(path.extname(entry.name).toLowerCase())) {
          files.push(path.join(resolved, entry.name));
        }
      }
    } else if (ACCEPTED.has(path.extname(resolved).toLowerCase())) {
      files.push(resolved);
    } else {
      console.warn(`  – skipped ${path.basename(resolved)} (only .jpg .png .webp are read)`);
    }
  }
  return files;
}

/**
 * Content hashes of everything already stored, so re-running the same folder is a no-op
 * instead of importing 24 duplicate frames. Cheap, and it needs no schema column.
 */
async function existingHashes(directory) {
  const hashes = new Map();
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return hashes;
  }
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.') || entry.name.endsWith('.md')) continue;
    const buffer = await readFile(path.join(directory, entry.name));
    hashes.set(createHash('sha256').update(buffer).digest('hex'), entry.name);
  }
  return hashes;
}

/** Best-effort: tells a running site to drop its cached content so the import shows up. */
async function revalidate() {
  const base = process.env.SITE_BASE_URL ?? 'http://localhost:3002';
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return 'skipped (ADMIN_PASSWORD not set)';
  try {
    const response = await fetch(`${base}/api/admin/revalidate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? 'done' : `refused (${response.status})`;
  } catch {
    return 'site not reachable — it will pick the changes up within the hour, or restart it';
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || opts.inputs.length === 0) {
    console.log(`
  Import the studio's own photographs.

    pnpm import:photos <folder-or-files...> [options]

    --into <target>   ${TARGETS.join(' | ')}   (default: portfolio)
    --category <CAT>  ${CATEGORIES.join(' ')}
    --featured        include in the shorter home-page edit
    --alt "<text>"    one alt text for all files (default: derived from filename)
    --unpublished     import hidden, to review before publishing
    --dry-run         show what would happen, write nothing

  Example
    pnpm import:photos ~/exports/sharma-wedding --category WEDDING --featured
`);
    process.exit(opts.help ? 0 : 1);
  }

  if (!TARGETS.includes(opts.into)) fail(`--into must be one of: ${TARGETS.join(', ')}`);
  if (opts.into === 'portfolio' && !CATEGORIES.includes(opts.category)) {
    fail(`--category must be one of: ${CATEGORIES.join(', ')}`);
  }

  const files = await collectFiles(opts.inputs);
  if (files.length === 0) fail('Found no .jpg, .png or .webp files to import.');

  if ((opts.into === 'hero' || opts.into === 'about') && files.length > 1) {
    fail(`--into ${opts.into} takes a single photograph, but ${files.length} were found.`);
  }

  const directory = uploadsDirectory();
  if (!opts.dryRun) await mkdir(directory, { recursive: true });
  const seen = await existingHashes(directory);

  console.log(`\n  ${files.length} file(s) → ${opts.into}${
    opts.into === 'portfolio' ? ` · ${opts.category}` : ''
  }${opts.dryRun ? '  (dry run)' : ''}`);
  console.log(`  uploads: ${directory}\n`);

  // Continue the existing order rather than restarting at 0, so an import lands after
  // what is already there instead of interleaving with it.
  let nextOrder = 0;
  if (opts.into === 'portfolio' || opts.into === 'instagram') {
    const delegate = opts.into === 'portfolio' ? prisma.portfolioImage : prisma.instagramItem;
    const last = await delegate.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    nextOrder = (last?.sortOrder ?? -1) + 1;
  }

  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const buffer = await readFile(file);
    const name = path.basename(file);
    const hash = createHash('sha256').update(buffer).digest('hex');

    // A file already in the store is a duplicate for a collection, but not for the hero
    // or About portrait — the hero is usually the strongest frame in the portfolio, and
    // refusing to point at a photograph because it is already uploaded is just wrong.
    // Reuse the stored copy instead of writing the bytes twice.
    const alreadyStored = seen.get(hash);
    const settingTarget = opts.into === 'hero' || opts.into === 'about';
    if (alreadyStored && !settingTarget) {
      console.log(`  – ${name}  already imported (${alreadyStored})`);
      skipped += 1;
      continue;
    }

    const size = readImageSize(buffer);
    if (!size) {
      console.warn(`  ✗ ${name}  could not read dimensions — is it a real JPEG/PNG/WebP?`);
      skipped += 1;
      continue;
    }

    const ratio = classifyRatio(size.width, size.height);
    // 24 hex characters plus a normalised extension: exactly the shape
    // app/media/[...path]/route.ts will serve. Anything else 404s.
    const extension = size.format === 'jpg' ? 'jpg' : size.format;
    const stored = alreadyStored ?? `${randomBytes(12).toString('hex')}.${extension}`;
    const url = `/media/${stored}`;
    const alt = opts.alt ?? altFromFilename(name);

    const megapixels = ((size.width * size.height) / 1e6).toFixed(1);
    console.log(
      `  ✓ ${name}  ${size.width}×${size.height} (${megapixels}MP) → ${ratio}${
        alreadyStored ? '  (reusing the copy already uploaded)' : ''
      }${size.width < 1600 ? '  ⚠ under 1600px wide — will look soft full-bleed' : ''}`,
    );

    if (opts.dryRun) {
      imported += 1;
      continue;
    }

    if (!alreadyStored) {
      await copyFile(file, path.join(directory, stored));
      seen.set(hash, stored);
    }

    if (opts.into === 'portfolio') {
      await prisma.portfolioImage.create({
        data: {
          category: opts.category,
          imagePath: url,
          imageAlt: alt || null,
          imageBrief: null,
          imageRatio: ratio,
          featured: opts.featured,
          sortOrder: nextOrder++,
          published: opts.published,
        },
      });
    } else if (opts.into === 'instagram') {
      await prisma.instagramItem.create({
        data: {
          imagePath: url,
          imageAlt: alt || null,
          sortOrder: nextOrder++,
          published: opts.published,
        },
      });
    } else {
      // hero / about are settings, not collection rows.
      const entries = [
        [`${opts.into}.imagePath`, url],
        ...(alt ? [[`${opts.into}.imageAlt`, alt]] : []),
      ];
      for (const [key, value] of entries) {
        await prisma.siteSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
    }

    imported += 1;
  }

  console.log(
    `\n  ${imported} imported, ${skipped} skipped${opts.dryRun ? '  (nothing written)' : ''}`,
  );

  if (!opts.dryRun && imported > 0) {
    console.log(`  cache: ${await revalidate()}`);
    if (opts.into === 'portfolio') {
      console.log(
        `\n  Review alt text and crops at /admin/collections/portfolio — alt text was\n` +
          `  derived from filenames and is worth a pass for search and screen readers.`,
      );
    }
  }
  console.log();
}

try {
  await main();
} catch (error) {
  console.error('\n  ✗ Import failed:', error?.message ?? error, '\n');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
