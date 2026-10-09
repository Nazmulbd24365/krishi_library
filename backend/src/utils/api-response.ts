import type { Response } from 'express';

export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function ok<T>(res: Response, data: T, meta?: Meta, status = 200) {
  return res.status(status).json({ success: true, data, meta });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, undefined, 201);
}

export function message(res: Response, text: string, status = 200) {
  return res.status(status).json({ success: true, message: text });
}
