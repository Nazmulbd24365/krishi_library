import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';

const router = Router();

const COUNTERS: Record<string, () => Promise<number>> = {
  books: () => prisma.book.count({ where: { status: 'published' } }),
  programs: () => prisma.program.count({ where: { status: 'published' } }),
  publications: () => prisma.publication.count({ where: { status: 'published' } }),
  achievements: () => prisma.achievement.count({ where: { status: 'published' } }),
};

/**
 * Public statistics used by the animated counter widgets.
 * Values come from real database counts unless an admin explicitly
 * enables a manual override for a given statistic.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.statisticSetting.findMany({ orderBy: { order: 'asc' } });
    const results = await Promise.all(
      settings.map(async (s) => {
        const count = COUNTERS[s.key] ? await COUNTERS[s.key]() : 0;
        return {
          key: s.key,
          labelBn: s.labelBn,
          labelEn: s.labelEn,
          value: s.useManual ? s.value : count,
          manual: s.useManual,
          order: s.order,
        };
      }),
    );
    return ok(res, results);
  }),
);

export default router;
