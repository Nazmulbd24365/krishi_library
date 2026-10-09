import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export async function audit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: (params.metadata as object) ?? undefined,
        ip: params.ip,
      },
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to write audit log');
  }
}
