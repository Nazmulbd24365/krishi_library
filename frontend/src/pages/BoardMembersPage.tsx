import { Users } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { BoardMember } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { EmptyState, ErrorState, Skeleton, SmartImage } from '@/components/ui';

export default function BoardMembersPage() {
  const { t, pick } = useI18n();
  usePageTitle('বোর্ড সদস্য | Board Members');
  const { data, loading, error, refetch } = useFetch<BoardMember[]>('/board-members', { pageSize: 50 });

  return (
    <>
      <PageHeader eyebrow={t('nav.more')} title={t('board.title')} subtitle={t('board.subtitle')} />
      <section className="section">
        <div className="shell">
          {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (data?.length ?? 0) === 0 && <EmptyState icon={<Users className="h-10 w-10" />} />}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(data ?? []).map((m) => (
              <article key={m.id} className="card-surface overflow-hidden text-center">
                <SmartImage src={m.photoUrl} alt={pick(m.nameBn, m.nameEn)} fallbackLabel={pick(m.nameBn, m.nameEn).charAt(0)} className="h-64 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-display font-bold text-farm-900">{pick(m.nameBn, m.nameEn)}</h3>
                  <p className="text-sm text-farm-600">{pick(m.designationBn, m.designationEn)}</p>
                  {(m.bioBn || m.bioEn) && <p className="mt-2 text-xs text-farm-500">{pick(m.bioBn, m.bioEn)}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
