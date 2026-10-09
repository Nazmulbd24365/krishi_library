/** Utilities for validating and parsing YouTube URLs. */

const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/**
 * Extract a YouTube video id from a URL or a bare id.
 * Returns null when the input is not a valid YouTube reference.
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;

  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && ID_RE.test(id) ? id : null;
  }

  const v = url.searchParams.get('v');
  if (v && ID_RE.test(v)) return v;

  const parts = url.pathname.split('/').filter(Boolean);
  const marker = parts.findIndex((p) => ['embed', 'shorts', 'live', 'v'].includes(p));
  if (marker !== -1 && parts[marker + 1] && ID_RE.test(parts[marker + 1])) {
    return parts[marker + 1];
  }
  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Privacy-enhanced embed URL (no autoplay sound). */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
