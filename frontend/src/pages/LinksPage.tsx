import { Globe, ExternalLink, Link2 } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { UsefulLink } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui';

export default function LinksPage() {
  const { t, pick } = useI18n();
  usePageTitle('লিংক | Links');
  const { data, loading, error, refetch } = useFetch<UsefulLink[]>('/links', { pageSize: 100 });
  const grouped = (data ?? []).reduce<Record<string, UsefulLink[]>>((acc, l) => {
    const key = l.category || 'General';
    (acc[key] ??= []).push(l);
    return acc;
  }, {});

  return (
    <>
      <PageHeader eyebrow={t('nav.more')} title={t('links.title')} subtitle={t('links.subtitle')} />
      <section className="section">
        <div className="shell space-y-10">
          {loading && <Skeleton className="h-40" />}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (data?.length ?? 0) === 0 && <EmptyState icon={<Link2 className="h-10 w-10" />} />}
          {Object.entries(grouped).map(([category, links]) => (
            <div key={category}>
              <h2 className="mb-4 font-display text-xl font-bold text-farm-900">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {links.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-surface group flex items-start gap-3 p-5 transition hover:shadow-card"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                      <Globe className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold text-farm-900">
                        {pick(l.titleBn, l.titleEn)}
                        <ExternalLink className="h-3.5 w-3.5 text-farm-400" />
                      </span>
                      {(l.descriptionBn || l.descriptionEn) && (
                        <span className="mt-1 block text-sm text-farm-600">{pick(l.descriptionBn, l.descriptionEn)}</span>
                      )}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
          {!loading && <Badge tone="gray">{data?.length ?? 0} links</Badge>}
        </div>
      </section>
    </>
  );
}
