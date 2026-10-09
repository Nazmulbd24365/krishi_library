import { Link } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { useCollection } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Publication } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Input, Pagination, Skeleton, SmartImage } from '@/components/ui';
import { Search } from 'lucide-react';

export default function PublicationPage() {
  const { t, pick, formatDate } = useI18n();
  usePageTitle('প্রকাশনা | Publications');
  const { items, meta, loading, error, refetch, page, setPage, search, setSearch } = useCollection<Publication>('publications', { pageSize: 8 });

  return (
    <>
      <PageHeader eyebrow={t('nav.publication')} title={t('publication.title')} subtitle={t('publication.subtitle')}>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="pl-9" />
        </div>
      </PageHeader>
      <section className="section">
        <div className="shell">
          {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<BookMarked className="h-10 w-10" />} />}
          {!loading && items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((p) => (
                <article key={p.id} className="card-surface group overflow-hidden">
                  <Link to={`/publication/${p.id}`}>
                    <SmartImage src={p.coverImage} alt={pick(p.titleBn, p.titleEn)} fallbackLabel={pick(p.titleBn, p.titleEn)} className="h-64 w-full object-cover transition duration-300 group-hover:scale-105" />
                  </Link>
                  <div className="p-4">
                    {p.categoryName && <Badge tone="gold">{p.categoryName}</Badge>}
                    <h3 className="mt-2 font-display font-bold leading-snug text-farm-900">
                      <Link to={`/publication/${p.id}`} className="hover:text-farm-600">{pick(p.titleBn, p.titleEn)}</Link>
                    </h3>
                    {p.author && <p className="mt-1 text-sm text-farm-500">{p.author}</p>}
                    {p.publishedDate && <p className="mt-1 text-xs text-farm-400">{formatDate(new Date(p.publishedDate))}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>
    </>
  );
}
