import { describe, expect, it } from 'vitest';
import { extractYouTubeId, isValidYouTubeUrl, youtubeEmbedUrl, youtubeThumbnail } from '../youtube';
import { slugify } from '../slug';

describe('youtube utilities', () => {
  it('extracts ids from common URL shapes', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects non-youtube and malformed values', () => {
    expect(extractYouTubeId('https://vimeo.com/12345')).toBeNull();
    expect(extractYouTubeId('not a url')).toBeNull();
    expect(extractYouTubeId('')).toBeNull();
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=tooshort')).toBe(false);
  });

  it('builds privacy-enhanced embed urls and thumbnails', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).not.toContain('autoplay=1');
    expect(youtubeThumbnail('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});

describe('slugify', () => {
  it('produces url-safe slugs and keeps Bengali', () => {
    expect(slugify('Rice & Crops')).toBe('rice-crops');
    expect(slugify('ধান ও ফসল')).toContain('ধান');
    expect(slugify('   ')).toMatch(/^item-/);
  });
});
