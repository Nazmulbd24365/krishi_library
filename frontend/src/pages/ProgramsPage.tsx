import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { useCollection, useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Program } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Pagination, Skeleton, SmartImage } from '@/components/ui';
import { Lightbox } from '@/components/media';

export default function ProgramsPage() {
  const { t, pick, formatDate } = useI18n();
  usePageTitle('কার্যক্রম | Programs');
  const { data: years } = useFetch<number[]>('/program-years');
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    if (year === null && years && years.length) setYear(years[0]);
  }, [years, year]);

  const { items, meta, loading, error, refetch, page, setPage } = useCollection<Program>('programs', {
    pageSize: 6,
    filters: year ? { year } : {},
  });

  const [lightbox, setLightbox] = useState<{ images: { src: string; alt: string }[]; index: number } | null>(null);

  return (
    <>
      <PageHeader eyebrow={t('nav.programs')} title={t('programs.title')} subtitle={t('programs.subtitle')}>
        <div className="flex flex-wrap gap-2">
          {(years ?? []).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                year === y ? 'bg-farm-700 text-white shadow-soft' : 'bg-white text-farm-700 hover:bg-farm-100'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="section">
        <div className="shell space-y-8">
          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<CalendarDays className="h-10 w-10" />} />}

          {items.map((p) => {
            const imgs = p.images ?? [];
            const gallery = imgs.map((im) => ({ src: im.imageUrl, alt: im.altText ?? '' }));
            return (
              <article key={p.id} className="card-surface grid gap-6 p-5 md:grid-cols-2 md:p-6">
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-farm-500">
                    {p.categoryName && <Badge tone="gold">{p.categoryName}</Badge>}
                    {p.programDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(new Date(p.programDate))}
                      </span>
                    )}
                    {p.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-bold text-farm-900">{pick(p.titleBn, p.titleEn)}</h2>
                  <p className="prose-bn mt-3 flex-1 text-sm text-farm-700">{pick(p.descriptionBn, p.descriptionEn)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/programs/${p.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-farm-700 px-4 py-2 text-sm font-medium text-white hover:bg-farm-800"
                    >
                      {t('common.readMorePage')} <ArrowRight className="h-4 w-4" />
                    </Link>
                    {p.reportUrl && (
                      <a href={p.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-farm-200 px-4 py-2 text-sm text-farm-700 hover:bg-farm-50">
                        {t('common.downloadReport')}
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {imgs.length === 0 && (
                    <div className="col-span-2 flex h-44 items-center justify-center rounded-xl bg-farm-100 text-sm text-farm-400">
                      {t('common.empty')}
                    </div>
                  )}
                  {imgs.length === 1 && (
                    <button className="col-span-2 h-44 overflow-hidden rounded-xl" onClick={() => setLightbox({ images: gallery, index: 0 })}>
                      <SmartImage src={imgs[0].imageUrl} alt={imgs[0].altText ?? ''} className="h-full w-full object-cover transition hover:scale-105" />
                    </button>
                  )}
                  {imgs.length >= 2 &&
                    imgs.slice(0, 2).map((im, i) => (
                      <button
                        key={im.id}
                        className="h-44 overflow-hidden rounded-xl"
                        onClick={() => setLightbox({ images: gallery, index: i })}
                      >
                        <SmartImage src={im.imageUrl} alt={im.altText ?? ''} className="h-full w-full object-cover transition hover:scale-105" />
                      </button>
                    ))}
                </div>
              </article>
            );
          })}

          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>

      <Lightbox
        images={lightbox?.images ?? []}
        index={lightbox?.index ?? 0}
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        onIndexChange={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
      />
    </>
  );
}
