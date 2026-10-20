import { prisma } from '../src/config/prisma';
import { extractYouTubeId, youtubeThumbnail } from '../src/utils/youtube';

const img = (seed: string, w = 1280, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/**
 * Hero slide background images.
 * Uses stable, high-resolution agriculture photographs (Unsplash CDN) instead of
 * random placeholders so the homepage slider always renders clear, relevant images.
 * These are only seed defaults — every slide image stays fully editable from the
 * admin dashboard (Hero Slides → Background image).
 */
const heroImg = (id: string, w = 1920, h = 1080) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const ABOUT_BN = `আমি মো. জাহাঙ্গীর আলম শাহ্। একবারে নিভৃত পল্লিতে কৃষকের ঘরে জন্মগ্রহণ করি। জন্মের পর থেকেই কৃষি ও কৃষকের চাষ-বাস এবং প্রান্তিক চাষীদের জীবন ব্যবস্থার অতীব করুণ ও রুগ্নচিত্র দেখেছি খুব কাছ থেকে। শিশুকাল থেকেই কৃষির প্রতি অনুরাগী ছিলাম। পাশাপাশি কৃষি শিক্ষার ভাণ্ডারের অভাব আমার জীবনকে দারুণভাবে স্পর্শ করতো। মূলত সে কারণেই কৃষি কাঠামোর দ্রুত পরিবর্তনে কৃষক উপযোগী পাঠাগার ও জাদুঘর প্রতিষ্ঠা করি। ২০০৮ খ্রিস্টাব্দে কৃষিতথ্য পাঠাগার ও জাদুঘর কার্যক্রম শুরু করে এজাবতকাল নানা আয়োজনের মাধ্যমে কৃষি শিক্ষা এবং পরিবেশ উন্নয়নে ভূমিকা রেখে চলেছে। বর্তমানে কৃষক, গবেষক, পাঠক, শিক্ষক-শিক্ষার্থী।`;

const FOUNDER_EN = `Agricultural education in the country is not continually developing. Philosophically agricultural problem solving has come only from the knowledge of farmers. So, to build many facets of agricultural education, the agriculture information is required to be added with the farmer's knowledge. But facility of information and knowledge is not accessible to all equally in our country. The farmers deprived of subject wise access to contact scientist/personalities and hungry for specific knowledge based books on agriculture. This reality was the need for establishment of this library of information for farmers. Our farmers are deprived of being great stakeholders on agricultural arena. As the farmers are the backbone of our agricultural system, therefore, it was felt necessary to utilize a proven educational process, one which includes access to education, experiential learning, leadership and personal development. With all these views I intended to establish, a library to provide up-to-date technical skills and knowledge in agriculture; conducting experiential learning activities in the agricultural field at local and national levels. I am happy that with the passage of time, my little endeavour has been able to attract people from home and abroad. May the library and the farmers continue to flourish?`;

const MISSION_EN = `The mission of SAIL is to Provide agricultural information and educational services to the farmers under one umbrella with a view that the farmers may:`;
const VISION_EN = `Shah Krishi Tathya Pathagar (Shah Agriculture Information Library) is dedicated to be the premier agricultural storehouse of knowledge and library of excellence in agricultural information for the farmers of local and national levels.`;
const OBJECTIVES_EN = `Having the vision above, the main objective of SAIL is to provide a farmer basic information on agriculture skills, on both traditional and modern method so that the farmer can develop:`;

async function isEmpty(model: { count: () => Promise<number> }) {
  return (await model.count()) === 0;
}

async function main() {
  console.log('🌱 Seeding SAIL database...');

  // ---- Singletons ---------------------------------------------------------
  await prisma.siteSettings.upsert({
    where: { id: 'settings' },
    create: {
      id: 'settings',
      siteNameBn: 'শাহ কৃষি তথ্য পাঠাগার',
      siteNameEn: 'Shah Agriculture Information Library',
      taglineBn: 'কৃষি তথ্য, শিক্ষা ও জাদুঘর',
      taglineEn: 'Agricultural information, education and museum',
      footerAboutBn: 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর - কৃষক, গবেষক, শিক্ষক-শিক্ষার্থী ও পাঠকদের জন্য কৃষি তথ্যের নির্ভরযোগ্য ভাণ্ডার।',
      footerAboutEn: 'Shah Agriculture Information Library and Museum - a trusted source of agricultural information for farmers, researchers, teachers, students and readers.',
      addressBn: 'গ্রাম: শাহপুর, উপজেলা: সদর, বাংলাদেশ',
      addressEn: 'Shahpur, Sadar, Bangladesh',
      phone1: '+880 1XXX-XXXXXX',
      email1: 'info@sail.local',
      openingHoursBn: 'প্রতিদিন সকাল ৯টা - বিকাল ৫টা',
      openingHoursEn: 'Every day 9:00 AM - 5:00 PM',
      metaTitleBn: 'শাহ কৃষি তথ্য পাঠাগার',
      metaTitleEn: 'Shah Agriculture Information Library',
    },
    update: {},
  });

  await prisma.aboutContent.upsert({
    where: { id: 'about' },
    create: {
      id: 'about',
      headingBn: 'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর',
      headingEn: 'Shah Agriculture Information Library and Museum',
      contentBn: ABOUT_BN,
      contentEn: 'The Shah Agriculture Information Library and Museum was founded by Md. Jahangir Alam Shah to bring agricultural knowledge within reach of every farmer.',
      excerptBn: ABOUT_BN.slice(0, 220) + '...',
      excerptEn: 'Founded in 2008, SAIL works to bring agricultural education, a farmer-friendly library and a museum together under one roof.',
      imageUrl: img('about-sail'),
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    update: {},
  });

  await prisma.founderMessage.upsert({
    where: { id: 'founder' },
    create: {
      id: 'founder',
      nameBn: 'জাহাঙ্গীর আলম শাহ্',
      nameEn: 'Jahangir Alam Shah',
      designationBn: 'প্রতিষ্ঠাতা চেয়ারম্যান',
      designationEn: 'Founder Chairman',
      messageBn: 'কৃষি শিক্ষা ও কৃষকের জ্ঞানকে একত্রিত করে কৃষকের জন্য তথ্যের নির্ভরযোগ্য পাঠাগার গড়ে তোলাই আমাদের লক্ষ্য।',
      messageEn: FOUNDER_EN,
      portraitUrl: img('founder-portrait', 800, 1000),
    },
    update: {},
  });

  await prisma.missionVision.upsert({
    where: { id: 'mission' },
    create: {
      id: 'mission',
      missionEn: MISSION_EN,
      missionBn: 'একটি ছাতার নিচে কৃষকদের কৃষি তথ্য ও শিক্ষা সেবা প্রদান করা।',
      visionEn: VISION_EN,
      visionBn: 'কৃষি তথ্যের ক্ষেত্রে দেশের শীর্ষস্থানীয় জ্ঞানের ভাণ্ডার ও উৎকর্ষের পাঠাগার হওয়া।',
      objectivesEn: OBJECTIVES_EN,
      objectivesBn: 'ঐতিহ্যগত ও আধুনিক পদ্ধতিতে কৃষি দক্ষতার মৌলিক তথ্য কৃষকের কাছে পৌঁছে দেওয়া।',
    },
    update: {},
  });

  // ---- Statistics ---------------------------------------------------------
  const statDefs = [
    { key: 'books', labelBn: 'বই', labelEn: 'Books', order: 0 },
    { key: 'programs', labelBn: 'প্রোগ্রাম', labelEn: 'Programs', order: 1 },
    { key: 'publications', labelBn: 'প্রকাশনা', labelEn: 'Publications', order: 2 },
    { key: 'achievements', labelBn: 'অর্জন', labelEn: 'Achievements', order: 3 },
  ];
  for (const s of statDefs) {
    await prisma.statisticSetting.upsert({ where: { key: s.key }, create: s, update: {} });
  }

  // ---- Navigation ---------------------------------------------------------
  if (await isEmpty(prisma.navigationItem)) {
    const more = await prisma.navigationItem.create({
      data: { labelBn: 'আরও', labelEn: 'More', url: '#', order: 9 },
    });
    const videos = await prisma.navigationItem.create({
      data: { labelBn: 'ভিডিও', labelEn: 'Videos', url: '/videos', order: 10 },
    });
    await prisma.navigationItem.createMany({
      data: [
        { labelBn: 'হোম', labelEn: 'Home', url: '/', order: 0 },
        { labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Us', url: '/about', order: 1 },
        { labelBn: 'পাঠাগার', labelEn: 'Library', url: '/library', order: 2 },
        { labelBn: 'জাদুঘর', labelEn: 'Museum', url: '/museum', order: 3 },
        { labelBn: 'গ্যালারি', labelEn: 'Gallery', url: '/gallery', order: 4 },
        { labelBn: 'কার্যক্রম', labelEn: 'Programs', url: '/programs', order: 5 },
        { labelBn: 'প্রকাশনা', labelEn: 'Publication', url: '/publication', order: 6 },
        { labelBn: 'অর্জন', labelEn: 'Achievement', url: '/achievement', order: 7 },
        { labelBn: 'যোগাযোগ', labelEn: 'Contact Us', url: '/contact', order: 8 },
        { labelBn: 'বোর্ড সদস্য', labelEn: 'Board Members', url: '/board-members', order: 0, parentId: more.id },
        { labelBn: 'লিংক', labelEn: 'Links', url: '/links', order: 1, parentId: more.id },
        { labelBn: 'গবেষণা', labelEn: 'Research', url: '/research', order: 2, parentId: more.id },
        { labelBn: 'কার্যক্রমের খবর', labelEn: 'Programs News', url: '/videos?category=programs-news', order: 0, parentId: videos.id },
        { labelBn: 'প্রেস ও মিডিয়া', labelEn: 'Press And Media', url: '/videos?category=press-media', order: 1, parentId: videos.id },
        { labelBn: 'কৃষি সংবাদ', labelEn: 'Krishi News', url: '/videos?category=krishi-news', order: 2, parentId: videos.id },
      ],
    });
  }

  // ---- Social links -------------------------------------------------------
  if (await isEmpty(prisma.socialLink)) {
    await prisma.socialLink.createMany({
      data: [
        { platform: 'facebook', label: 'Facebook', url: 'https://facebook.com', icon: 'facebook', order: 0 },
        { platform: 'youtube', label: 'YouTube', url: 'https://youtube.com', icon: 'youtube', order: 1 },
        { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com', icon: 'instagram', order: 2 },
        { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', order: 3 },
      ],
    });
  }

  // ---- Notices ------------------------------------------------------------
  if (await isEmpty(prisma.notice)) {
    await prisma.notice.createMany({
      data: [
        { titleBn: 'কৃষি প্রশিক্ষণ কর্মশালা ২০২৬ - নিবন্ধন চলছে', titleEn: 'Agriculture training workshop 2026 - registration open', priority: 3, url: '/programs' },
        { titleBn: 'নতুন কৃষি বই পাঠাগারে যুক্ত হয়েছে', titleEn: 'New agriculture books added to the library', priority: 2, url: '/library' },
        { titleBn: 'জাদুঘরে নতুন সংগ্রহ প্রদর্শনী', titleEn: 'New museum collection exhibition', priority: 1, url: '/museum' },
      ],
    });
  }

  // ---- Hero slides --------------------------------------------------------
  if (await isEmpty(prisma.heroSlide)) {
    await prisma.heroSlide.createMany({
      data: [
        { headingBn: 'কৃষকের জ্ঞানেই কৃষির সমাধান', headingEn: 'Farmer knowledge is the key to agriculture', descriptionBn: 'কৃষি তথ্য, শিক্ষা ও গবেষণার নির্ভরযোগ্য ঠিকানা।', descriptionEn: 'A trusted home for agricultural information, education and research.', buttonTextBn: 'পাঠাগার দেখুন', buttonTextEn: 'Explore Library', buttonUrl: '/library', imageUrl: heroImg('1500382017468-9049fed747ef'), imageAlt: 'সবুজ ধানখেত', order: 0 },
        { headingBn: 'আধুনিক কৃষি প্রযুক্তি শিখুন', headingEn: 'Learn modern agricultural technology', descriptionBn: 'ঐতিহ্য ও আধুনিক পদ্ধতির সমন্বয়ে কৃষি শিক্ষা।', descriptionEn: 'Agricultural education blending tradition and modern methods.', buttonTextBn: 'কার্যক্রম', buttonTextEn: 'Programs', buttonUrl: '/programs', imageUrl: heroImg('1625246333195-78d9c38ad449'), imageAlt: 'কৃষি প্রযুক্তি', order: 1 },
        { headingBn: 'কৃষি জাদুঘর পরিদর্শন করুন', headingEn: 'Visit our agriculture museum', descriptionBn: 'ঐতিহাসিক কৃষি উপকরণ ও শিক্ষামূলক সংগ্রহ।', descriptionEn: 'Historic farming tools and educational collections.', buttonTextBn: 'জাদুঘর', buttonTextEn: 'Museum', buttonUrl: '/museum', imageUrl: heroImg('1595246140625-573b715d11dc'), imageAlt: 'কৃষি জাদুঘর', order: 2 },
      ],
    });
  }

  // ---- Library ------------------------------------------------------------
  if (await isEmpty(prisma.bookCategory)) {
    const cats = await Promise.all(
      [
        { nameBn: 'সাধারণ কৃষি', nameEn: 'General Agriculture', slug: 'general-agriculture' },
        { nameBn: 'ধান ও ফসল', nameEn: 'Rice & Crops', slug: 'rice-crops' },
        { nameBn: 'উদ্ভিদ রোগ', nameEn: 'Plant Disease', slug: 'plant-disease' },
        { nameBn: 'মৎস্য', nameEn: 'Fisheries', slug: 'fisheries' },
        { nameBn: 'পশুপালন', nameEn: 'Livestock', slug: 'livestock' },
      ].map((c, i) => prisma.bookCategory.create({ data: { ...c, order: i } })),
    );
    await prisma.book.createMany({
      data: Array.from({ length: 24 }).map((_, i) => ({
        serialNo: i + 1,
        nameBn: `কৃষি বিষয়ক বই ${i + 1}`,
        nameEn: `Agriculture Book ${i + 1}`,
        authorBn: 'কৃষি বিশেষজ্ঞ',
        authorEn: 'Agriculture Expert',
        copies: (i % 5) + 1,
        rackNo: `R-${Math.floor(i / 6) + 1}`,
        categoryId: cats[i % cats.length].id,
        publisher: 'SAIL',
        publicationYear: 2008 + (i % 15),
        language: 'bn',
        isAvailable: true,
      })),
    });
  }

  // ---- Museum -------------------------------------------------------------
  if (await isEmpty(prisma.museumItem)) {
    await prisma.museumItem.createMany({
      data: [
        { titleBn: 'কাঠের লাঙল', titleEn: 'Wooden Plough', categoryName: 'ঐতিহ্যবাহী যন্ত্রপাতি', imageUrl: img('museum-plough'), imageAlt: 'কাঠের লাঙল', period: '১৯০০-এর দশক', order: 0 },
        { titleBn: 'ধানের মাড়াই যন্ত্র', titleEn: 'Rice Thresher', categoryName: 'কৃষি যন্ত্রপাতি', imageUrl: img('museum-thresher'), imageAlt: 'মাড়াই যন্ত্র', period: '১৯৫০-এর দশক', order: 1 },
        { titleBn: 'মাটির হাঁড়ি', titleEn: 'Clay Pot', categoryName: 'গৃহস্থালি', imageUrl: img('museum-pot'), imageAlt: 'মাটির হাঁড়ি', order: 2 },
      ],
    });
  }

  // ---- Gallery ------------------------------------------------------------
  if (await isEmpty(prisma.galleryAlbum)) {
    const album = await prisma.galleryAlbum.create({
      data: { titleBn: 'কৃষি কার্যক্রম', titleEn: 'Agricultural Programs', coverImage: img('gallery-cover'), order: 0 },
    });
    await prisma.galleryImage.createMany({
      data: Array.from({ length: 9 }).map((_, i) => ({
        albumId: album.id,
        captionBn: `কার্যক্রমের ছবি ${i + 1}`,
        captionEn: `Program photo ${i + 1}`,
        imageUrl: img(`gallery-${i}`, 900, 700),
        altText: `কৃষি কার্যক্রমের ছবি ${i + 1}`,
        order: i,
      })),
    });
  }

  // ---- Programs -----------------------------------------------------------
  if (await isEmpty(prisma.program)) {
    for (let i = 0; i < 8; i++) {
      const year = 2024 + (i % 3);
      const p = await prisma.program.create({
        data: {
          titleBn: `কৃষি প্রশিক্ষণ কার্যক্রম ${i + 1}`,
          titleEn: `Agriculture Training Program ${i + 1}`,
          descriptionBn: 'কৃষকদের জন্য হাতে-কলমে কৃষি প্রশিক্ষণ ও প্রদর্শনী।',
          descriptionEn: 'Hands-on agricultural training and demonstration for farmers.',
          programDate: new Date(year, i % 12, 10),
          year,
          location: 'শাহপুর, বাংলাদেশ',
          categoryName: i % 2 ? 'প্রশিক্ষণ' : 'প্রদর্শনী',
          status: 'published',
          order: i,
          images: {
            create: [
              { imageUrl: img(`program-${i}-a`, 900, 700), altText: 'কার্যক্রমের ছবি', order: 0 },
              { imageUrl: img(`program-${i}-b`, 900, 700), altText: 'কার্যক্রমের ছবি', order: 1 },
            ],
          },
        },
      });
      void p;
    }
  }

  // ---- Publications / Achievements ---------------------------------------
  if (await isEmpty(prisma.publication)) {
    await prisma.publication.createMany({
      data: Array.from({ length: 6 }).map((_, i) => ({
        titleBn: `কৃষি প্রকাশনা ${i + 1}`,
        titleEn: `Agriculture Publication ${i + 1}`,
        descriptionBn: 'কৃষি তথ্য ও গবেষণা ভিত্তিক প্রকাশনা।',
        descriptionEn: 'Information and research based agricultural publication.',
        coverImage: img(`pub-${i}`, 700, 950),
        author: 'SAIL',
        publishedDate: new Date(2023 + (i % 3), i % 12, 1),
        categoryName: 'বুলেটিন',
        order: i,
      })),
    });
  }

  if (await isEmpty(prisma.achievement)) {
    await prisma.achievement.createMany({
      data: Array.from({ length: 5 }).map((_, i) => ({
        titleBn: `কৃষি অর্জন ${i + 1}`,
        titleEn: `Agricultural Achievement ${i + 1}`,
        descriptionBn: 'কৃষি শিক্ষা ও উন্নয়নে স্বীকৃতি।',
        descriptionEn: 'Recognition for agricultural education and development.',
        imageUrl: img(`ach-${i}`, 900, 700),
        achievementDate: new Date(2021 + i, 0, 15),
        categoryName: 'স্বীকৃতি',
        issuer: 'কৃষি মন্ত্রণালয়',
        order: i,
      })),
    });
  }

  // ---- More section -------------------------------------------------------
  if (await isEmpty(prisma.boardMember)) {
    await prisma.boardMember.createMany({
      data: [
        { nameBn: 'জাহাঙ্গীর আলম শাহ্', nameEn: 'Jahangir Alam Shah', designationBn: 'প্রতিষ্ঠাতা চেয়ারম্যান', designationEn: 'Founder Chairman', photoUrl: img('board-1', 600, 700), order: 0 },
        { nameBn: 'ড. কৃষিবিদ', nameEn: 'Dr. Agriculturist', designationBn: 'সদস্য', designationEn: 'Member', photoUrl: img('board-2', 600, 700), order: 1 },
      ],
    });
  }

  if (await isEmpty(prisma.usefulLink)) {
    await prisma.usefulLink.createMany({
      data: [
        { titleBn: 'কৃষি সম্প্রসারণ অধিদপ্তর', titleEn: 'Department of Agricultural Extension', url: 'https://dae.gov.bd', category: 'সরকারি', order: 0 },
        { titleBn: 'বাংলাদেশ কৃষি গবেষণা Council', titleEn: 'Bangladesh Agricultural Research Council', url: 'https://barc.gov.bd', category: 'গবেষণা', order: 1 },
        { titleBn: 'কৃষি মন্ত্রণালয়', titleEn: 'Ministry of Agriculture', url: 'https://moa.gov.bd', category: 'সরকারি', order: 2 },
      ],
    });
  }

  if (await isEmpty(prisma.researchItem)) {
    await prisma.researchItem.createMany({
      data: Array.from({ length: 4 }).map((_, i) => ({
        titleBn: `কৃষি গবেষণা ${i + 1}`,
        titleEn: `Agricultural Research ${i + 1}`,
        researcher: 'কৃষি গবেষক',
        abstractBn: 'কৃষি উৎপাদন বৃদ্ধি বিষয়ক গবেষণা।',
        abstractEn: 'Research on increasing agricultural production.',
        researchDate: new Date(2022 + i, i, 5),
        category: 'ফসল',
        order: i,
      })),
    });
  }

  // ---- Videos -------------------------------------------------------------
  if (await isEmpty(prisma.video)) {
    const yt = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'aqz-KE-bpKQ'];
    const cats = ['programs-news', 'press-media', 'krishi-news'];
    await prisma.video.createMany({
      data: Array.from({ length: 9 }).map((_, i) => {
        const id = yt[i % yt.length];
        return {
          titleBn: `কৃষি ভিডিও ${i + 1}`,
          titleEn: `Agriculture Video ${i + 1}`,
          descriptionBn: 'কৃষি বিষয়ক ভিডিও।',
          descriptionEn: 'An agriculture related video.',
          youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
          youtubeId: id,
          thumbnailUrl: youtubeThumbnail(id),
          category: cats[i % cats.length],
          order: i,
        };
      }),
    });
  }

  // ---- Testimonials -------------------------------------------------------
  if (await isEmpty(prisma.testimonial)) {
    await prisma.testimonial.createMany({
      data: [
        { name: 'একজন কৃষক', designation: 'কৃষক', messageBn: 'এই পাঠাগার থেকে অনেক কৃষি তথ্য পেয়েছি।', messageEn: 'I learned a lot of agricultural information from this library.', status: 'published', order: 0 },
        { name: 'জন শিক্ষক', designation: 'শিক্ষক', messageBn: 'শিক্ষার্থীদের জন্য চমৎকার একটি প্রতিষ্ঠান।', messageEn: 'A wonderful institution for students.', status: 'published', order: 1 },
        { name: 'A Researcher', designation: 'Researcher', messageBn: 'গবেষণার জন্য প্রয়োজনীয় তথ্য পেয়েছি।', messageEn: 'Found the information I needed for my research.', status: 'published', order: 2 },
      ],
    });
  }

  console.log('✅ Seed complete.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
