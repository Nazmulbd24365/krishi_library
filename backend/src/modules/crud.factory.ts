import { Router, type Request, type Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/http-error';
import { buildMeta, parseListQuery, skipTake } from '../utils/pagination';
import { created, message, ok } from '../utils/api-response';
import { audit } from '../services/audit.service';
import { CAN_EDIT, requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

export interface CrudConfig {
  /** Prisma delegate name, e.g. "book" */
  model: string;
  /** Audit entity label, e.g. "Book" */
  entity: string;
  /** Fields searched with a case-insensitive contains */
  searchFields?: string[];
  /** Query params that map directly to equality filters */
  filterFields?: Record<string, 'string' | 'boolean' | 'int'>;
  /** Prisma include / relations to return */
  include?: Record<string, unknown>;
  /** Public listing restriction (e.g. { status: 'published' }) */
  publicWhere?: Record<string, unknown> | ((q: URLSearchParams) => Record<string, unknown>);
  /** Default ordering applied in addition to list sort */
  defaultOrder?: Record<string, unknown>[];
  /** Fields the client may sort by */
  sortable?: string[];
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** Called before create/update to mutate/validate payload */
  beforeWrite?: (data: Record<string, unknown>, req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Publish toggle field + values */
  publishField?: string; // default "status"
  activeField?: string; // default "isActive"
}

function delegate(model: string) {
  const d = (prisma as unknown as Record<string, { [k: string]: (...a: unknown[]) => Promise<unknown> }>)[model];
  if (!d) throw new Error(`Unknown Prisma model: ${model}`);
  return d as Record<string, (...args: any[]) => Promise<any>>;
}

function buildWhere(cfg: CrudConfig, req: Request, isPublic: boolean) {
  const where: Record<string, unknown> = {};
  if (isPublic && cfg.publicWhere) {
    Object.assign(where, typeof cfg.publicWhere === 'function' ? cfg.publicWhere(new URLSearchParams(req.query as Record<string, string>)) : cfg.publicWhere);
  }
  const q = parseListQuery(req.query as Record<string, unknown>);
  if (q.search && cfg.searchFields?.length) {
    where.OR = cfg.searchFields.map((f) => ({ [f]: { contains: q.search, mode: 'insensitive' } }));
  }
  for (const [key, type] of Object.entries(cfg.filterFields ?? {})) {
    const raw = (req.query as Record<string, unknown>)[key];
    if (raw === undefined || raw === '' || raw === 'all') continue;
    if (type === 'boolean') where[key] = raw === 'true' || raw === '1';
    else if (type === 'int') where[key] = Number(raw);
    else where[key] = raw;
  }
  return where;
}

function orderByFor(cfg: CrudConfig, req: Request) {
  const q = parseListQuery(req.query as Record<string, unknown>);
  const allowed = cfg.sortable ?? ['createdAt', 'updatedAt', 'id', 'order'];
  const sort = allowed.includes(q.sort) ? q.sort : (cfg.defaultOrder?.[0] ? Object.keys(cfg.defaultOrder[0])[0] : 'createdAt');
  const dir = allowed.includes(q.sort) ? q.order : (cfg.defaultOrder?.[0] ? (Object.values(cfg.defaultOrder[0])[0] as 'asc' | 'desc') : 'desc');
  return [{ [sort]: dir }, ...(cfg.defaultOrder ?? [])];
}

/** Public read-only router (list + detail). */
export function createPublicRouter(cfg: CrudConfig) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const q = parseListQuery(req.query as Record<string, unknown>);
      const where = buildWhere(cfg, req, true);
      const db = delegate(cfg.model);
      const [items, total] = await Promise.all([
        db.findMany({ where, include: cfg.include, orderBy: orderByFor(cfg, req), ...skipTake(q) }),
        db.count({ where }),
      ]);
      return ok(res, items, buildMeta(q.page, q.pageSize, total));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const where: Record<string, unknown> = { id: req.params.id };
      if (cfg.publicWhere) {
        Object.assign(where, typeof cfg.publicWhere === 'function' ? cfg.publicWhere(new URLSearchParams()) : cfg.publicWhere);
      }
      const item = await delegate(cfg.model).findFirst({ where, include: cfg.include });
      if (!item) throw ApiError.notFound();
      return ok(res, item);
    }),
  );

  return router;
}

/** Protected admin router (full CRUD + publish toggle). */
export function createAdminRouter(cfg: CrudConfig) {
  const router = Router();
  router.use(requireAuth, requireRole(...CAN_EDIT));

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const q = parseListQuery(req.query as Record<string, unknown>);
      const where = buildWhere(cfg, req, false);
      const db = delegate(cfg.model);
      const [items, total] = await Promise.all([
        db.findMany({ where, include: cfg.include, orderBy: orderByFor(cfg, req), ...skipTake(q) }),
        db.count({ where }),
      ]);
      return ok(res, items, buildMeta(q.page, q.pageSize, total));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = await delegate(cfg.model).findUnique({ where: { id: req.params.id }, include: cfg.include });
      if (!item) throw ApiError.notFound();
      return ok(res, item);
    }),
  );

  router.post(
    '/',
    validate({ body: cfg.createSchema }),
    asyncHandler(async (req, res) => {
      const data = cfg.beforeWrite ? await cfg.beforeWrite(req.body, req) : req.body;
      const item = await delegate(cfg.model).create({ data, include: cfg.include });
      await audit({ userId: req.user?.sub, action: 'create', entity: cfg.entity, entityId: (item as { id: string }).id, ip: req.ip });
      return created(res, item);
    }),
  );

  router.patch(
    '/:id',
    validate({ body: cfg.updateSchema as AnyZodObject }),
    asyncHandler(async (req, res) => {
      const data = cfg.beforeWrite ? await cfg.beforeWrite(req.body, req) : req.body;
      const item = await delegate(cfg.model).update({ where: { id: req.params.id }, data, include: cfg.include });
      await audit({ userId: req.user?.sub, action: 'update', entity: cfg.entity, entityId: req.params.id, ip: req.ip });
      return ok(res, item);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await delegate(cfg.model).delete({ where: { id: req.params.id } });
      await audit({ userId: req.user?.sub, action: 'delete', entity: cfg.entity, entityId: req.params.id, ip: req.ip });
      return message(res, 'Deleted successfully');
    }),
  );

  // Publish / unpublish toggle
  router.patch(
    '/:id/publish',
    asyncHandler(async (req, res) => {
      const active = req.body?.active !== false;
      const publishField = cfg.publishField ?? 'status';
      const useActive = cfg.activeField ?? (publishField ? undefined : 'isActive');
      const data: Record<string, unknown> = publishField
        ? { [publishField]: active ? 'published' : 'draft' }
        : { [useActive as string]: active };
      const item = await delegate(cfg.model).update({ where: { id: req.params.id }, data });
      await audit({ userId: req.user?.sub, action: active ? 'publish' : 'unpublish', entity: cfg.entity, entityId: req.params.id, ip: req.ip });
      return ok(res, item);
    }),
  );

  return router;
}

/** Singleton resource (settings, about, founder, mission). */
export function createSingletonRouter(opts: {
  model: string;
  entity: string;
  id: string;
  updateSchema: ZodTypeAny;
}) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const item = await delegate(opts.model).findUnique({ where: { id: opts.id } });
      if (item) return ok(res, item);
      const fresh = await delegate(opts.model).create({ data: { id: opts.id } });
      return ok(res, fresh);
    }),
  );

  router.put(
    '/',
    requireAuth,
    requireRole(...CAN_EDIT),
    validate({ body: opts.updateSchema }),
    asyncHandler(async (req, res) => {
      const item = await delegate(opts.model).upsert({
        where: { id: opts.id },
        create: { id: opts.id, ...req.body },
        update: req.body,
      });
      await audit({ userId: req.user?.sub, action: 'update', entity: opts.entity, entityId: opts.id, ip: req.ip });
      return ok(res, item);
    }),
  );

  return router;
}
