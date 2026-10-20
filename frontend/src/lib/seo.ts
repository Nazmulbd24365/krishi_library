import { useEffect } from 'react';
import { currentCanonicalUrl, toAbsoluteUrl } from './share';

export const DEFAULT_OG_IMAGE = '/og-default.png';
export const DEFAULT_DESCRIPTION =
  'শাহ কৃষি তথ্য পাঠাগার ও জাদুঘর — কৃষি তথ্য, শিক্ষা, গবেষণা ও জাদুঘর সংগ্রহ।';

export interface PageMeta {
  title: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
  /** Absolute or root-relative URL. Defaults to the current canonical URL. */
  url?: string;
  siteName?: string;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Update the document head with SEO / Open Graph / Twitter metadata.
 *
 * This keeps the head correct for users and JavaScript-capable crawlers. Social
 * crawlers that do not execute JS are served prerendered tags by
 * `frontend/middleware.ts` (Vercel Edge Middleware).
 */
export function usePageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
  url,
  siteName = 'Shah Agriculture Information Library',
}: PageMeta) {
  useEffect(() => {
    const documentTitle = `${title} | SAIL`;
    const canonical = url ? toAbsoluteUrl(url) : currentCanonicalUrl();
    const imageUrl = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);
    const desc = description.trim() || DEFAULT_DESCRIPTION;

    document.title = documentTitle;

    setMeta('name', 'description', desc);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', documentTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('name', 'twitter:url', canonical);

    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:locale', 'bn_BD');
    setMeta('property', 'og:title', documentTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:image:alt', title);

    setCanonical(canonical);
  }, [title, description, image, type, url, siteName]);
}
