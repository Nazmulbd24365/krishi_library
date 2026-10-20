import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Download,
  Facebook,
  Link2,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  Share2,
  Square,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/components/ui';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import {
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  currentCanonicalUrl,
} from '@/lib/share';
import {
  WEATHER_IMAGE_FORMATS,
  canvasToPngBlob,
  normalizeWeatherDivisions,
  renderWeatherShareImage,
  weatherImageFilename,
  type WeatherImageCopy,
  type WeatherShareFormat,
} from '@/lib/weatherShareImage';
import type { WeatherResponse } from '@/types';

export interface WeatherShareDialogProps {
  open: boolean;
  onClose: () => void;
  weather: WeatherResponse | null;
  loading?: boolean;
  error?: string | null;
}

const FORMAT_IDS: WeatherShareFormat[] = ['square', 'portrait', 'landscape'];

const FORMAT_ICONS = {
  square: Square,
  portrait: RectangleVertical,
  landscape: RectangleHorizontal,
} as const;

type Status = { tone: 'success' | 'error' | 'info'; message: string };

export function WeatherShareDialog({ open, onClose, weather, loading = false, error = null }: WeatherShareDialogProps) {
  const { t, lang } = useI18n();
  const [format, setFormat] = useState<WeatherShareFormat>('square');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = currentCanonicalUrl();
  const filename = weatherImageFilename(format);

  const copy = useMemo<WeatherImageCopy>(
    () => ({
      title: t('weather.imageTitle'),
      subtitle: t('weather.imageSubtitle'),
      humidity: t('common.humidity'),
      wind: t('common.wind'),
      updated: t('weather.lastUpdated'),
      unavailable: t('weather.dataUnavailableShort'),
      footer: t('weather.imageFooter'),
    }),
    [t],
  );

  const divisions = useMemo(() => normalizeWeatherDivisions(weather), [weather]);
  const hasWeather = Boolean(weather && (weather.divisions?.length ?? 0) > 0);

  const replacePreview = useCallback((nextUrl: string | null) => {
    if (previewUrlRef.current && previewUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Render a fresh PNG whenever the dialog opens, the format changes, or the language/data changes.
  useEffect(() => {
    if (!open) {
      replacePreview(null);
      setBlob(null);
      setRenderError(null);
      setRendering(false);
      return;
    }
    if (!hasWeather) {
      replacePreview(null);
      setBlob(null);
      setRendering(false);
      return;
    }

    let cancelled = false;
    setRendering(true);
    setRenderError(null);

    renderWeatherShareImage({ weather, lang, format, siteUrl, copy })
      .then((canvas) => canvasToPngBlob(canvas))
      .then((png) => {
        if (cancelled) return;
        setBlob(png);
        replacePreview(URL.createObjectURL(png));
      })
      .catch(() => {
        if (cancelled) return;
        setBlob(null);
        replacePreview(null);
        setRenderError(t('weather.generateFailed'));
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, hasWeather, weather, lang, format, siteUrl, copy, replacePreview, t]);

  // Native file sharing is only offered when the browser explicitly supports PNG files.
  useEffect(() => {
    if (!blob) {
      setCanShareFiles(false);
      return;
    }
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      const supported =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        typeof navigator.share === 'function' &&
        navigator.canShare({ files: [file] });
      setCanShareFiles(supported);
    } catch {
      setCanShareFiles(false);
    }
  }, [blob, filename]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const handleDownload = async () => {
    if (!blob) return;
    setBusy('download');
    setStatus(null);
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus({ tone: 'success', message: t('weather.downloadStarted') });
    } catch {
      setStatus({ tone: 'error', message: t('weather.downloadFailed') });
    } finally {
      setBusy(null);
    }
  };

  const handleShareImage = async () => {
    if (!blob) return;
    setBusy('share');
    setStatus(null);
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: copy.title,
        text: `${copy.title} — ${pageUrl}`,
      });
      setStatus({ tone: 'success', message: t('weather.shared') });
    } catch (shareError) {
      if ((shareError as DOMException | undefined)?.name === 'AbortError') {
        setStatus({ tone: 'info', message: t('weather.shareCancelled') });
      } else {
        setStatus({ tone: 'error', message: t('weather.shareFailed') });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleCopyLink = async () => {
    const copied = await copyTextToClipboard(pageUrl);
    setStatus({
      tone: copied ? 'success' : 'error',
      message: copied ? t('share.copied') : t('share.copyFailed'),
    });
  };

  const handleFormat = (next: WeatherShareFormat) => {
    setFormat(next);
    setStatus(null);
  };

  if (!open) return null;

  const dimensions = WEATHER_IMAGE_FORMATS[format];
  const showNoData = !loading && (!hasWeather || Boolean(error));

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-farm-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-share-title"
        aria-describedby="weather-share-intro"
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-farm-100 bg-cream shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-farm-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow">{t('weather.share')}</p>
            <h2 id="weather-share-title" className="mt-1 font-display text-xl font-bold text-farm-900 sm:text-2xl">
              {t('weather.shareTitle')}
            </h2>
            <p id="weather-share-intro" className="mt-1 max-w-2xl text-sm text-farm-600">
              {t('weather.shareIntro')}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-farm-100 bg-farm-50 text-farm-700 transition hover:bg-farm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <section aria-label={t('weather.preview')} className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-farm-800">{t('weather.preview')}</h3>
              {rendering && (
                <span className="inline-flex items-center gap-1.5 text-xs text-farm-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  {t('weather.generating')}
                </span>
              )}
            </div>

            <div className="mt-2 flex min-h-[280px] items-center justify-center rounded-2xl border border-farm-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(230,239,224,0.7))] p-3 sm:p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t('weather.imageAlt')}
                  aria-describedby="weather-image-summary"
                  className="max-h-[50vh] w-auto max-w-full rounded-xl shadow-card"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  {rendering || loading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-farm-600" aria-hidden="true" />
                      <p className="text-sm text-farm-600">{t('weather.generating')}</p>
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="h-8 w-8 text-amber-500" aria-hidden="true" />
                      <p className="text-sm text-farm-700">
                        {renderError || error || t('weather.noDataForImage')}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-farm-600">{t('weather.format')}</p>
              <div role="group" aria-label={t('weather.format')} className="mt-2 grid grid-cols-3 gap-2">
                {FORMAT_IDS.map((id) => {
                  const Icon = FORMAT_ICONS[id];
                  const dims = WEATHER_IMAGE_FORMATS[id];
                  const selected = format === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleFormat(id)}
                      className={cn(
                        'flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2',
                        selected
                          ? 'border-farm-700 bg-farm-700 text-white shadow-soft'
                          : 'border-farm-200 bg-white text-farm-700 hover:border-farm-400 hover:bg-farm-50',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="text-xs font-semibold">{t(`weather.format.${id}`)}</span>
                      <span className={cn('text-[11px]', selected ? 'text-farm-100' : 'text-farm-500')}>
                        {dims.width} × {dims.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-xs text-farm-500">
              {showNoData && !renderError ? t('weather.noDataForImage') : t('weather.imageHint')}
            </p>
          </section>

          <aside className="flex min-w-0 flex-col gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!blob || busy !== null}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-farm-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-farm-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'download' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              {t('weather.downloadImage')}
            </button>

            <button
              type="button"
              onClick={handleShareImage}
              disabled={!blob || !canShareFiles || busy !== null}
              aria-describedby={blob && !canShareFiles ? 'weather-file-share-note' : undefined}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-farm-300 bg-white px-5 py-2.5 text-sm font-semibold text-farm-800 shadow-soft transition hover:bg-farm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'share' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden="true" />
              )}
              {busy === 'share' ? t('weather.sharingImage') : t('weather.shareImage')}
            </button>

            {blob && !canShareFiles && (
              <p id="weather-file-share-note" className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                {t('weather.fileShareUnsupported')}
              </p>
            )}

            {status && (
              <p
                role="status"
                aria-live="polite"
                className={cn(
                  'flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
                  status.tone === 'success' && 'bg-farm-100 text-farm-800',
                  status.tone === 'error' && 'bg-red-50 text-red-700',
                  status.tone === 'info' && 'bg-farm-50 text-farm-700',
                )}
              >
                {status.tone === 'success' && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                {status.tone === 'error' && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                {status.message}
              </p>
            )}

            <div className="mt-1 rounded-2xl border border-farm-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-farm-900">{t('weather.linkSharing')}</h3>
              <p className="mt-1 text-xs leading-relaxed text-farm-600">{t('weather.linkOnlyNote')}</p>

              <div className="mt-3 grid gap-2">
                <a
                  href={buildFacebookShareUrl(pageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-farm-200 px-3 py-2 text-sm font-medium text-farm-800 transition hover:bg-farm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" aria-hidden="true" />
                  {t('weather.facebookLink')}
                </a>
                <a
                  href={buildWhatsAppShareUrl(pageUrl, copy.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-farm-200 px-3 py-2 text-sm font-medium text-farm-800 transition hover:bg-farm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  {t('weather.whatsappLink')}
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-farm-200 px-3 py-2 text-sm font-medium text-farm-800 transition hover:bg-farm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2"
                >
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  {t('weather.copyPageLink')}
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div id="weather-image-summary" className="sr-only">
          <h3>{t('weather.imageSummary')}</h3>
          <p>{copy.title}</p>
          <p>
            {t('weather.lastUpdated')}: {divisions.find((division) => division.fetchedAt)?.fetchedAt ?? '—'}
          </p>
          <ul>
            {divisions.map((division) => {
              const name = lang === 'bn' ? division.nameBn : division.nameEn;
              const condition =
                lang === 'bn'
                  ? division.conditionBn || division.condition || copy.unavailable
                  : division.condition || division.conditionBn || copy.unavailable;
              return (
                <li key={division.division}>
                  {name}: {division.temperature == null ? '—' : `${Math.round(division.temperature)}°`},{' '}
                  {condition}, {copy.humidity} {division.humidity == null ? '—' : `${division.humidity}%`},{' '}
                  {copy.wind} {division.windSpeed == null ? '—' : `${Math.round(division.windSpeed)}`}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
