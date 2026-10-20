import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/async-handler';
import { ok } from '../utils/api-response';

const router = Router();

interface ShareMeta {
  title: string;
  description: string;
  image: string | null;
  type: 'website' | 'article';
}

const SITE_FALLBACK = {
  bn: 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর',
  en: 'Shah Agriculture Information Library and Museum',
  descBn: 'কৃষি তথ্য, শিক্ষা ও জাদুঘর — বাংলাদেশের কৃষি ঐতিহ্য ও জ্ঞানকেন্দ্র।',
  descEn: 'Agricultural information, education and museum — a knowledge centre for Bangladesh.',
};

function pick(bn?: string | null, en?: string | null): string {
  return (bn ?? '').trim() || (en ?? '').trim();
}

/** Collapse whitespace / strip any markup and cap the description length. */
function clip(value?: string | null, max = 200): string {
  const text = (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`~\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Make stored media URLs absolute. Relative frontend assets are resolved by the caller. */
function absoluteImage(value?: string | null): string | null {
  const image = (value ?? '').trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
  if (image.startsWith('/uploads')) {
    return `${env.PUBLIC_API_URL.replace(/\/$/, '')}${image}`;
  }
  return image;
}

const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${SITE_FALLBACK.bn} | ${SITE_FALLBACK.en}`,
    description: `${SITE_FALLBACK.descBn} ${SITE_FALLBACK.descEn}`,
  },
  '/about': {
    title: 'আমাদের সম্পর্কে | About Us',
    description: 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘরের ইতিহাস, লক্ষ্য ও পরিচিতি।',
  },
  '/library': {
    title: 'পাঠাগার | Library',
    description: 'বাংলা ও ইংরেজি কৃষি বইয়ের অনলাইন তালিকা, লেখক, প্রকাশনা ও র্যাক তথ্য।',
  },
  '/museum': {
    title: 'জাদুঘর | Museum',
    description: 'কৃষি ঐতিহ্য ও কৃষক জীবনের দুর্লভ সংগ্রহে সমৃদ্ধ জাদুঘর।',
  },
  '/gallery': {
    title: 'গ্যালারি | Gallery',
    description: 'পাঠাগার, জাদুঘর ও কৃষি কার্যক্রমের ছবির সংগ্রহ।',
  },
  '/programs': {
    title: 'কার্যক্রম | Programs',
    description: 'শাহ কৃষি তথ্য পাঠাগারের আয়োজিত কৃষি কর্মশালা, মেলা ও কার্যক্রম।',
  },
  '/publication': {
    title: 'প্রকাশনা | Publications',
    description: 'কৃষি বিষয়ক প্রকাশনা, প্রতিবেদন ও ডিজিটাল প্রকাশনার সংগ্রহ।',
  },
  '/achievement': {
    title: 'অর্জন | Achievements',
    description: 'শাহ কৃষি তথ্য পাঠাগারের অর্জন ও স্বীকৃতির তালিকা।',
  },
  '/board-members': {
    title: 'বোর্ড সদস্য | Board Members',
    description: 'পাঠাগারের পরিচালনা পর্ষদ ও বোর্ড সদস্যদের পরিচিতি।',
  },
  '/links': {
    title: 'লিংক | Useful Links',
    description: 'কৃষি ও সংশ্লিষ্ট প্রতিষ্ঠানের দরকারি ওয়েবসাইটের লিংক।',
  },
  '/research': {
    title: 'গবেষণা | Research',
    description: 'কৃষি গবেষণা, প্রতিবেদন ও প্রকাশিত নিবন্ধের সংগ্রহ।',
  },
  '/videos': {
    title: 'ভিডিও | Videos',
    description: 'কৃষি কার্যক্রম, সংবাদ ও প্রামাণ্যচিত্রের ভিডিও সংগ্রহ।',
  },
  '/notices': {
    title: 'নোটিশ | Notices',
    description: 'শাহ কৃষি তথ্য পাঠাগারের সর্বশেষ নোটিশ ও ঘোষণা।',
  },
  '/contact': {
    title: 'যোগাযোগ | Contact Us',
    description: 'ঠিকানা, ফোন, ইমেইল ও যোগাযোগের ফর্ম।',
  },
  '/weather': {
    title: 'আবহাওয়ার আপডেট | Weather Update',
    description: 'বাংলাদেশের আটটি বিভাগের বর্তমান আবহাওয়া, তাপমাত্রা, আর্দ্রতা ও বাতাসের গতি।',
  },
  '/privacy': {
    title: 'গোপনীয়তা নীতি | Privacy Policy',
    description: 'শাহ কৃষি তথ্য পাঠাগারের গোপনীয়তা নীতি।',
  },
  '/terms': {
    title: 'ব্যবহারের শর্তাবলি | Terms of Use',
    description: 'শাহ কৃষি তথ্য পাঠাগার ওয়েবসাইট ব্যবহারের শর্তাবলি।',
  },
};

function resolvePath(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '/';
  try {
    // Strip query/hash and normalise duplicate slashes without trusting the input.
    const parsed = new URL(value.startsWith('http') ? value : `http://local${value.startsWith('/') ? '' : '/'}${value}`);
    let pathname = decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    if (pathname.includes('..')) return '/';
    return pathname;
  } catch {
    return '/';
  }
}

async function siteDefaults(): Promise<ShareMeta> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'settings' } }).catch(() => null);
  return {
    title: pick(settings?.metaTitleBn, settings?.metaTitleEn) || SITE_FALLBACK.bn,
    description:
      clip(pick(settings?.metaDescriptionBn, settings?.metaDescriptionEn)) ||
      clip(pick(settings?.taglineBn, settings?.taglineEn)) ||
      SITE_FALLBACK.descBn,
    image: absoluteImage(settings?.logoUrl),
    type: 'website',
  };
}

async function dynamicMeta(segments: string[], fallback: ShareMeta): Promise<ShareMeta | null> {
  const [section, id] = segments;
  if (!id) return null;

  if (section === 'library') {
    const book = await prisma.book.findFirst({
      where: { id, status: 'published' },
      select: { nameBn: true, nameEn: true, description: true, authorBn: true, authorEn: true, coverImage: true },
    });
    if (!book) return null;
    const author = pick(book.authorBn, book.authorEn);
    return {
      title: `${pick(book.nameBn, book.nameEn)} | ${fallback.title}`,
      description: clip(book.description) || clip(`লেখক: ${author}`) || fallback.description,
      image: absoluteImage(book.coverImage) ?? fallback.image,
      type: 'article',
    };
  }

  if (section === 'programs') {
    const program = await prisma.program.findFirst({
      where: { id, status: 'published' },
      select: {
        titleBn: true,
        titleEn: true,
        descriptionBn: true,
        descriptionEn: true,
        location: true,
        images: { select: { imageUrl: true }, orderBy: { order: 'asc' }, take: 1 },
      },
    });
    if (!program) return null;
    return {
      title: `${pick(program.titleBn, program.titleEn)} | ${fallback.title}`,
      description: clip(pick(program.descriptionBn, program.descriptionEn)) || clip(program.location) || fallback.description,
      image: absoluteImage(program.images[0]?.imageUrl) ?? fallback.image,
      type: 'article',
    };
  }

  if (section === 'publication') {
    const publication = await prisma.publication.findFirst({
      where: { id, status: 'published' },
      select: { titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true, coverImage: true },
    });
    if (!publication) return null;
    return {
      title: `${pick(publication.titleBn, publication.titleEn)} | ${fallback.title}`,
      description: clip(pick(publication.descriptionBn, publication.descriptionEn)) || fallback.description,
      image: absoluteImage(publication.coverImage) ?? fallback.image,
      type: 'article',
    };
  }

  if (section === 'videos') {
    const video = await prisma.video.findFirst({
      where: { id, status: 'published' },
      select: { titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true, thumbnailUrl: true, youtubeId: true },
    });
    if (!video) return null;
    const youtubeThumb = video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : null;
    return {
      title: `${pick(video.titleBn, video.titleEn)} | ${fallback.title}`,
      description: clip(pick(video.descriptionBn, video.descriptionEn)) || fallback.description,
      image: absoluteImage(video.thumbnailUrl) ?? youtubeThumb ?? fallback.image,
      type: 'article',
    };
  }

  if (section === 'notices') {
    const notice = await prisma.notice.findFirst({
      where: { id, isActive: true },
      select: { titleBn: true, titleEn: true, contentBn: true, contentEn: true },
    });
    if (!notice) return null;
    return {
      title: `${pick(notice.titleBn, notice.titleEn)} | ${fallback.title}`,
      description: clip(pick(notice.contentBn, notice.contentEn)) || fallback.description,
      image: fallback.image,
      type: 'article',
    };
  }

  return null;
}

/**
 * Public metadata for social crawlers (Open Graph / Twitter cards).
 *
 * The React app is a client-rendered SPA, so crawlers cannot see metadata
 * updated by JavaScript. Vercel Edge Middleware calls this endpoint for known
 * bot user agents and prerenders a small HTML document with the tags below.
 */
router.get(
  '/share-meta',
  asyncHandler(async (req, res) => {
    const path = resolvePath(req.query.path);
    const segments = path.split('/').filter(Boolean);
    const fallback = await siteDefaults();

    let meta: ShareMeta | null = null;
    if (segments.length >= 2) {
      meta = await dynamicMeta(segments, fallback).catch(() => null);
    }
    if (!meta) {
      const page = STATIC_PAGES[path];
      meta = page
        ? {
            title: page.title,
            description: page.description,
            image: fallback.image,
            type: 'website',
          }
        : {
            title: fallback.title,
            description: fallback.description,
            image: fallback.image,
            type: 'website',
          };
    }

    return ok(res, { path, ...meta });
  }),
);

export default router;
