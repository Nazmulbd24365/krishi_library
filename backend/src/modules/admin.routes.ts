import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';
import { CAN_EDIT, requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole(...CAN_EDIT));

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [
      books,
      bookCategories,
      programs,
      publications,
      achievements,
      museumItems,
      galleryImages,
      videos,
      notices,
      testimonials,
      boardMembers,
      research,
      links,
      unreadMessages,
      users,
      media,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCategory.count(),
      prisma.program.count(),
      prisma.publication.count(),
      prisma.achievement.count(),
      prisma.museumItem.count(),
      prisma.galleryImage.count(),
      prisma.video.count(),
      prisma.notice.count(),
      prisma.testimonial.count(),
      prisma.boardMember.count(),
      prisma.researchItem.count(),
      prisma.usefulLink.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.user.count(),
      prisma.mediaAsset.count(),
    ]);

    const [recentMessages, recentAudit, pendingTestimonials] = await Promise.all([
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
      prisma.testimonial.count({ where: { status: 'pending' } }),
    ]);

    return ok(res, {
      counts: {
        books,
        bookCategories,
        programs,
        publications,
        achievements,
        museumItems,
        galleryImages,
        videos,
        notices,
        testimonials,
        boardMembers,
        research,
        links,
        unreadMessages,
        users,
        media,
        pendingTestimonials,
      },
      recentMessages,
      recentAudit,
    });
  }),
);

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const entity = typeof req.query.entity === 'string' && req.query.entity ? { entity: req.query.entity } : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: entity,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where: entity }),
    ]);
    return ok(res, items, { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  }),
);

export default router;
