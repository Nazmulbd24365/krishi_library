import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.SESSION_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, env.SESSION_SECRET) as jwt.JwtPayload & AuthPayload;
    if (!decoded.sub) return null;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export async function createRefreshToken(
  userId: string,
  meta: { userAgent?: string; ip?: string } = {},
) {
  const raw = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash: hash(raw), expiresAt, userAgent: meta.userAgent, ip: meta.ip },
  });
  return { raw, expiresAt };
}

/** Validate a refresh token and rotate it (revoke old, issue new). */
export async function rotateRefreshToken(
  raw: string,
  meta: { userAgent?: string; ip?: string } = {},
) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  await prisma.session.delete({ where: { id: session.id } });
  const next = await createRefreshToken(session.userId, meta);
  return { user: session.user, refresh: next };
}

export async function revokeRefreshToken(raw: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hash(raw) } });
}

export async function revokeAllForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
