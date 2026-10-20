import { prisma } from '../config/prisma';

/**
 * Remove obviously-empty/placeholder hero slides (e.g. a stray "H" test entry)
 * so they never appear on the live site.
 *
 * Usage: npm run fix:hero-images -w backend  (companion cleanup)
 *        npm run clean:hero-slides -w backend
 */

async function main() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });

  let removed = 0;
  for (const slide of slides) {
    const heading = (slide.headingBn ?? '').trim();
    const isPlaceholder = heading.length <= 2 || !slide.imageUrl;
    if (isPlaceholder) {
      await prisma.heroSlide.delete({ where: { id: slide.id } });
      console.log(`🗑️  Removed placeholder slide ${slide.id} (heading="${heading}").`);
      removed += 1;
    }
  }

  console.log(`\nDone. ${removed} placeholder slide(s) removed.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Cleanup failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
