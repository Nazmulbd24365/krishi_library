import { Link, useSearchParams } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { useCollection } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Video } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/components/ui';

const CATEGORIES = ['programs-news', 'press-media', 'krishi-news'] as const;
const LABEL_KEY: Record<string, string> = {
  'programs-news': 'videos.programsNews',
  'press-media': 'videos.pressMedia',
  'krishi-news': 'videos.krishiNews',
};

export default function VideosPage() {
  const { t, pick } = useI18n();
  usePageTitle('ভিডিও | Videos');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const { items, meta, loading, error, refetch, page, setPage, search, setSearch } = useCollection<Video>('videos', {
    pageSize: 9,
    filters: category ? { category } : {},
  });

  return (
    <>
      <PageHeader eyebrow={t('nav.videos')} title={t('videos.title')} subtitle={t('videos.subtitle')}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setParams({})}
            className={`rounded-full px-4 py-1.5 text-sm ${!category ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
          >
            {t('common.all')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setParams({ category: c })}
              className={`rounded-full px-4 py-1.5 text-sm ${category === c ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
            >
              {t(LABEL_KEY[c])}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="ml-auto w-full rounded-full border border-farm-200 px-4 py-1.5 text-sm sm:w-56"
          />
        </div>
      </PageHeader>

      <section className="section">
        <div className="shell">
          {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<PlayCircle className="h-10 w-10" />} />}
          {!loading && items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((v) => (
                <Link key={v.id} to={`/videos/${v.id}`} className="card-surface group overflow-hidden">
                  <div className="relative aspect-video overflow-hidden bg-farm-950">
                    <img src={v.thumbnailUrl ?? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt={pick(v.titleBn, v.titleEn)} loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="h-14 w-14 text-white/90 drop-shadow transition group-hover:scale-110" />
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold leading-snug text-farm-900 group-hover:text-farm-600">
                      {pick(v.titleBn, v.titleEn)}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>
    </>
  );
}
