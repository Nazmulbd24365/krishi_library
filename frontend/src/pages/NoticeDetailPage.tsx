import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Notice } from '@/types';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { ShareButton } from '@/components/ShareButton';
import { usePageMeta } from '@/lib/seo';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const { t, pick, formatDate } = useI18n();
  const { data, loading, error, refetch } = useFetch<Notice>(id ? `/notices/${id}` : null);
  const title = pick(data?.titleBn, data?.titleEn) || t('notice.title');
  const description = pick(data?.contentBn, data?.contentEn) || t('notice.title');
  usePageMeta({ title, description, type: 'article' });

  return (
    <section className="section">
      <div className="shell max-w-3xl">
        <Link to="/notices" className="mb-6 inline-flex items-center gap-2 text-sm text-farm-600 hover:text-farm-800">
          <ArrowLeft className="h-4 w-4" /> {t('notice.title')}
        </Link>
        {loading && <Skeleton className="h-60" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && data && (
          <Card className="p-8">
            <h1 className="font-display text-2xl font-bold text-farm-900">{pick(data.titleBn, data.titleEn)}</h1>
            {data.startDate && <p className="mt-2 text-sm text-farm-500">{formatDate(new Date(data.startDate))}</p>}
            <div className="mt-4">
              <ShareButton size="sm" title={title} description={description} />
            </div>
            <p className="prose-bn mt-5 whitespace-pre-line text-farm-700">{pick(data.contentBn, data.contentEn)}</p>
            {data.isExternal && data.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-farm-700 underline">
                {data.url}
              </a>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}
