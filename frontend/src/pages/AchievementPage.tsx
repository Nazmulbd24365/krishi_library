import { useState } from 'react';
import { Award } from 'lucide-react';
import { useCollection } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Achievement } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Pagination, Skeleton, SmartImage } from '@/components/ui';
import { Lightbox } from '@/components/media';

export default function AchievementPage() {
  const { t, pick, formatDate } = useI18n();
  usePageTitle('অর্জন | Achievements');
  const { items, meta, loading, error, refetch, page, setPage } = useCollection<Achievement>('achievements', { pageSize: 9 });
  const [lb, setLb] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <PageHeader eyebrow={t('nav.achievement')} title={t('achievement.title')} subtitle={t('achievement.subtitle')} />
      <section className="section">
        <div className="shell">
          {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<Award className="h-10 w-10" />} />}
          {!loading && items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <article key={a.id} className="card-surface overflow-hidden">
                  {a.imageUrl && (
                    <button onClick={() => setLb({ src: a.imageUrl!, alt: pick(a.titleBn, a.titleEn) })} className="block w-full">
                      <SmartImage src={a.imageUrl} alt={pick(a.titleBn, a.titleEn)} className="h-52 w-full object-cover transition hover:scale-105" />
                    </button>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {a.categoryName && <Badge tone="gold">{a.categoryName}</Badge>}
                      {a.issuer && <Badge tone="gray">{a.issuer}</Badge>}
                    </div>
                    <h3 className="mt-2 font-display font-bold text-farm-900">{pick(a.titleBn, a.titleEn)}</h3>
                    {a.achievementDate && <p className="mt-1 text-xs text-farm-400">{formatDate(new Date(a.achievementDate))}</p>}
                    <p className="prose-bn mt-2 text-sm text-farm-700">{pick(a.descriptionBn, a.descriptionEn)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>
      <Lightbox images={lb ? [{ src: lb.src, alt: lb.alt }] : []} index={0} open={Boolean(lb)} onClose={() => setLb(null)} onIndexChange={() => {}} />
    </>
  );
}
