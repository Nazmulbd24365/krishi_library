import multer from 'multer';
import type { Request } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/http-error';

// Files are held in memory, then persisted by the storage service to either
// local disk or Supabase Storage (see services/storage.service.ts).
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf'];
export const EXCEL_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function typeFilter(allowed: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  };
}

const maxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
  fileFilter: typeFilter(IMAGE_TYPES),
});

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes * 3 },
  fileFilter: typeFilter(DOC_TYPES),
});

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: typeFilter(EXCEL_TYPES),
});
