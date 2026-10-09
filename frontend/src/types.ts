export interface Bilingual {
  nameBn?: string | null;
  nameEn?: string | null;
}

export interface SiteSettings {
  id: string;
  siteNameBn: string;
  siteNameEn: string;
  shortNameBn?: string;
  shortNameEn?: string;
  taglineBn?: string;
  taglineEn?: string;
  logoUrl?: string;
  footerAboutBn?: string;
  footerAboutEn?: string;
  addressBn?: string;
  addressEn?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  openingHoursBn?: string;
  openingHoursEn?: string;
  mapEmbedUrl?: string;
  metaTitleBn?: string;
  metaTitleEn?: string;
  primaryColor?: string;
}

export interface NavItem {
  id: string;
  labelBn: string;
  labelEn: string;
  url: string;
  type: 'internal' | 'external';
  parentId?: string | null;
  order: number;
  isActive: boolean;
  openInNewTab: boolean;
  children?: NavItem[];
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export interface Notice {
  id: string;
  titleBn: string;
  titleEn?: string;
  contentBn?: string;
  contentEn?: string;
  url?: string;
  isExternal: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
}

export interface WeatherEntry {
  division: string;
  nameBn: string;
  nameEn: string;
  temperature: number | null;
  condition: string | null;
  conditionBn: string | null;
  icon: string;
  humidity: number | null;
  windSpeed: number | null;
  units: string;
  fetchedAt: string;
  ok: boolean;
  stale: boolean;
}

export interface HeroSlide {
  id: string;
  headingBn: string;
  headingEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  buttonTextBn?: string;
  buttonTextEn?: string;
  buttonUrl?: string;
  isExternal: boolean;
  imageUrl: string;
  imageAlt?: string;
  order: number;
}

export interface Statistic {
  key: string;
  labelBn: string;
  labelEn: string;
  value: number;
  manual: boolean;
  order: number;
}

export type Singleton<T> = T;

export interface AboutContent {
  headingBn: string;
  headingEn?: string;
  contentBn?: string;
  contentEn?: string;
  excerptBn?: string;
  excerptEn?: string;
  imageUrl?: string;
  youtubeUrl?: string;
}

export interface FounderMessage {
  nameBn: string;
  nameEn?: string;
  designationBn?: string;
  designationEn?: string;
  messageBn?: string;
  messageEn?: string;
  portraitUrl?: string;
  readMoreUrl?: string;
}

export interface MissionVision {
  missionBn?: string;
  missionEn?: string;
  visionBn?: string;
  visionEn?: string;
  objectivesBn?: string;
  objectivesEn?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  designation?: string;
  location?: string;
  photoUrl?: string;
  messageBn?: string;
  messageEn?: string;
  language: string;
  order: number;
  status: string;
}

export interface BookCategory {
  id: string;
  nameBn: string;
  nameEn?: string;
  slug: string;
  descriptionBn?: string;
  descriptionEn?: string;
  icon?: string;
  count?: number;
}

export interface Book {
  id: string;
  serialNo?: number | null;
  nameBn: string;
  nameEn?: string;
  authorBn?: string;
  authorEn?: string;
  copies: number;
  rackNo?: string;
  categoryId?: string | null;
  category?: BookCategory | null;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  language: string;
  description?: string;
  coverImage?: string;
  keywords?: string;
  isAvailable: boolean;
}

export interface MuseumItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  categoryId?: string | null;
  categoryName?: string;
  imageUrl?: string;
  imageAlt?: string;
  period?: string;
  category?: { id: string; nameBn: string; nameEn?: string } | null;
}

export interface GalleryAlbum {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  coverImage?: string;
  images?: GalleryImage[];
}

export interface GalleryImage {
  id: string;
  albumId?: string | null;
  captionBn?: string;
  captionEn?: string;
  imageUrl: string;
  altText?: string;
  order: number;
}

export interface Program {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  programDate?: string;
  year: number;
  location?: string;
  categoryName?: string;
  videoUrl?: string;
  reportUrl?: string;
  images?: ProgramImage[];
}

export interface ProgramImage {
  id: string;
  programId: string;
  imageUrl: string;
  altText?: string;
  order: number;
}

export interface Publication {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  coverImage?: string;
  author?: string;
  publishedDate?: string;
  categoryName?: string;
  fileUrl?: string;
  externalUrl?: string;
}

export interface Achievement {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  imageUrl?: string;
  achievementDate?: string;
  categoryName?: string;
  issuer?: string;
}

export interface BoardMember {
  id: string;
  nameBn: string;
  nameEn?: string;
  designationBn?: string;
  designationEn?: string;
  bioBn?: string;
  bioEn?: string;
  photoUrl?: string;
  order: number;
}

export interface UsefulLink {
  id: string;
  titleBn: string;
  titleEn?: string;
  url: string;
  descriptionBn?: string;
  descriptionEn?: string;
  category?: string;
  icon?: string;
}

export interface ResearchItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  researcher?: string;
  abstractBn?: string;
  abstractEn?: string;
  researchDate?: string;
  category?: string;
  imageUrl?: string;
  fileUrl?: string;
  externalUrl?: string;
}

export interface Video {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl?: string;
  category: string;
  publishedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: string;
  isRead: boolean;
  createdAt: string;
}

export interface SearchGroup {
  key: string;
  labelBn: string;
  labelEn: string;
  items: { type: string; id: string; title: string; subtitle?: string | null; url: string; image?: string | null }[];
}
