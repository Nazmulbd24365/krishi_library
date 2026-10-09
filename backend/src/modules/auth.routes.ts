import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/http-error';
import { ok, message, created } from '../utils/api-response';
import { validate } from '../middleware/validate';
import { hashPassword, verifyPassword } from '../services/password.service';
import {
  createRefreshToken,
  revokeAllForUser,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../services/token.service';
import { ACCESS_COOKIE, REFRESH_COOKIE, requireAuth, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import { audit } from '../services/audit.service';
import { loginSchema, registerUserSchema, updateUserSchema } from './schemas';

const router = Router();

const cookieOpts = {
  httpOnly: true,
  // In production the frontend and API live on different sites (e.g. Vercel +
  // Render), so the auth cookies must be SameSite=None (with Secure) to be sent
  // on cross-site requests. Locally they stay Lax.
  sameSite: (env.isProd ? 'none' : 'lax') as 'none' | 'lax',
  secure: env.isProd,
  path: '/',
};

function setAuthCookies(res: import('express').Response, access: string, refresh: string, refreshExpires: Date) {
  res.cookie(ACCESS_COOKIE, access, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...cookieOpts, expires: refreshExpires });
}

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await verifyPassword(user.passwordHash, password) : false;
    if (!user || !valid || !user.isActive) throw ApiError.unauthorized('Invalid email or password');

    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refresh = await createRefreshToken(user.id, { userAgent: req.headers['user-agent'], ip: req.ip });
    setAuthCookies(res, access, refresh.raw, refresh.expiresAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await audit({ userId: user.id, action: 'login', entity: 'Auth', ip: req.ip });

    return ok(res, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: access,
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) throw ApiError.unauthorized();
    const result = await rotateRefreshToken(raw, { userAgent: req.headers['user-agent'], ip: req.ip });
    if (!result) throw ApiError.unauthorized('Session expired');
    const access = signAccessToken({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });
    setAuthCookies(res, access, result.refresh.raw, result.refresh.expiresAt);
    return ok(res, {
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
      accessToken: access,
    });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) await revokeRefreshToken(raw);
    res.clearCookie(ACCESS_COOKIE, cookieOpts);
    res.clearCookie(REFRESH_COOKIE, cookieOpts);
    return message(res, 'Logged out');
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return ok(res, user);
  }),
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      throw ApiError.badRequest('Provide currentPassword and a newPassword of at least 8 characters');
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await revokeAllForUser(user.id);
    res.clearCookie(ACCESS_COOKIE, cookieOpts);
    res.clearCookie(REFRESH_COOKIE, cookieOpts);
    return message(res, 'Password changed. Please sign in again.');
  }),
);

// ---- User & role management (SUPER_ADMIN only) ---------------------------

router.get(
  '/users',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, users);
  }),
);

router.post(
  '/users',
  requireRole('SUPER_ADMIN'),
  validate({ body: registerUserSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw ApiError.conflict('A user with this email already exists');
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    await audit({ userId: req.user!.sub, action: 'create', entity: 'User', entityId: user.id, ip: req.ip });
    return created(res, user);
  }),
);

router.patch(
  '/users/:id',
  requireRole('SUPER_ADMIN'),
  validate({ body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    await audit({ userId: req.user!.sub, action: 'update', entity: 'User', entityId: user.id, ip: req.ip });
    return ok(res, user);
  }),
);

router.delete(
  '/users/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.sub) throw ApiError.badRequest('You cannot delete your own account');
    await prisma.user.delete({ where: { id: req.params.id } });
    await audit({ userId: req.user!.sub, action: 'delete', entity: 'User', entityId: req.params.id, ip: req.ip });
    return message(res, 'User deleted');
  }),
);

export default router;
