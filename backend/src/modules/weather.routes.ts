import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';
import { getAllWeather, getDivisionWeather, findDivision, DIVISIONS } from '../services/weather.service';
import { requireAuth, requireRole } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();

router.get(
  '/divisions',
  asyncHandler(async (_req, res) => ok(res, DIVISIONS.map((d) => ({ key: d.key, nameBn: d.nameBn, nameEn: d.nameEn })))),
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const results = await getAllWeather();
    return ok(res, { provider: env.WEATHER_PROVIDER, units: env.WEATHER_UNITS, divisions: results });
  }),
);

router.get(
  '/:division',
  asyncHandler(async (req, res) => {
    const division = findDivision(req.params.division);
    if (!division) return ok(res, null);
    return ok(res, await getDivisionWeather(division));
  }),
);

// Force a cache refresh (admin only)
router.post(
  '/refresh',
  requireAuth,
  requireRole('SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
  asyncHandler(async (_req, res) => {
    const results = await getAllWeather();
    return ok(res, { refreshed: results.length, divisions: results });
  }),
);

export default router;
