import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok, message, created } from '../utils/api-response';
import { validate } from '../middleware/validate';
import { navigationSchema } from './schemas';
import { CAN_EDIT, requireAuth, requireRole } from '../middleware/auth';
import { audit } from '../services/audit.service';
import { ApiError } from '../utils/http-error';

const router = Router();

async function tree() {
  const items = await prisma.navigationItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  const byId = new Map<string, Record<string, unknown> & { children: unknown[] }>();
  items.forEach((i) => byId.set(i.id, { ...i, children: [] }));
  const roots: unknown[] = [];
  byId.forEach((node) => {
    const parentId = node.parentId as string | null;
    if (parentId && byId.has(parentId)) (byId.get(parentId)!.children as unknown[]).push(node);
    else roots.push(node);
  });
  return roots;
}

// Public: returns the active navigation tree
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.navigationItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    const byId = new Map<string, Record<string, unknown> & { children: unknown[] }>();
    items.forEach((i) => byId.set(i.id, { ...i, children: [] }));
    const roots: unknown[] = [];
    byId.forEach((node) => {
      const parentId = node.parentId as string | null;
      if (parentId && byId.has(parentId)) (byId.get(parentId)!.children as unknown[]).push(node);
      else roots.push(node);
    });
    return ok(res, roots);
  }),
);

// Admin: flat + tree
router.get(
  '/all',
  requireAuth,
  requireRole(...CAN_EDIT),
  asyncHandler(async (_req, res) => {
    const [flat, nested] = await Promise.all([
      prisma.navigationItem.findMany({ orderBy: [{ order: 'asc' }] }),
      tree(),
    ]);
    return ok(res, { flat, tree: nested });
  }),
);

router.post(
  '/',
  requireAuth,
  requireRole(...CAN_EDIT),
  validate({ body: navigationSchema }),
  asyncHandler(async (req, res) => {
    const item = await prisma.navigationItem.create({ data: req.body });
    await audit({ userId: req.user!.sub, action: 'create', entity: 'NavigationItem', entityId: item.id, ip: req.ip });
    return created(res, item);
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(...CAN_EDIT),
  validate({ body: navigationSchema.partial() }),
  asyncHandler(async (req, res) => {
    if (req.body.parentId === req.params.id) throw ApiError.badRequest('An item cannot be its own parent');
    const item = await prisma.navigationItem.update({ where: { id: req.params.id }, data: req.body });
    await audit({ userId: req.user!.sub, action: 'update', entity: 'NavigationItem', entityId: item.id, ip: req.ip });
    return ok(res, item);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(...CAN_EDIT),
  asyncHandler(async (req, res) => {
    await prisma.navigationItem.delete({ where: { id: req.params.id } });
    await audit({ userId: req.user!.sub, action: 'delete', entity: 'NavigationItem', entityId: req.params.id, ip: req.ip });
    return message(res, 'Navigation item deleted');
  }),
);

export default router;
