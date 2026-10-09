import type { CrudConfig } from './crud.factory';
import * as s from './schemas';
import { extractYouTubeId, youtubeThumbnail } from '../utils/youtube';
import { slugify } from '../utils/slug';
import { ApiError } from '../utils/http-error';

export interface ResourceDef {
  /** URL segment, e.g. "books" */
  path: string;
  config: CrudConfig;
}

const published = { status: 'published' };
const active = { isActive: true };

export const RESOURCES: ResourceDef[] = [
  {
    path: 'book-categories',
    config: {
      model: 'bookCategory',
      entity: 'BookCategory',
      searchFields: ['nameBn', 'nameEn'],
      filterFields: { isActive: 'boolean' },
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.bookCategorySchema,
      updateSchema: s.partial(s.bookCategorySchema),
      beforeWrite: (data) => ({
        ...data,
        slug: (data.slug as string) || slugify((data.nameEn as string) || (data.nameBn as string)),
      }),
    },
  },
  {
    path: 'books',
    config: {
      model: 'book',
      entity: 'Book',
      searchFields: ['nameBn', 'nameEn', 'authorBn', 'authorEn', 'isbn', 'publisher', 'keywords'],
      filterFields: { categoryId: 'string', isAvailable: 'boolean', status: 'string', language: 'string' },
      include: { category: true },
      publicWhere: published,
      defaultOrder: [{ serialNo: 'asc' }],
      sortable: ['serialNo', 'nameBn', 'createdAt', 'copies', 'order'],
      createSchema: s.bookSchema,
      updateSchema: s.partial(s.bookSchema),
    },
  },
  {
    path: 'museum-categories',
    config: {
      model: 'museumCategory',
      entity: 'MuseumCategory',
      searchFields: ['nameBn', 'nameEn'],
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.museumCategorySchema,
      updateSchema: s.partial(s.museumCategorySchema),
    },
  },
  {
    path: 'museum',
    config: {
      model: 'museumItem',
      entity: 'MuseumItem',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'descriptionEn', 'categoryName'],
      filterFields: { categoryId: 'string', status: 'string' },
      include: { category: true },
      publicWhere: published,
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.museumItemSchema,
      updateSchema: s.partial(s.museumItemSchema),
    },
  },
  {
    path: 'gallery-albums',
    config: {
      model: 'galleryAlbum',
      entity: 'GalleryAlbum',
      searchFields: ['titleBn', 'titleEn'],
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      include: { images: { orderBy: { order: 'asc' } } },
      publishField: '',
      createSchema: s.galleryAlbumSchema,
      updateSchema: s.partial(s.galleryAlbumSchema),
    },
  },
  {
    path: 'gallery-images',
    config: {
      model: 'galleryImage',
      entity: 'GalleryImage',
      searchFields: ['captionBn', 'captionEn', 'altText'],
      filterFields: { albumId: 'string', isActive: 'boolean' },
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.galleryImageSchema,
      updateSchema: s.partial(s.galleryImageSchema),
    },
  },
  {
    path: 'programs',
    config: {
      model: 'program',
      entity: 'Program',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'descriptionEn', 'location', 'categoryName'],
      filterFields: { year: 'int', status: 'string', categoryName: 'string' },
      include: { images: { orderBy: { order: 'asc' } } },
      publicWhere: published,
      defaultOrder: [{ programDate: 'desc' }],
      sortable: ['programDate', 'year', 'titleBn', 'createdAt', 'order'],
      createSchema: s.programSchema,
      updateSchema: s.partial(s.programSchema),
    },
  },
  {
    path: 'program-images',
    config: {
      model: 'programImage',
      entity: 'ProgramImage',
      filterFields: { programId: 'string' },
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.programImageSchema,
      updateSchema: s.partial(s.programImageSchema),
    },
  },
  {
    path: 'publications',
    config: {
      model: 'publication',
      entity: 'Publication',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'author', 'categoryName'],
      filterFields: { status: 'string', categoryName: 'string' },
      publicWhere: published,
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.publicationSchema,
      updateSchema: s.partial(s.publicationSchema),
    },
  },
  {
    path: 'achievements',
    config: {
      model: 'achievement',
      entity: 'Achievement',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'issuer', 'categoryName'],
      filterFields: { status: 'string', categoryName: 'string' },
      publicWhere: published,
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.achievementSchema,
      updateSchema: s.partial(s.achievementSchema),
    },
  },
  {
    path: 'board-members',
    config: {
      model: 'boardMember',
      entity: 'BoardMember',
      searchFields: ['nameBn', 'nameEn', 'designationBn', 'designationEn'],
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.boardMemberSchema,
      updateSchema: s.partial(s.boardMemberSchema),
    },
  },
  {
    path: 'links',
    config: {
      model: 'usefulLink',
      entity: 'UsefulLink',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'category'],
      filterFields: { category: 'string', isActive: 'boolean' },
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.usefulLinkSchema,
      updateSchema: s.partial(s.usefulLinkSchema),
    },
  },
  {
    path: 'research',
    config: {
      model: 'researchItem',
      entity: 'ResearchItem',
      searchFields: ['titleBn', 'titleEn', 'researcher', 'abstractBn', 'category'],
      filterFields: { status: 'string', category: 'string' },
      publicWhere: published,
      defaultOrder: [{ researchDate: 'desc' }],
      sortable: ['researchDate', 'titleBn', 'createdAt', 'order'],
      createSchema: s.researchSchema,
      updateSchema: s.partial(s.researchSchema),
    },
  },
  {
    path: 'videos',
    config: {
      model: 'video',
      entity: 'Video',
      searchFields: ['titleBn', 'titleEn', 'descriptionBn', 'descriptionEn'],
      filterFields: { category: 'string', status: 'string' },
      publicWhere: published,
      defaultOrder: [{ order: 'asc' }],
      sortable: ['order', 'publishedAt', 'createdAt', 'titleBn'],
      createSchema: s.videoSchema,
      updateSchema: s.partial(s.videoSchema),
      beforeWrite: (data) => {
        if (data.youtubeUrl) {
          const id = extractYouTubeId(data.youtubeUrl as string);
          if (!id) throw ApiError.badRequest('Invalid YouTube URL');
          return { ...data, youtubeId: id, thumbnailUrl: youtubeThumbnail(id) };
        }
        return data;
      },
    },
  },
  {
    path: 'testimonials',
    config: {
      model: 'testimonial',
      entity: 'Testimonial',
      searchFields: ['name', 'designation', 'messageBn', 'messageEn'],
      filterFields: { status: 'string' },
      publicWhere: published,
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.testimonialSchema,
      updateSchema: s.partial(s.testimonialSchema),
    },
  },
  {
    path: 'hero-slides',
    config: {
      model: 'heroSlide',
      entity: 'HeroSlide',
      searchFields: ['headingBn', 'headingEn'],
      filterFields: { isActive: 'boolean' },
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.heroSlideSchema,
      updateSchema: s.partial(s.heroSlideSchema),
    },
  },
  {
    path: 'notices',
    config: {
      model: 'notice',
      entity: 'Notice',
      searchFields: ['titleBn', 'titleEn', 'contentBn', 'contentEn'],
      filterFields: { isActive: 'boolean' },
      publicWhere: { isActive: true },
      defaultOrder: [{ priority: 'desc' }, { createdAt: 'desc' }],
      sortable: ['priority', 'createdAt', 'startDate'],
      createSchema: s.noticeSchema,
      updateSchema: s.partial(s.noticeSchema),
      activeField: 'isActive',
      publishField: '',
    },
  },
  {
    path: 'social-links',
    config: {
      model: 'socialLink',
      entity: 'SocialLink',
      searchFields: ['label', 'platform'],
      publicWhere: active,
      defaultOrder: [{ order: 'asc' }],
      publishField: '',
      createSchema: s.socialLinkSchema,
      updateSchema: s.partial(s.socialLinkSchema),
    },
  },
  {
    path: 'statistics',
    config: {
      model: 'statisticSetting',
      entity: 'StatisticSetting',
      defaultOrder: [{ order: 'asc' }],
      createSchema: s.statisticSchema,
      updateSchema: s.partial(s.statisticSchema),
    },
  },
  {
    path: 'contact-messages',
    config: {
      model: 'contactMessage',
      entity: 'ContactMessage',
      searchFields: ['name', 'email', 'subject', 'message'],
      filterFields: { status: 'string', isRead: 'boolean' },
      defaultOrder: [{ createdAt: 'desc' }],
      createSchema: s.contactSchema,
      updateSchema: s.contactUpdateSchema,
    },
  },
];

export function findResource(path: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.path === path);
}
