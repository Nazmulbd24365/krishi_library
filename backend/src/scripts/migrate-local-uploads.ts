import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { uploadRoot, supabaseAuthHeaders } from '../services/storage.service';

/**
 * One-time migration: copy images that were uploaded to local disk during
 * development into Supabase Storage, then rewrite every `localhost` / relative
 * upload URL stored in the database to the new Supabase public URL.
 *
 * Why: the deployed API has no access to the developer's local `uploads/`
 * folder, so any record still pointing at `http://localhost:4000/...` renders a
 * broken image on the live site.
 *
 * Usage (from the repo root):
 *   npm run migrate:local-uploads -w backend
 *
 * Requirements: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY must be set, and the
 * bucket (SUPABASE_STORAGE_BUCKET, default `sail-media`) must exist and be public.
 */

const SUPABASE_URL = env.SUPABASE_URL.replace(/\/$/, '');
const BUCKET = env.SUPABASE_STORAGE_BUCKET;

function assertConfig() {
  if (!SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n' +
        '   Set them in backend/.env before running this migration.',
    );
    process.exit(1);
  }
}

/** Extract `images/<file>` from any local or API upload URL. */
function localKeyFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/uploads\/(.+)$/);
  if (match) return match[1];
  return null;
}

async function uploadToSupabase(subfolder: string, filename: string): Promise<string> {
  const diskPath = path.join(uploadRoot, subfolder, filename);
  if (!fs.existsSync(diskPath)) {
    throw new Error(`Local file not found: ${diskPath}`);
  }
  const buffer = fs.readFileSync(diskPath);
  const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${subfolder}/${filename}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...supabaseAuthHeaders(),
      'Content-Type': mimeFor(filename),
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000, immutable',
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Upload failed for ${subfolder}/${filename} (${res.status}): ${detail.slice(0, 300)}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${subfolder}/${filename}`;
}

function mimeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** Cache of local URL → Supabase public URL so each file uploads once. */
const urlCache = new Map<string, string>();

async function rewriteUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const key = localKeyFromUrl(url);
  if (!key) return null; // not a local upload URL — leave as-is

  const cached = urlCache.get(key);
  if (cached) return cached;

  const [subfolder, ...rest] = key.split('/');
  const filename = rest.join('/');
  const publicUrl = await uploadToSupabase(subfolder, filename);
  urlCache.set(key, publicUrl);
  return publicUrl;
}

async function main() {
  assertConfig();
  console.log(`🔗 Supabase Storage: ${SUPABASE_URL} (bucket: ${BUCKET})`);
  console.log(`📂 Local uploads root: ${uploadRoot}\n`);

  let total = 0;

  // ---- Hero slides -------------------------------------------------------
  for (const row of await prisma.heroSlide.findMany()) {
    const next = await rewriteUrl(row.imageUrl);
    if (next && next !== row.imageUrl) {
      await prisma.heroSlide.update({ where: { id: row.id }, data: { imageUrl: next } });
      console.log(`✅ HeroSlide ${row.id}: ${row.imageUrl} → ${next}`);
      total += 1;
    }
  }

  // Generic pass over the remaining tables that store image URLs.
  const tables: Array<{
    name: string;
    model: {
      findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
      update: (args: unknown) => Promise<unknown>;
    };
    fields: string[];
  }> = [
    { name: 'aboutContent', model: prisma.aboutContent as never, fields: ['imageUrl'] },
    { name: 'founderMessage', model: prisma.founderMessage as never, fields: ['portraitUrl'] },
    { name: 'testimonial', model: prisma.testimonial as never, fields: ['photoUrl'] },
    { name: 'museumItem', model: prisma.museumItem as never, fields: ['imageUrl'] },
    { name: 'galleryImage', model: prisma.galleryImage as never, fields: ['imageUrl'] },
    { name: 'programImage', model: prisma.programImage as never, fields: ['imageUrl'] },
    { name: 'achievement', model: prisma.achievement as never, fields: ['imageUrl'] },
    { name: 'boardMember', model: prisma.boardMember as never, fields: ['photoUrl'] },
    { name: 'researchItem', model: prisma.researchItem as never, fields: ['imageUrl'] },
    { name: 'video', model: prisma.video as never, fields: ['thumbnailUrl'] },
  ];

  for (const table of tables) {
    let rows: Array<Record<string, unknown>>;
    try {
      rows = await table.model.findMany();
    } catch {
      console.log(`↷  Skipped ${table.name} (model unavailable).`);
      continue;
    }
    for (const row of rows) {
      const data: Record<string, string> = {};
      for (const field of table.fields) {
        const next = await rewriteUrl(row[field] as string | null);
        if (next) data[field] = next;
      }
      if (Object.keys(data).length > 0) {
        await table.model.update({ where: { id: row.id }, data });
        console.log(`✅ ${table.name} ${String(row.id)}: ${JSON.stringify(data)}`);
        total += 1;
      }
    }
  }

  // Settings may hold logo/favicon URLs.
  const settings = await prisma.siteSettings.findFirst();
  if (settings) {
    const data: Record<string, string> = {};
    const logo = await rewriteUrl(settings.logoUrl);
    if (logo) data.logoUrl = logo;
    const favicon = await rewriteUrl(settings.faviconUrl);
    if (favicon) data.faviconUrl = favicon;
    if (Object.keys(data).length > 0) {
      await prisma.siteSettings.update({ where: { id: settings.id }, data });
      console.log(`✅ siteSettings updated: ${JSON.stringify(data)}`);
      total += 1;
    }
  }

  console.log(`\nDone. ${total} record(s) updated, ${urlCache.size} file(s) uploaded to Supabase Storage.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
