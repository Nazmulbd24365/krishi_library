import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Pause, Play } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Notice } from '@/types';

export function NoticeTicker() {
  const { t, pick } = useI18n();
  const { data } = useFetch<Notice[]>('/notices', { pageSize: 20, sort: 'priority', order: 'desc' });
  const [paused, setPaused] = useState(false);

  const notices = data ?? [];
  if (notices.length === 0) return null;

  const items = [...notices, ...notices]; // duplicated track for a seamless loop

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gold-400 sm:flex">
        <Bell className="h-3.5 w-3.5" aria-hidden />
        {t('notice.title')}
      </span>
      <div className="relative min-w-0 flex-1 overflow-hidden" aria-live="off">
        <div className={`ticker-track hover:[animation-play-state:paused] ${paused ? 'paused' : ''}`}>
          {items.map((n, i) => {
            const isExternal = n.isExternal && n.url;
            const label = pick(n.titleBn, n.titleEn);
            return isExternal ? (
              <a
                key={`${n.id}-${i}`}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-6 text-xs text-farm-50/90 hover:text-white hover:underline"
              >
                {label}
              </a>
            ) : (
              <Link
                key={`${n.id}-${i}`}
                to={n.url || `/notices/${n.id}`}
                className="mx-6 text-xs text-farm-50/90 hover:text-white hover:underline"
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="shrink-0 rounded p-1 text-farm-100/70 hover:bg-white/10 hover:text-white"
        aria-label={paused ? t('notice.play') : t('notice.pause')}
      >
        {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
