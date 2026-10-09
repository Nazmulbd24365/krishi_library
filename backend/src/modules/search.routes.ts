import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';
import { searchLimiter } from '../middleware/rate-limit';

const router = Router();

interface Hit {
  type: string;
  id: string;
  title: string;
  subtitle?: string | null;
  url: string;
  image?: string | null;
}

/** Categorized global search across public content. */
router.get(
  '/',
  searchLimiter,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return ok(res, { query: q, groups: [] });
    const contains = { contains: q, mode: 'insensitive' as const };

    const [books, programs, publications, museum, gallery, videos, notices] = await Promise.all([
      prisma.book.findMany({
        where: { status: 'published', OR: [{ nameBn: contains }, { nameEn: contains }, { authorBn: contains }, { authorEn: contains }] },
        take: 5,
      }),
      prisma.program.findMany({
        where: { status: 'published', OR: [{ titleBn: contains }, { titleEn: contains }] },
        take: 5,
      }),
      prisma.publication.findMany({
        where: { status: 'published', OR: [{ titleBn: contains }, { titleEn: contains }] },
        take: 5,
      }),
      prisma.museumItem.findMany({
        where: { status: 'published', OR: [{ titleBn: contains }, { titleEn: contains }] },
        take: 5,
      }),
      prisma.galleryImage.findMany({
        where: { isActive: true, OR: [{ captionBn: contains }, { captionEn: contains }, { altText: contains }] },
        take: 5,
      }),
      prisma.video.findMany({
        where: { status: 'published', OR: [{ titleBn: contains }, { titleEn: contains }] },
        take: 5,
      }),
      prisma.notice.findMany({
        where: { isActive: true, OR: [{ titleBn: contains }, { titleEn: contains }] },
        take: 5,
      }),
    ]);

    const groups: { key: string; labelBn: string; labelEn: string; items: Hit[] }[] = [
      {
        key: 'books',
        labelBn: 'বই',
        labelEn: 'Books',
        items: books.map((b) => ({ type: 'book', id: b.id, title: b.nameBn, subtitle: b.authorBn, url: `/library/${b.id}`, image: b.coverImage })),
      },
      {
        key: 'programs',
        labelBn: 'প্রোগ্রাম',
        labelEn: 'Programs',
        items: programs.map((p) => ({ type: 'program', id: p.id, title: p.titleBn, subtitle: String(p.year), url: `/programs/${p.id}` })),
      },
      {
        key: 'publications',
        labelBn: 'প্রকাশনা',
        labelEn: 'Publications',
        items: publications.map((p) => ({ type: 'publication', id: p.id, title: p.titleBn, subtitle: p.author, url: `/publication/${p.id}`, image: p.coverImage })),
      },
      {
        key: 'museum',
        labelBn: 'জাদুঘর',
        labelEn: 'Museum',
        items: museum.map((m) => ({ type: 'museum', id: m.id, title: m.titleBn, subtitle: m.categoryName, url: `/museum/${m.id}`, image: m.imageUrl })),
      },
      {
        key: 'gallery',
        labelBn: 'গ্যালারি',
        labelEn: 'Gallery',
        items: gallery.map((g) => ({ type: 'gallery', id: g.id, title: g.captionBn ?? g.altText ?? 'Image', url: '/gallery', image: g.imageUrl })),
      },
      {
        key: 'videos',
        labelBn: 'ভিডিও',
        labelEn: 'Videos',
        items: videos.map((v) => ({ type: 'video', id: v.id, title: v.titleBn, subtitle: v.category, url: `/videos/${v.id}`, image: v.thumbnailUrl })),
      },
      {
        key: 'notices',
        labelBn: 'নোটিশ',
        labelEn: 'Notices',
        items: notices.map((n) => ({ type: 'notice', id: n.id, title: n.titleBn, url: n.url || `/notices/${n.id}` })),
      },
    ].filter((g) => g.items.length > 0);

    return ok(res, { query: q, groups });
  }),
);

export default router;
