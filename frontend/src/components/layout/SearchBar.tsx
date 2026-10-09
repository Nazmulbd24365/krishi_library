import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { SearchGroup } from '@/types';
import { SmartImage, Spinner } from '@/components/ui';

export function SearchBar({ className }: { className?: string }) {
  const { t, pick, isBn } = useI18n();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(term, 350);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setGroups([]);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .get<{ query: string; groups: SearchGroup[] }>('/search', { q: debounced })
      .then((res) => alive && setGroups(res.data.groups))
      .catch(() => alive && setGroups([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debounced]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const flat = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g })));
  const hasResults = flat.length > 0;

  return (
    <div ref={boxRef} className={className}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" aria-hidden />
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, flat.length - 1));
            if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
            if (e.key === 'Enter' && flat[active]) {
              window.location.href = flat[active].url;
            }
          }}
          placeholder={t('common.searchPlaceholder')}
          aria-label={t('common.search')}
          className="w-full rounded-full border border-farm-200 bg-white py-2 pl-9 pr-9 text-sm outline-none transition focus:border-farm-500 focus:ring-2 focus:ring-farm-200"
        />
        {term && (
          <button
            onClick={() => {
              setTerm('');
              setGroups([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-farm-400 hover:text-farm-700"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && term.trim().length >= 2 && (
        <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(92vw,30rem)] overflow-y-auto rounded-2xl border border-farm-100 bg-white p-2 shadow-card">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-farm-500">
              <Spinner /> {t('common.loading')}
            </div>
          )}
          {!loading && !hasResults && (
            <p className="px-3 py-6 text-center text-sm text-farm-500">{t('search.noResults')}</p>
          )}
          {!loading &&
            groups.map((g) => (
              <div key={g.key} className="mb-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-farm-400">
                  {isBn ? g.labelBn : g.labelEn}
                </p>
                {g.items.map((it) => {
                  const idx = flat.findIndex((f) => f.id === it.id && f.type === it.type);
                  return (
                    <Link
                      key={`${it.type}-${it.id}`}
                      to={it.url}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                        idx === active ? 'bg-farm-50' : 'hover:bg-farm-50'
                      }`}
                    >
                      {it.image ? (
                        <SmartImage src={it.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-farm-100 text-farm-500">
                          <SearchIcon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-farm-900">{it.title || '—'}</span>
                        {it.subtitle && <span className="block truncate text-xs text-farm-500">{pick(it.subtitle, it.subtitle)}</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
