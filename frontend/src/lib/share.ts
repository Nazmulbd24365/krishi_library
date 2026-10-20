/** Helpers for building share URLs and copying links. No secrets or API keys involved. */

/** Current page URL without the hash — the canonical value used for sharing. */
export function currentCanonicalUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.toString();
}

/** Resolve a path or absolute URL against the current origin. */
export function toAbsoluteUrl(value?: string | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return currentCanonicalUrl();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof window === 'undefined') return raw;
  return new URL(raw.startsWith('/') ? raw : `/${raw}`, window.location.origin).toString();
}

/** Official Facebook sharer endpoint (no API credentials required). */
export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/** Official WhatsApp click-to-chat endpoint with an encoded message + URL. */
export function buildWhatsAppShareUrl(url: string, title?: string): string {
  const message = (title ?? '').trim() ? `${(title ?? '').trim()}\n${url}` : url;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Copy text to the clipboard.
 * Uses the async Clipboard API when available and falls back to the legacy
 * `execCommand('copy')` path for older browsers / insecure contexts.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy fallback */
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
