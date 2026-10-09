import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/http-error';
import { verifyAccessToken, type AuthPayload } from '../services/token.service';
import { prisma } from '../config/prisma';

export const ACCESS_COOKIE = 'sail_at';
export const REFRESH_COOKIE = 'sail_rt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload & { name: string; role: string };
    }
  }
}

/** Populate req.user when a valid access token cookie / bearer token exists (never throws). */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const token = req.cookies?.[ACCESS_COOKIE] ?? bearer;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, name: true, email: true, role: true, isActive: true },
        });
        if (user && user.isActive) {
          req.user = { sub: user.id, email: user.email, name: user.name, role: user.role };
        }
      }
    }
  } catch {
    // ignore - treated as anonymous
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

/** Roles allowed to mutate content. */
export const CAN_EDIT = ['SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER'];
/** Roles allowed to manage users / settings / destructive actions. */
export const CAN_ADMIN = ['SUPER_ADMIN'];

/** Lightweight CSRF defence: verify Origin for state-changing requests. */
export function verifyOrigin(allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    // Non-browser clients (no Origin) and same-origin requests are allowed.
    if (!origin || allowed.includes(origin)) return next();
    return next(ApiError.forbidden('Request origin not allowed'));
  };
}
