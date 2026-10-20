import { describe, expect, it } from 'vitest';
import { CRAWLER_PATTERN, fallbackMeta, renderHtml } from './middleware';

describe('crawler detection', () => {
  it.each([
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'WhatsApp/2.23.20.0',
    'Twitterbot/1.0',
    'LinkedInBot/1.0',
    'Slackbot-LinkExpanding 1.0',
    'TelegramBot (like TwitterBot)',
  ])('matches %s', (ua) => {
    expect(CRAWLER_PATTERN.test(ua)).toBe(true);
  });

  it('does not match a normal browser', () => {
    expect(
      CRAWLER_PATTERN.test(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
      ),
    ).toBe(false);
  });
});

describe('fallback metadata', () => {
  it('returns the weather page title', () => {
    const meta = fallbackMeta('/weather');
    expect(meta.title).toContain('Weather Update');
    expect(meta.type).toBe('website');
  });

  it('uses the section fallback for detail pages', () => {
    const meta = fallbackMeta('/library/abc123');
    expect(meta.title).toContain('Library');
    expect(meta.type).toBe('article');
  });

  it('falls back to the home page for unknown routes', () => {
    expect(fallbackMeta('/does-not-exist').title).toContain('Shah Agriculture Information Library');
  });
});

describe('prerendered HTML', () => {
  it('emits Open Graph, Twitter and canonical tags', () => {
    const html = renderHtml(
      {
        title: 'আবহাওয়ার আপডেট | Weather Update',
        description: 'আটটি বিভাগের আবহাওয়া',
        type: 'website',
      },
      'https://sail.example.com/weather',
    );

    expect(html).toContain('<title>আবহাওয়ার আপডেট | Weather Update</title>');
    expect(html).toContain('<link rel="canonical" href="https://sail.example.com/weather" />');
    expect(html).toContain('<meta property="og:url" content="https://sail.example.com/weather" />');
    expect(html).toContain(
      '<meta property="og:image" content="https://sail.example.com/og-default.png" />',
    );
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="twitter:image" content="https://sail.example.com/og-default.png" />');
  });

  it('keeps absolute image URLs and escapes HTML', () => {
    const html = renderHtml(
      {
        title: '<script>alert("x")</script>',
        description: 'Tom & Jerry "quoted"',
        image: 'https://cdn.example.com/cover.jpg',
        type: 'article',
      },
      'https://sail.example.com/library/abc',
    );

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('Tom &amp; Jerry &quot;quoted&quot;');
    expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/cover.jpg" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
  });
});
