import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Notice } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';

export default function NoticesPage() {
  const { t, pick, formatDate } = useI18n();
  usePageTitle('নোটিশ | Notices');
  const { data, loading, error, refetch } = useFetch<Notice[]>('/notices', { pageSize: 50 });

  return (
    <>
      <PageHeader eyebrow={t('notice.title')} title={t('notice.title')} />
      <section className="section">
        <div className="shell space-y-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (data?.length ?? 0) === 0 && <EmptyState icon={<Bell className="h-10 w-10" />} />}
          {(data ?? []).map((n) => (
            <Link key={n.id} to={n.url || `/notices/${n.id}`} className="card-surface block p-5 transition hover:shadow-card">
              <h2 className="font-display font-semibold text-farm-900">{pick(n.titleBn, n.titleEn)}</h2>
              {(n.contentBn || n.contentEn) && (
                <p className="mt-1 line-clamp-2 text-sm text-farm-600">{pick(n.contentBn, n.contentEn)}</p>
              )}
              {n.startDate && <p className="mt-1 text-xs text-farm-400">{formatDate(new Date(n.startDate))}</p>}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
