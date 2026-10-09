import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Root directory for locally-stored uploads.
 *
 * Resolved against the backend root (the folder containing package.json) rather
 * than `__dirname`, so it is identical in dev (`src/`) and after a build
 * (`dist/src/`). `UPLOAD_DIR` may be absolute to point at a persistent volume.
 */
function resolveBackendRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../..'), // src/services -> backend
    path.resolve(__dirname, '../../..'), // dist/src/services -> backend
  ];
  return candidates.find((p) => fs.existsSync(path.join(p, 'package.json'))) ?? process.cwd();
}

export const uploadRoot = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(resolveBackendRoot(), env.UPLOAD_DIR);

/** True when uploads should go to Supabase Storage instead of local disk. */
export function usingSupabaseStorage(): boolean {
  return (
    env.STORAGE_PROVIDER === 'supabase' &&
    env.SUPABASE_URL.length > 0 &&
    env.SUPABASE_SERVICE_ROLE_KEY.length > 0
  );
}

/**
 * Resolve a stored file's public URL.
 * Local storage is served by the API at /uploads. Supabase Storage is CDN-served.
 */
export function publicFileUrl(subfolder: string, filename: string): string {
  if (usingSupabaseStorage()) {
    return `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${subfolder}/${filename}`;
  }
  return `${env.PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${subfolder}/${filename}`;
}

/** Guard against path traversal for any user-supplied file reference. */
export function isSafeRelativePath(p: string): boolean {
  if (!p) return false;
  const normalized = path.normalize(p);
  return !normalized.startsWith('..') && !path.isAbsolute(normalized);
}

/** Generate a collision-resistant filename, preserving a sanitised extension. */
export function uniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return crypto.randomBytes(16).toString('hex') + ext;
}

function supabaseObjectEndpoint(subfolder: string, filename: string): string {
  return `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}/${subfolder}/${filename}`;
}

export interface StoredFile {
  filename: string;
  url: string;
}

/**
 * Persist an uploaded file to the configured backend.
 * - `STORAGE_PROVIDER=supabase` → Supabase Storage (REST API, service-role key)
 * - otherwise → local disk under `UPLOAD_DIR`
 */
export async function saveUploadedFile(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  subfolder: string;
}): Promise<StoredFile> {
  const filename = uniqueFilename(input.originalName);

  if (usingSupabaseStorage()) {
    const res = await fetch(supabaseObjectEndpoint(input.subfolder, filename), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': input.mimeType || 'application/octet-stream',
        'x-upsert': 'true',
        'cache-control': 'public, max-age=31536000, immutable',
      },
      body: input.buffer,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Supabase Storage upload failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    return { filename, url: publicFileUrl(input.subfolder, filename) };
  }

  const dir = path.join(uploadRoot, input.subfolder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), input.buffer);
  return { filename, url: publicFileUrl(input.subfolder, filename) };
}

/** Remove a stored file from whichever backend holds it. Never throws. */
export async function deleteStoredFile(subfolder: string, filename: string): Promise<void> {
  if (!filename || !isSafeRelativePath(path.join(subfolder, filename))) return;

  if (usingSupabaseStorage()) {
    try {
      await fetch(supabaseObjectEndpoint(subfolder, filename), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      });
    } catch {
      /* best effort */
    }
    return;
  }

  try {
    const diskPath = path.join(uploadRoot, subfolder, filename);
    if (path.resolve(diskPath).startsWith(path.resolve(uploadRoot)) && fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
  } catch {
    /* best effort */
  }
}
