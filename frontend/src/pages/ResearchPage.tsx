import { FlaskConical, Download, ExternalLink } from 'lucide-react';
import { useCollection } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { ResearchItem } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Input, Pagination, Skeleton } from '@/components/ui';
import { Search } from 'lucide-react';

export default function ResearchPage() {
  const { t, pick, formatDate } = useI18n();
  usePageTitle('গবেষণা | Research');
  const { items, meta, loading, error, refetch, page, setPage, search, setSearch } = useCollection<ResearchItem>('research', { pageSize: 8 });

  return (
    <>
      <PageHeader eyebrow={t('nav.more')} title={t('research.title')} subtitle={t('research.subtitle')}>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="pl-9" />
        </div>
      </PageHeader>
      <section className="section">
        <div className="shell space-y-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<FlaskConical className="h-10 w-10" />} />}
          {items.map((r) => (
            <article key={r.id} className="card-surface p-6">
              <div className="flex flex-wrap items-center gap-2">
                {r.category && <Badge tone="gold">{r.category}</Badge>}
                {r.researchDate && <span className="text-xs text-farm-400">{formatDate(new Date(r.researchDate))}</span>}
              </div>
              <h2 className="mt-2 font-display text-lg font-bold text-farm-900">{pick(r.titleBn, r.titleEn)}</h2>
              {r.researcher && <p className="text-sm text-farm-500">{r.researcher}</p>}
              <p className="prose-bn mt-2 text-sm text-farm-700">{pick(r.abstractBn, r.abstractEn)}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-farm-700 hover:text-farm-900">
                    <Download className="h-4 w-4" /> {t('common.download')}
                  </a>
                )}
                {r.externalUrl && (
                  <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-farm-700 hover:text-farm-900">
                    <ExternalLink className="h-4 w-4" /> {t('common.visit')}
                  </a>
                )}
              </div>
            </article>
          ))}
          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>
    </>
  );
}
