import { next } from '@vercel/functions';

/**
 * Vercel Routing Middleware.
 *
 * The SAIL frontend is a client-rendered Vite SPA. Social crawlers (Facebook,
 * WhatsApp, X/Twitter, LinkedIn, Slack, Telegram, Discord, ...) do not execute
 * JavaScript, so they would only ever see the static tags in index.html.
 *
 * For those user agents we fetch page-specific metadata from the public
 * `/api/v1/share-meta` endpoint and return a small prerendered HTML document
 * with the correct Open Graph and Twitter Card tags. Regular visitors continue
 * to receive the normal SPA.
 *
 * Required production env var: VITE_API_URL (set in the Vercel dashboard).
 */
export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!assets/|api/|uploads/|og-default\\.png|favicon\\.svg|robots\\.txt|sitemap\\.xml).*)'],
};

export const CRAWLER_PATTERN =
  /facebookexternalhit|facebookcatalog|facebot|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|pinterest|discordbot|googlebot|bingbot|applebot|yandexbot|duckduckbot|embedly|quora link preview|redditbot|skypeuripreview|vkshare|w3c_validator|bitlybot/i;

interface Meta {
  title: string;
  description: string;
  image?: string | null;
  type: 'website' | 'article';
}

const SITE_NAME = 'Shah Agriculture Information Library';
const DEFAULT_TITLE = 'শাহ কৃষি তথ্য পাঠাগার | Shah Agriculture Information Library';
const DEFAULT_DESCRIPTION =
  'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর — কৃষি তথ্য, শিক্ষা, গবেষণা ও জাদুঘর সংগ্রহ।';

const PAGE_META: Record<string, Meta> = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: 'website' },
  '/about': {
    title: 'আমাদের সম্পর্কে | About Us',
    description: 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘরের ইতিহাস, লক্ষ্য ও পরিচিতি।',
    type: 'website',
  },
  '/library': {
    title: 'পাঠাগার | Library',
    description: 'বাংলা ও ইংরেজি কৃষি বইয়ের অনলাইন তালিকা, লেখক, প্রকাশনা ও র্যাক তথ্য।',
    type: 'website',
  },
  '/museum': {
    title: 'জাদুঘর | Museum',
    description: 'কৃষি ঐতিহ্য ও কৃষক জীবনের দুর্লভ সংগ্রহে সমৃদ্ধ জাদুঘর।',
    type: 'website',
  },
  '/gallery': {
    title: 'গ্যালারি | Gallery',
    description: 'পাঠাগার, জাদুঘর ও কৃষি কার্যক্রমের ছবির সংগ্রহ।',
    type: 'website',
  },
  '/programs': {
    title: 'কার্যক্রম | Programs',
    description: 'শাহ কৃষি তথ্য পাঠাগারের আয়োজিত কৃষি কর্মশালা, মেলা ও কার্যক্রম।',
    type: 'website',
  },
  '/publication': {
    title: 'প্রকাশনা | Publications',
    description: 'কৃষি বিষয়ক প্রকাশনা, প্রতিবেদন ও ডিজিটাল প্রকাশনার সংগ্রহ।',
    type: 'website',
  },
  '/achievement': {
    title: 'অর্জন | Achievements',
    description: 'শাহ কৃষি তথ্য পাঠাগারের অর্জন ও স্বীকৃতির তালিকা।',
    type: 'website',
  },
  '/board-members': {
    title: 'বোর্ড সদস্য | Board Members',
    description: 'পাঠাগারের পরিচালনা পর্ষদ ও বোর্ড সদস্যদের পরিচিতি।',
    type: 'website',
  },
  '/links': {
    title: 'লিংক | Useful Links',
    description: 'কৃষি ও সংশ্লিষ্ট প্রতিষ্ঠানের দরকারি ওয়েবসাইটের লিংক।',
    type: 'website',
  },
  '/research': {
    title: 'গবেষণা | Research',
    description: 'কৃষি গবেষণা, প্রতিবেদন ও প্রকাশিত নিবন্ধের সংগ্রহ।',
    type: 'website',
  },
  '/videos': {
    title: 'ভিডিও | Videos',
    description: 'কৃষি কার্যক্রম, সংবাদ ও প্রামাণ্যচিত্রের ভিডিও সংগ্রহ।',
    type: 'website',
  },
  '/notices': {
    title: 'নোটিশ | Notices',
    description: 'শাহ কৃষি তথ্য পাঠাগারের সর্বশেষ নোটিশ ও ঘোষণা।',
    type: 'website',
  },
  '/contact': {
    title: 'যোগাযোগ | Contact Us',
    description: 'ঠিকানা, ফোন, ইমেইল ও যোগাযোগের ফর্ম।',
    type: 'website',
  },
  '/weather': {
    title: 'আবহাওয়ার আপডেট | Weather Update',
    description: 'বাংলাদেশের আটটি বিভাগের বর্তমান আবহাওয়া, তাপমাত্রা, আর্দ্রতা ও বাতাসের গতি।',
    type: 'website',
  },
  '/privacy': {
    title: 'গোপনীয়তা নীতি | Privacy Policy',
    description: 'শাহ কৃষি তথ্য পাঠাগারের গোপনীয়তা নীতি।',
    type: 'website',
  },
  '/terms': {
    title: 'ব্যবহারের শর্তাবলি | Terms of Use',
    description: 'শাহ কৃষি তথ্য পাঠাগার ওয়েবসাইট ব্যবহারের শর্তাবলি।',
    type: 'website',
  },
};

const SECTION_FALLBACK: Record<string, Meta> = {
  library: PAGE_META['/library'],
  programs: PAGE_META['/programs'],
  publication: PAGE_META['/publication'],
  videos: PAGE_META['/videos'],
  notices: PAGE_META['/notices'],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveImage(image: string | null | undefined, origin: string): string {
  const value = (image ?? '').trim();
  if (!value) return `${origin}/og-default.png`;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, origin).toString();
}

export function fallbackMeta(pathname: string): Meta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const section = pathname.split('/').filter(Boolean)[0];
  if (section && SECTION_FALLBACK[section]) {
    return {
      ...SECTION_FALLBACK[section],
      title: `${SECTION_FALLBACK[section].title} — ${SITE_NAME}`,
      type: 'article',
    };
  }
  return PAGE_META['/'];
}

async function loadMeta(pathname: string): Promise<Meta> {
  const fallback = fallbackMeta(pathname);
  const apiBase = (process.env.VITE_API_URL || process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');
  if (!apiBase) return fallback;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(
      `${apiBase}/share-meta?path=${encodeURIComponent(pathname)}`,
      {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (!response.ok) return fallback;

    const payload = (await response.json()) as { data?: Partial<Meta> };
    const data = payload?.data;
    if (!data?.title) return fallback;

    return {
      title: data.title,
      description: data.description || fallback.description,
      image: data.image ?? null,
      type: data.type === 'article' ? 'article' : 'website',
    };
  } catch {
    return fallback;
  }
}

export function renderHtml(meta: Meta, canonical: string): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(canonical);
  const image = escapeHtml(resolveImage(meta.image, new URL(canonical).origin));

  return `<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:locale" content="bn_BD" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:url" content="${url}" />
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${description}</p>
      <p><a href="${url}">${url}</a></p>
    </main>
  </body>
</html>`;
}

export default async function middleware(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const userAgent = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_PATTERN.test(userAgent)) return next();

  const url = new URL(request.url);
  let pathname = url.pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  if (!pathname) pathname = '/';

  const meta = await loadMeta(pathname);
  const canonical = `${url.origin}${pathname === '/' ? '/' : pathname}`;
  const html = renderHtml(meta, canonical);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      vary: 'User-Agent',
      'x-sail-prerender': '1',
    },
  });
}
