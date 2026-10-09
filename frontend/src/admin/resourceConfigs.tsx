import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import type { ResourceConfig } from './ResourceManager';

/** Loose row shape returned by the admin CRUD endpoints. */
type AdminRow = Record<string, unknown> & { id: string };

/* ------------------------------------------------------------- small badges */
const statusBadge = (status: unknown): ReactNode =>
  status === 'published' ? <Badge tone="farm">Published</Badge> : <Badge tone="gray">Draft</Badge>;

const activeBadge = (active: unknown): ReactNode =>
  active ? <Badge tone="farm">Active</Badge> : <Badge tone="gray">Hidden</Badge>;

const availableBadge = (v: unknown): ReactNode =>
  v ? <Badge tone="farm">Available</Badge> : <Badge tone="red">Unavailable</Badge>;

const PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const statusFilter = { name: 'status', label: 'All statuses', options: PUBLISH_OPTIONS };

/* ----------------------------------------------------------------- configs */
const bookCategories: ResourceConfig<AdminRow> = {
  resource: 'book-categories',
  title: 'Book Categories',
  description: 'Organise the digital library into browsable categories.',
  publish: 'isActive',
  columns: [
    { key: 'nameBn', label: 'Name (বাংলা)' },
    { key: 'nameEn', label: 'Name (English)' },
    { key: 'slug', label: 'Slug' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'nameBn', label: 'Name (বাংলা)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (English)', type: 'text' },
    { name: 'slug', label: 'Slug', type: 'text', help: 'Leave blank to generate automatically.' },
    { name: 'icon', label: 'Icon', type: 'text', help: 'Lucide icon name or emoji.' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true },
};

const books: ResourceConfig<AdminRow> = {
  resource: 'books',
  title: 'Books',
  description: 'The full library catalogue.',
  publish: 'status',
  pageSize: 10,
  filters: [
    statusFilter,
    {
      name: 'isAvailable',
      label: 'Availability',
      options: [
        { value: 'true', label: 'Available' },
        { value: 'false', label: 'Unavailable' },
      ],
    },
  ],
  columns: [
    { key: 'serialNo', label: 'SL' },
    { key: 'nameBn', label: 'Name (বাংলা)' },
    { key: 'authorBn', label: 'Author' },
    { key: 'copies', label: 'Copies' },
    {
      key: 'category',
      label: 'Category',
      render: (r) => {
        const category = r.category as { nameBn?: string } | null;
        return category?.nameBn ?? '—';
      },
    },
    { key: 'isAvailable', label: 'Available', render: (r) => availableBadge(r.isAvailable) },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'serialNo', label: 'Serial number', type: 'number' },
    { name: 'nameBn', label: 'Book name (বাংলা)', type: 'text', required: true },
    { name: 'nameEn', label: 'Book name (English)', type: 'text' },
    { name: 'authorBn', label: 'Author (বাংলা)', type: 'text' },
    { name: 'authorEn', label: 'Author (English)', type: 'text' },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      optionsFrom: { path: '/book-categories', labelKey: 'nameBn' },
    },
    { name: 'copies', label: 'Copies', type: 'number' },
    { name: 'rackNo', label: 'Rack number', type: 'text' },
    { name: 'isbn', label: 'ISBN', type: 'text' },
    { name: 'publisher', label: 'Publisher', type: 'text' },
    { name: 'publicationYear', label: 'Publication year', type: 'number' },
    {
      name: 'language',
      label: 'Language',
      type: 'select',
      options: [
        { value: 'bn', label: 'বাংলা' },
        { value: 'en', label: 'English' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'coverImage', label: 'Cover image', type: 'image' },
    { name: 'keywords', label: 'Keywords', type: 'text', help: 'Comma separated.' },
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
    { name: 'isAvailable', label: 'Available', type: 'checkbox' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { copies: 1, language: 'bn', isAvailable: true, status: 'published' },
};

const museumCategories: ResourceConfig<AdminRow> = {
  resource: 'museum-categories',
  title: 'Museum Categories',
  columns: [
    { key: 'nameBn', label: 'Name (বাংলা)' },
    { key: 'nameEn', label: 'Name (English)' },
    { key: 'order', label: 'Order' },
  ],
  fields: [
    { name: 'nameBn', label: 'Name (বাংলা)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (English)', type: 'text' },
    { name: 'order', label: 'Sort order', type: 'number' },
  ],
  defaults: { order: 0 },
};

const museum: ResourceConfig<AdminRow> = {
  resource: 'museum',
  title: 'Museum Items',
  publish: 'status',
  filters: [statusFilter],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'period', label: 'Period' },
    {
      key: 'category',
      label: 'Category',
      render: (r) => {
        const category = r.category as { nameBn?: string } | null;
        return (category?.nameBn as string) ?? (r.categoryName as string) ?? '—';
      },
    },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      optionsFrom: { path: '/museum-categories', labelKey: 'nameBn' },
    },
    { name: 'categoryName', label: 'Category label', type: 'text', help: 'Used when no category is selected.' },
    { name: 'period', label: 'Period / era', type: 'text' },
    { name: 'imageUrl', label: 'Image', type: 'image' },
    { name: 'imageAlt', label: 'Image alt text', type: 'text' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { order: 0, status: 'published' },
};

const galleryAlbums: ResourceConfig<AdminRow> = {
  resource: 'gallery-albums',
  title: 'Gallery Albums',
  publish: 'isActive',
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'titleEn', label: 'Title (English)' },
    {
      key: 'images',
      label: 'Photos',
      render: (r) => String(Array.isArray(r.images) ? (r.images as unknown[]).length : 0),
    },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'coverImage', label: 'Cover image', type: 'image' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true },
};

const galleryImages: ResourceConfig<AdminRow> = {
  resource: 'gallery-images',
  title: 'Gallery Photos',
  publish: 'isActive',
  filters: [
    {
      name: 'albumId',
      label: 'All albums',
      options: [],
    },
  ],
  columns: [
    { key: 'imageUrl', label: 'Image', render: (r) => (r.imageUrl ? '🖼️' : '—') },
    { key: 'captionBn', label: 'Caption (বাংলা)' },
    { key: 'captionEn', label: 'Caption (English)' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    {
      name: 'albumId',
      label: 'Album',
      type: 'select',
      optionsFrom: { path: '/gallery-albums', labelKey: 'titleBn' },
    },
    { name: 'imageUrl', label: 'Image', type: 'image', required: true },
    { name: 'captionBn', label: 'Caption (বাংলা)', type: 'text' },
    { name: 'captionEn', label: 'Caption (English)', type: 'text' },
    { name: 'altText', label: 'Alt text', type: 'text' },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true },
};

const programs: ResourceConfig<AdminRow> = {
  resource: 'programs',
  title: 'Programs',
  publish: 'status',
  filters: [statusFilter],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'year', label: 'Year' },
    { key: 'location', label: 'Location' },
    { key: 'programDate', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'year', label: 'Year', type: 'number', required: true },
    { name: 'programDate', label: 'Date', type: 'date' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'categoryName', label: 'Category', type: 'text' },
    { name: 'videoUrl', label: 'Video URL', type: 'text' },
    { name: 'reportUrl', label: 'Report file', type: 'file' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { year: new Date().getFullYear(), order: 0, status: 'published' },
};

const programImages: ResourceConfig<AdminRow> = {
  resource: 'program-images',
  title: 'Program Photos',
  columns: [
    { key: 'programId', label: 'Program ID' },
    { key: 'imageUrl', label: 'Image' },
    { key: 'order', label: 'Order' },
  ],
  fields: [
    { name: 'programId', label: 'Program ID', type: 'text', required: true },
    { name: 'imageUrl', label: 'Image', type: 'image', required: true },
    { name: 'altText', label: 'Alt text', type: 'text' },
    { name: 'order', label: 'Sort order', type: 'number' },
  ],
  defaults: { order: 0 },
};

const publications: ResourceConfig<AdminRow> = {
  resource: 'publications',
  title: 'Publications',
  publish: 'status',
  filters: [statusFilter],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'author', label: 'Author' },
    { key: 'categoryName', label: 'Category' },
    { key: 'publishedDate', label: 'Published' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'author', label: 'Author', type: 'text' },
    { name: 'publishedDate', label: 'Published date', type: 'date' },
    { name: 'categoryName', label: 'Category', type: 'text' },
    { name: 'coverImage', label: 'Cover image', type: 'image' },
    { name: 'fileUrl', label: 'File', type: 'file' },
    { name: 'externalUrl', label: 'External URL', type: 'text' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { order: 0, status: 'published' },
};

const achievements: ResourceConfig<AdminRow> = {
  resource: 'achievements',
  title: 'Achievements',
  publish: 'status',
  filters: [statusFilter],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'achievementDate', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'issuer', label: 'Issuer', type: 'text' },
    { name: 'achievementDate', label: 'Date', type: 'date' },
    { name: 'categoryName', label: 'Category', type: 'text' },
    { name: 'imageUrl', label: 'Image', type: 'image' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { order: 0, status: 'published' },
};

const research: ResourceConfig<AdminRow> = {
  resource: 'research',
  title: 'Research',
  publish: 'status',
  filters: [statusFilter],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'researcher', label: 'Researcher' },
    { key: 'category', label: 'Category' },
    { key: 'researchDate', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'researcher', label: 'Researcher', type: 'text' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'researchDate', label: 'Date', type: 'date' },
    { name: 'imageUrl', label: 'Image', type: 'image' },
    { name: 'fileUrl', label: 'File', type: 'file' },
    { name: 'externalUrl', label: 'External URL', type: 'text' },
    { name: 'abstract', label: 'Abstract', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { order: 0, status: 'published' },
};

const boardMembers: ResourceConfig<AdminRow> = {
  resource: 'board-members',
  title: 'Board Members',
  publish: 'isActive',
  columns: [
    { key: 'nameBn', label: 'Name (বাংলা)' },
    { key: 'designationBn', label: 'Designation' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'nameBn', label: 'Name (বাংলা)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (English)', type: 'text' },
    { name: 'designationBn', label: 'Designation (বাংলা)', type: 'text' },
    { name: 'designationEn', label: 'Designation (English)', type: 'text' },
    { name: 'photoUrl', label: 'Photo', type: 'image' },
    { name: 'bio', label: 'Bio', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true },
};

const links: ResourceConfig<AdminRow> = {
  resource: 'links',
  title: 'Useful Links',
  publish: 'isActive',
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'category', label: 'Category' },
    { key: 'url', label: 'URL' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'url', label: 'URL', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'icon', label: 'Icon', type: 'text' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true },
};

const videos: ResourceConfig<AdminRow> = {
  resource: 'videos',
  title: 'Videos',
  publish: 'status',
  filters: [
    statusFilter,
    {
      name: 'category',
      label: 'All categories',
      options: [
        { value: 'programs-news', label: 'Programs News' },
        { value: 'press-media', label: 'Press & Media' },
        { value: 'krishi-news', label: 'Krishi News' },
      ],
    },
  ],
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'category', label: 'Category' },
    { key: 'publishedAt', label: 'Published' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'youtubeUrl', label: 'YouTube URL', type: 'text', required: true, wide: true },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'krishi-news', label: 'Krishi News' },
        { value: 'programs-news', label: 'Programs News' },
        { value: 'press-media', label: 'Press & Media' },
      ],
    },
    { name: 'publishedAt', label: 'Published date', type: 'date' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: PUBLISH_OPTIONS },
  ],
  defaults: { category: 'krishi-news', order: 0, status: 'published' },
};

const testimonials: ResourceConfig<AdminRow> = {
  resource: 'testimonials',
  title: 'Testimonials',
  publish: 'status',
  filters: [
    {
      name: 'status',
      label: 'All statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'published', label: 'Published' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'location', label: 'Location' },
    { key: 'language', label: 'Lang' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'designation', label: 'Designation', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'photoUrl', label: 'Photo', type: 'image' },
    {
      name: 'language',
      label: 'Language',
      type: 'select',
      options: [
        { value: 'bn', label: 'বাংলা' },
        { value: 'en', label: 'English' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'published', label: 'Published' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    { name: 'message', label: 'Message', type: 'bilingualTextarea', wide: true },
    { name: 'order', label: 'Sort order', type: 'number' },
  ],
  defaults: { language: 'bn', status: 'pending', order: 0 },
};

const heroSlides: ResourceConfig<AdminRow> = {
  resource: 'hero-slides',
  title: 'Hero Slides',
  publish: 'isActive',
  columns: [
    { key: 'headingBn', label: 'Heading (বাংলা)' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'headingBn', label: 'Heading (বাংলা)', type: 'text', required: true },
    { name: 'headingEn', label: 'Heading (English)', type: 'text' },
    { name: 'imageUrl', label: 'Background image', type: 'image', required: true },
    { name: 'imageAlt', label: 'Image alt text', type: 'text' },
    { name: 'buttonTextBn', label: 'Button text (বাংলা)', type: 'text' },
    { name: 'buttonTextEn', label: 'Button text (English)', type: 'text' },
    { name: 'buttonUrl', label: 'Button URL', type: 'text' },
    { name: 'description', label: 'Description', type: 'bilingualTextarea', wide: true },
    { name: 'isExternal', label: 'External link', type: 'checkbox' },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { order: 0, isActive: true, isExternal: false },
};

const notices: ResourceConfig<AdminRow> = {
  resource: 'notices',
  title: 'Notices',
  publish: 'isActive',
  columns: [
    { key: 'titleBn', label: 'Title (বাংলা)' },
    { key: 'priority', label: 'Priority' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    { name: 'titleBn', label: 'Title (বাংলা)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (English)', type: 'text' },
    { name: 'url', label: 'Link URL', type: 'text' },
    { name: 'startDate', label: 'Start date', type: 'date' },
    { name: 'endDate', label: 'End date', type: 'date' },
    { name: 'content', label: 'Content', type: 'bilingualTextarea', wide: true },
    { name: 'isExternal', label: 'External link', type: 'checkbox' },
    { name: 'priority', label: 'Priority', type: 'number', help: 'Higher numbers appear first.' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { priority: 0, isActive: true, isExternal: false },
};

const socialLinks: ResourceConfig<AdminRow> = {
  resource: 'social-links',
  title: 'Social Links',
  publish: 'isActive',
  columns: [
    { key: 'platform', label: 'Platform' },
    { key: 'label', label: 'Label' },
    { key: 'url', label: 'URL' },
    { key: 'isActive', label: 'Status', render: (r) => activeBadge(r.isActive) },
  ],
  fields: [
    {
      name: 'platform',
      label: 'Platform',
      type: 'select',
      required: true,
      options: [
        { value: 'facebook', label: 'Facebook' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'x', label: 'X (Twitter)' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'label', label: 'Label', type: 'text', required: true },
    { name: 'url', label: 'URL', type: 'text', required: true },
    { name: 'icon', label: 'Icon', type: 'text' },
    { name: 'order', label: 'Sort order', type: 'number' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ],
  defaults: { platform: 'facebook', order: 0, isActive: true },
};

const statistics: ResourceConfig<AdminRow> = {
  resource: 'statistics',
  title: 'Statistics',
  description: 'Homepage counters. Live counts are used unless a manual value is enabled.',
  columns: [
    { key: 'key', label: 'Key' },
    { key: 'labelBn', label: 'Label (বাংলা)' },
    { key: 'value', label: 'Value' },
    { key: 'useManual', label: 'Manual?', render: (r) => (r.useManual ? <Badge tone="gold">Manual</Badge> : <Badge tone="gray">Live</Badge>) },
    { key: 'order', label: 'Order' },
  ],
  fields: [
    {
      name: 'key',
      label: 'Key',
      type: 'select',
      required: true,
      options: [
        { value: 'books', label: 'books' },
        { value: 'programs', label: 'programs' },
        { value: 'publications', label: 'publications' },
        { value: 'achievements', label: 'achievements' },
      ],
    },
    { name: 'labelBn', label: 'Label (বাংলা)', type: 'text', required: true },
    { name: 'labelEn', label: 'Label (English)', type: 'text', required: true },
    { name: 'value', label: 'Manual value', type: 'number' },
    { name: 'useManual', label: 'Use manual value', type: 'checkbox' },
    { name: 'order', label: 'Sort order', type: 'number' },
  ],
  defaults: { value: 0, useManual: false, order: 0 },
};

const contactMessages: ResourceConfig<AdminRow> = {
  resource: 'contact-messages',
  title: 'Contact Inbox',
  description: 'Messages submitted through the public contact form.',
  canCreate: false,
  filters: [
    {
      name: 'status',
      label: 'All statuses',
      options: [
        { value: 'new', label: 'New' },
        { value: 'read', label: 'Read' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      name: 'isRead',
      label: 'Read state',
      options: [
        { value: 'true', label: 'Read' },
        { value: 'false', label: 'Unread' },
      ],
    },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Received' },
  ],
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'read', label: 'Read' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    { name: 'isRead', label: 'Read', type: 'checkbox' },
  ],
  defaults: { status: 'read', isRead: true },
};

/* ------------------------------------------------------------- registry map */
export const RESOURCE_CONFIGS: Record<string, ResourceConfig<AdminRow>> = {
  'book-categories': bookCategories,
  books,
  'museum-categories': museumCategories,
  museum,
  'gallery-albums': galleryAlbums,
  'gallery-images': galleryImages,
  programs,
  'program-images': programImages,
  publications,
  achievements,
  research,
  videos,
  'board-members': boardMembers,
  links,
  testimonials,
  'hero-slides': heroSlides,
  notices,
  'social-links': socialLinks,
  statistics,
  'contact-messages': contactMessages,
};

export function getResourceConfig(resource: string): ResourceConfig<AdminRow> | undefined {
  return RESOURCE_CONFIGS[resource];
}

export interface AdminNavItem {
  label: string;
  to: string;
  resource?: string;
}

export const ADMIN_NAV_GROUPS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard' }],
  },
  {
    title: 'Library',
    items: [
      { label: 'Books', to: '/admin/books', resource: 'books' },
      { label: 'Book Categories', to: '/admin/book-categories', resource: 'book-categories' },
      { label: 'Books Import', to: '/admin/books-import' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Programs', to: '/admin/programs', resource: 'programs' },
      { label: 'Program Photos', to: '/admin/program-images', resource: 'program-images' },
      { label: 'Publications', to: '/admin/publications', resource: 'publications' },
      { label: 'Achievements', to: '/admin/achievements', resource: 'achievements' },
      { label: 'Research', to: '/admin/research', resource: 'research' },
      { label: 'Videos', to: '/admin/videos', resource: 'videos' },
    ],
  },
  {
    title: 'Museum & Gallery',
    items: [
      { label: 'Museum Items', to: '/admin/museum', resource: 'museum' },
      { label: 'Museum Categories', to: '/admin/museum-categories', resource: 'museum-categories' },
      { label: 'Gallery Albums', to: '/admin/gallery-albums', resource: 'gallery-albums' },
      { label: 'Gallery Photos', to: '/admin/gallery-images', resource: 'gallery-images' },
    ],
  },
  {
    title: 'Homepage',
    items: [
      { label: 'Hero Slides', to: '/admin/hero-slides', resource: 'hero-slides' },
      { label: 'Statistics', to: '/admin/statistics', resource: 'statistics' },
      { label: 'Testimonials', to: '/admin/testimonials', resource: 'testimonials' },
      { label: 'Notices', to: '/admin/notices', resource: 'notices' },
    ],
  },
  {
    title: 'Pages',
    items: [
      { label: 'About', to: '/admin/singletons/about' },
      { label: 'Founder Message', to: '/admin/singletons/founder-message' },
      { label: 'Mission & Vision', to: '/admin/singletons/mission-vision' },
      { label: 'Board Members', to: '/admin/board-members', resource: 'board-members' },
      { label: 'Useful Links', to: '/admin/links', resource: 'links' },
      { label: 'Navigation', to: '/admin/navigation' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Contact Inbox', to: '/admin/contact-messages', resource: 'contact-messages' },
      { label: 'Social Links', to: '/admin/social-links', resource: 'social-links' },
      { label: 'Media Library', to: '/admin/media' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Site Settings', to: '/admin/settings' },
      { label: 'Users', to: '/admin/users' },
      { label: 'Audit Log', to: '/admin/audit' },
    ],
  },
];
