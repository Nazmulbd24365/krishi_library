import { useEffect, useRef, useState } from 'react';
import { Check, Facebook, Link2, Share2, TriangleAlert } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/components/ui';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import {
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  currentCanonicalUrl,
  toAbsoluteUrl,
} from '@/lib/share';

export interface ShareButtonProps {
  /** Absolute or root-relative URL. Defaults to the current canonical URL. */
  url?: string;
  title: string;
  description?: string;
  label?: string;
  size?: 'sm' | 'md' | 'icon';
  variant?: 'solid' | 'outline' | 'ghost';
  align?: 'left' | 'right';
  className?: string;
}

type Status = { tone: 'success' | 'error'; message: string };

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none disabled:opacity-60';

const VARIANTS = {
  solid: 'bg-farm-700 text-white shadow-soft hover:bg-farm-800',
  outline: 'border border-farm-300 bg-white text-farm-800 shadow-soft hover:bg-farm-50',
  ghost: 'text-farm-700 hover:bg-farm-100',
} as const;

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  icon: 'h-10 w-10',
} as const;

const ITEM =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-farm-800 transition hover:bg-farm-50';

export function ShareButton({
  url,
  title,
  description = '',
  label,
  size = 'md',
  variant = 'outline',
  align = 'left',
  className,
}: ShareButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canonical = toAbsoluteUrl(url || currentCanonicalUrl());
  const text = label || t('share.share');
  const facebookUrl = buildFacebookShareUrl(canonical);
  const whatsappUrl = buildWhatsAppShareUrl(canonical, title);

  useEffect(() => {
    setNativeAvailable(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // Move focus into the menu for keyboard and screen-reader users.
    const id = window.setTimeout(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(id);
    };
  }, [open]);

  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(null), 3200);
    return () => window.clearTimeout(id);
  }, [status]);

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(canonical);
    setStatus(
      copied
        ? { tone: 'success', message: t('share.copied') }
        : { tone: 'error', message: t('share.copyFailed') },
    );
    if (copied) setOpen(false);
  };

  const handleNative = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title, text: description || title, url: canonical });
      setOpen(false);
    } catch (error) {
      // AbortError means the visitor simply dismissed the native sheet.
      if ((error as DOMException)?.name !== 'AbortError') {
        setStatus({ tone: 'error', message: t('share.nativeFailed') });
      }
    }
  };

  const iconOnly = size === 'icon';

  return (
    <div ref={rootRef} className={cn('relative inline-flex items-center gap-2', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={iconOnly ? `${text}: ${title}` : undefined}
        title={iconOnly ? `${text}: ${title}` : undefined}
        className={cn(BASE, VARIANTS[variant], SIZES[size])}
      >
        <Share2 className={cn(iconOnly ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden="true" />
        {!iconOnly && <span>{text}</span>}
      </button>

      {status && (
        <span
          role="status"
          aria-live="polite"
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            status.tone === 'success' ? 'text-farm-700' : 'text-red-600',
          )}
        >
          {status.tone === 'success' ? <Check className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
          {status.message}
        </span>
      )}

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${t('share.options')}: ${title}`}
          className={cn(
            'absolute top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-farm-100 bg-white p-1.5 shadow-card',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <a
            role="menuitem"
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={ITEM}
          >
            <Facebook className="h-4 w-4 shrink-0 text-[#1877f2]" aria-hidden="true" />
            {t('share.facebook')}
          </a>
          <a
            role="menuitem"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={ITEM}
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
            {t('share.whatsapp')}
          </a>
          <button role="menuitem" type="button" onClick={handleCopy} className={ITEM}>
            <Link2 className="h-4 w-4 shrink-0 text-farm-600" aria-hidden="true" />
            {t('share.copyLink')}
          </button>
          {nativeAvailable && (
            <button role="menuitem" type="button" onClick={handleNative} className={ITEM}>
              <Share2 className="h-4 w-4 shrink-0 text-farm-600" aria-hidden="true" />
              {t('share.native')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
