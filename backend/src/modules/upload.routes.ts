import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok, created, message } from '../utils/api-response';
import { ApiError } from '../utils/http-error';
import { uploadImage, uploadDocument } from '../middleware/upload';
import { CAN_EDIT, requireAuth, requireRole } from '../middleware/auth';
import { audit } from '../services/audit.service';
import { saveUploadedFile, deleteStoredFile } from '../services/storage.service';

const router = Router();
router.use(requireAuth, requireRole(...CAN_EDIT));

router.post(
  '/image',
  uploadImage.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image uploaded');
    const { filename, url } = await saveUploadedFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      subfolder: 'images',
    });
    const asset = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: req.file.originalname,
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folder: 'images',
      },
    });
    await audit({ userId: req.user!.sub, action: 'upload', entity: 'MediaAsset', entityId: asset.id, ip: req.ip });
    return created(res, asset);
  }),
);

router.post(
  '/document',
  uploadDocument.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No document uploaded');
    const { filename, url } = await saveUploadedFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      subfolder: 'documents',
    });
    const asset = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: req.file.originalname,
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folder: 'documents',
      },
    });
    await audit({ userId: req.user!.sub, action: 'upload', entity: 'MediaAsset', entityId: asset.id, ip: req.ip });
    return created(res, asset);
  }),
);

router.get(
  '/media',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 24);
    const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;
    const where = folder ? { folder } : {};
    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.mediaAsset.count({ where }),
    ]);
    return ok(res, items, { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

router.delete(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
    if (!asset) throw ApiError.notFound();
    await deleteStoredFile(asset.folder, asset.filename);
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    return message(res, 'Media deleted');
  }),
);

export default router;
