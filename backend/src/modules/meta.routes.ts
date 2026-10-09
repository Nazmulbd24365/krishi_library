import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';

const router = Router();

/** Distinct years that have at least one published program, newest first. */
router.get(
  '/program-years',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.program.findMany({
      where: { status: 'published' },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });
    return ok(res, rows.map((r) => r.year));
  }),
);

export default router;
