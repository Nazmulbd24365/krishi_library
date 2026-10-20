import { prisma } from '../config/prisma';

/**
 * One-time backfill: replace placeholder / unclear hero slide images with clear
 * high-resolution agriculture photos.
 *
 * Usage:  npm run fix:hero-images
 *
 * Slides are matched by their `order` value (0, 1, 2) so headings stay untouched.
 * Anything beyond those orders is left alone. The seed already uses these URLs for
 * fresh databases; this script fixes an existing database that still holds the old
 * picsum.photos placeholders. After running, every slide image remains editable
 * from the admin dashboard (Hero Slides → Background image).
 */

const heroImg = (id: string, w = 1920, h = 1080) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const REPLACEMENTS: Record<number, { imageUrl: string; imageAlt: string }> = {
  0: { imageUrl: heroImg('1500382017468-9049fed747ef'), imageAlt: 'সবুজ ধানখেত' },
  1: { imageUrl: heroImg('1625246333195-78d9c38ad449'), imageAlt: 'কৃষি প্রযুক্তি' },
  2: { imageUrl: heroImg('1595246140625-573b715d11dc'), imageAlt: 'কৃষি জাদুঘর' },
};

async function main() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });

  if (slides.length === 0) {
    console.log('ℹ️  No hero slides found — nothing to update.');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const slide of slides) {
    const next = REPLACEMENTS[slide.order];
    if (!next) {
      console.log(`↷  Slide "${slide.headingBn}" (order ${slide.order}) — no replacement, skipped.`);
      continue;
    }
    await prisma.heroSlide.update({
      where: { id: slide.id },
      data: { imageUrl: next.imageUrl, imageAlt: next.imageAlt },
    });
    console.log(`✅ Slide "${slide.headingBn}" (order ${slide.order}) image updated.`);
    updated += 1;
  }

  console.log(`\nDone. ${updated} hero slide image(s) updated.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Failed to update hero slide images:', err);
  await prisma.$disconnect();
  process.exit(1);
});
