import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  toAbsoluteUrl,
} from './share';

describe('share URL builders', () => {
  it('encodes the page URL for Facebook', () => {
    const page = 'https://example.com/page?x=1&name=কৃষি তথ্য';
    const share = new URL(buildFacebookShareUrl(page));
    expect(share.origin).toBe('https://www.facebook.com');
    expect(share.pathname).toBe('/sharer/sharer.php');
    expect(share.searchParams.get('u')).toBe(page);
  });

  it('encodes both the title and URL for WhatsApp', () => {
    const page = 'https://example.com/weather?division=ঢাকা';
    const share = new URL(buildWhatsAppShareUrl(page, 'আবহাওয়ার আপডেট'));
    expect(share.origin).toBe('https://wa.me');
    expect(share.searchParams.get('text')).toBe(`আবহাওয়ার আপডেট\n${page}`);
  });

  it('handles a missing title for WhatsApp', () => {
    const page = 'https://example.com/notice/abc';
    const share = new URL(buildWhatsAppShareUrl(page));
    expect(share.searchParams.get('text')).toBe(page);
  });

  it('resolves root-relative URLs against the current origin', () => {
    const absolute = toAbsoluteUrl('/weather');
    expect(absolute).toBe(`${window.location.origin}/weather`);
  });

  it('keeps absolute URLs untouched', () => {
    expect(toAbsoluteUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });
});

describe('clipboard copying', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).clipboard;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).execCommand;
    vi.restoreAllMocks();
  });

  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await expect(copyTextToClipboard('https://example.com/page')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/page');
  });

  it('falls back to execCommand and cleans up the textarea', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand = vi.fn(() => true);

    await expect(copyTextToClipboard('fallback text')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports failure when both methods fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand = vi.fn(() => false);

    await expect(copyTextToClipboard('nope')).resolves.toBe(false);
  });
});
