import { Router } from 'express';
import authRoutes from '../modules/auth.routes';
import weatherRoutes from '../modules/weather.routes';
import singletonRoutes from '../modules/singleton.routes';
import navigationRoutes from '../modules/navigation.routes';
import statisticsRoutes from '../modules/statistics.routes';
import searchRoutes from '../modules/search.routes';
import contactRoutes from '../modules/contact.routes';
import uploadRoutes from '../modules/upload.routes';
import booksImportRoutes from '../modules/books-import.routes';
import adminRoutes from '../modules/admin.routes';
import metaRoutes from '../modules/meta.routes';
import shareRoutes from '../modules/share.routes';
import { RESOURCES } from '../modules/registry';
import { createAdminRouter, createPublicRouter } from '../modules/crud.factory';

const router = Router();

// ---- Custom modules -------------------------------------------------------
router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/search', searchRoutes);
router.use('/contact', contactRoutes);
router.use('/navigation', navigationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/', metaRoutes);
router.use('/', shareRoutes);

// Singletons: /settings, /about, /founder-message, /mission-vision
router.use('/', singletonRoutes);

// Admin utilities
router.use('/admin', adminRoutes);
router.use('/admin/uploads', uploadRoutes);
router.use('/admin/books', booksImportRoutes);

// ---- Generic CRUD resources ----------------------------------------------
// Public read-only mounts
for (const resource of RESOURCES) {
  router.use(`/${resource.path}`, createPublicRouter(resource.config));
}

// Admin full-CRUD mounts
for (const resource of RESOURCES) {
  router.use(`/admin/${resource.path}`, createAdminRouter(resource.config));
}

// `/admin/statistics` already exists as a generic CRUD resource above,
// but the public statistics aggregate lives at /statistics.

export default router;
