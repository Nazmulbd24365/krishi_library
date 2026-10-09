import { Router } from 'express';
import { createSingletonRouter } from './crud.factory';
import { aboutSchema, founderSchema, missionSchema, settingsSchema } from './schemas';

const router = Router();

router.use(
  '/settings',
  createSingletonRouter({ model: 'siteSettings', entity: 'SiteSettings', id: 'settings', updateSchema: settingsSchema }),
);
router.use(
  '/about',
  createSingletonRouter({ model: 'aboutContent', entity: 'AboutContent', id: 'about', updateSchema: aboutSchema }),
);
router.use(
  '/founder-message',
  createSingletonRouter({ model: 'founderMessage', entity: 'FounderMessage', id: 'founder', updateSchema: founderSchema }),
);
router.use(
  '/mission-vision',
  createSingletonRouter({ model: 'missionVision', entity: 'MissionVision', id: 'mission', updateSchema: missionSchema }),
);

export default router;
