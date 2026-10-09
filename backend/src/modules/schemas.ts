import { z } from 'zod';

// ---- Shared helpers -------------------------------------------------------

export const optText = z.string().trim().max(5000).optional().nullable();
export const optShort = z.string().trim().max(300).optional().nullable();
export const optUrl = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .nullable()
  .refine((v) => !v || /^(https?:\/\/|\/)/i.test(v), 'Must be a valid URL or internal path');

const dateField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.date().optional().nullable(),
);

export const idParam = z.object({ id: z.string().min(1) });

// ---- Auth ----------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER']).default('CONTENT_MANAGER'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(['SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// ---- Settings / singletons ----------------------------------------------

export const settingsSchema = z.object({
  siteNameBn: z.string().trim().min(1),
  siteNameEn: z.string().trim().min(1),
  shortNameBn: optShort,
  shortNameEn: optShort,
  taglineBn: optShort,
  taglineEn: optShort,
  logoUrl: optUrl,
  faviconUrl: optUrl,
  footerAboutBn: optText,
  footerAboutEn: optText,
  addressBn: optShort,
  addressEn: optShort,
  phone1: optShort,
  phone2: optShort,
  email1: optShort,
  email2: optShort,
  openingHoursBn: optShort,
  openingHoursEn: optShort,
  mapEmbedUrl: optUrl,
  metaTitleBn: optShort,
  metaTitleEn: optShort,
  metaDescriptionBn: optText,
  metaDescriptionEn: optText,
  metaKeywords: optShort,
  primaryColor: z.string().trim().max(20).optional(),
});

export const aboutSchema = z.object({
  headingBn: z.string().trim().min(1),
  headingEn: optShort,
  contentBn: optText,
  contentEn: optText,
  excerptBn: optText,
  excerptEn: optText,
  imageUrl: optUrl,
  youtubeUrl: optUrl,
});

export const founderSchema = z.object({
  nameBn: z.string().trim().min(1),
  nameEn: optShort,
  designationBn: optShort,
  designationEn: optShort,
  messageBn: optText,
  messageEn: optText,
  portraitUrl: optUrl,
  readMoreUrl: optUrl,
});

export const missionSchema = z.object({
  missionBn: optText,
  missionEn: optText,
  visionBn: optText,
  visionEn: optText,
  objectivesBn: optText,
  objectivesEn: optText,
});

// ---- Navigation / social / notice ---------------------------------------

export const navigationSchema = z.object({
  labelBn: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500),
  type: z.enum(['internal', 'external']).default('internal'),
  parentId: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().url('Enter a valid URL'),
  icon: optShort,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const noticeSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  contentBn: optText,
  contentEn: optText,
  url: optUrl,
  isExternal: z.boolean().default(false),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: dateField,
  endDate: dateField,
});

// ---- Homepage ------------------------------------------------------------

export const heroSlideSchema = z.object({
  headingBn: z.string().trim().min(1).max(300),
  headingEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  buttonTextBn: optShort,
  buttonTextEn: optShort,
  buttonUrl: optUrl,
  isExternal: z.boolean().default(false),
  imageUrl: z.string().trim().min(1),
  imageAlt: optShort,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const statisticSchema = z.object({
  key: z.string().trim().min(1).max(40),
  labelBn: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  value: z.coerce.number().int().min(0).default(0),
  useManual: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  designation: optShort,
  location: optShort,
  photoUrl: optUrl,
  messageBn: optText,
  messageEn: optText,
  language: z.enum(['bn', 'en']).default('bn'),
  order: z.coerce.number().int().default(0),
  status: z.enum(['pending', 'published', 'rejected']).default('pending'),
});

// ---- Library -------------------------------------------------------------

export const bookCategorySchema = z.object({
  nameBn: z.string().trim().min(1).max(160),
  nameEn: optShort,
  slug: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
  descriptionBn: optText,
  descriptionEn: optText,
  icon: optShort,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const bookSchema = z.object({
  serialNo: z.coerce.number().int().min(0).optional().nullable(),
  nameBn: z.string().trim().min(1).max(400),
  nameEn: optShort,
  authorBn: optShort,
  authorEn: optShort,
  copies: z.coerce.number().int().min(0).default(1),
  rackNo: optShort,
  categoryId: z.string().optional().nullable(),
  isbn: optShort,
  publisher: optShort,
  publicationYear: z.coerce.number().int().min(1000).max(2200).optional().nullable(),
  language: z.string().trim().max(40).default('bn'),
  description: optText,
  coverImage: optUrl,
  keywords: optShort,
  isAvailable: z.boolean().default(true),
  status: z.enum(['published', 'draft']).default('published'),
});

// ---- Museum / gallery ----------------------------------------------------

export const museumCategorySchema = z.object({
  nameBn: z.string().trim().min(1).max(160),
  nameEn: optShort,
  order: z.coerce.number().int().default(0),
});

export const museumItemSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  categoryId: z.string().optional().nullable(),
  categoryName: optShort,
  imageUrl: optUrl,
  imageAlt: optShort,
  period: optShort,
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
});

export const galleryAlbumSchema = z.object({
  titleBn: z.string().trim().min(1).max(200),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  coverImage: optUrl,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const galleryImageSchema = z.object({
  albumId: z.string().optional().nullable(),
  captionBn: optShort,
  captionEn: optShort,
  imageUrl: z.string().trim().min(1),
  altText: optShort,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

// ---- Programs / publications / achievements ------------------------------

export const programSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  programDate: dateField,
  year: z.coerce.number().int().min(1900).max(2200),
  location: optShort,
  categoryName: optShort,
  videoUrl: optUrl,
  reportUrl: optUrl,
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
});

export const programImageSchema = z.object({
  programId: z.string().min(1),
  imageUrl: z.string().trim().min(1),
  altText: optShort,
  order: z.coerce.number().int().default(0),
});

export const publicationSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  coverImage: optUrl,
  author: optShort,
  publishedDate: dateField,
  categoryName: optShort,
  fileUrl: optUrl,
  externalUrl: optUrl,
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
});

export const achievementSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  imageUrl: optUrl,
  achievementDate: dateField,
  categoryName: optShort,
  issuer: optShort,
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
});

// ---- More section --------------------------------------------------------

export const boardMemberSchema = z.object({
  nameBn: z.string().trim().min(1).max(200),
  nameEn: optShort,
  designationBn: optShort,
  designationEn: optShort,
  bioBn: optText,
  bioEn: optText,
  photoUrl: optUrl,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const usefulLinkSchema = z.object({
  titleBn: z.string().trim().min(1).max(200),
  titleEn: optShort,
  url: z.string().trim().url('Enter a valid URL'),
  descriptionBn: optText,
  descriptionEn: optText,
  category: optShort,
  icon: optShort,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const researchSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  researcher: optShort,
  abstractBn: optText,
  abstractEn: optText,
  researchDate: dateField,
  category: optShort,
  imageUrl: optUrl,
  fileUrl: optUrl,
  externalUrl: optUrl,
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
});

// ---- Videos --------------------------------------------------------------

export const videoSchema = z.object({
  titleBn: z.string().trim().min(1).max(300),
  titleEn: optShort,
  descriptionBn: optText,
  descriptionEn: optText,
  youtubeUrl: z.string().trim().min(1),
  category: z.enum(['programs-news', 'press-media', 'krishi-news']).default('krishi-news'),
  order: z.coerce.number().int().default(0),
  status: z.enum(['published', 'draft']).default('published'),
  publishedAt: dateField,
});

// ---- Contact -------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email('Enter a valid email'),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(5).max(4000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
});

export const contactUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'archived']).optional(),
  isRead: z.boolean().optional(),
});

/** Make every property optional for PATCH endpoints. */
export function partial<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.partial();
}
