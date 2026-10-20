import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Publication } from '@/types';
import { Card, ErrorState, Skeleton, SmartImage } from '@/components/ui';
import { ShareButton } from '@/components/ShareButton';
import { usePageMeta } from '@/lib/seo';

export default function PublicationDetailPage() {
  const { id } = useParams();
  const { t, pick, formatDate } = useI18n();
  const { data: pub, loading, error, refetch } = useFetch<Publication>(id ? `/publications/${id}` : null);
  const title = pick(pub?.titleBn, pub?.titleEn) || t('publication.title');
  const description = pick(pub?.descriptionBn, pub?.descriptionEn) || t('publication.subtitle');
  usePageMeta({ title, description, image: pub?.coverImage, type: 'article' });

  return (
    <section className="section">
      <div className="shell">
        <Link to="/publication" className="mb-6 inline-flex items-center gap-2 text-sm text-farm-600 hover:text-farm-800">
          <ArrowLeft className="h-4 w-4" /> {t('nav.publication')}
        </Link>
        {loading && <Skeleton className="h-80" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && pub && (
          <div className="grid gap-8 md:grid-cols-[300px_1fr]">
            <SmartImage src={pub.coverImage} alt={pick(pub.titleBn, pub.titleEn)} fallbackLabel={pick(pub.titleBn, pub.titleEn)} className="h-96 w-full rounded-2xl object-cover shadow-soft" />
            <Card className="p-6 md:p-8">
              <h1 className="font-display text-2xl font-bold text-farm-900 md:text-3xl">{pick(pub.titleBn, pub.titleEn)}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-farm-500">
                {pub.author && <span>{pub.author}</span>}
                {pub.publishedDate && <span>{formatDate(new Date(pub.publishedDate))}</span>}
                {pub.categoryName && <span>{pub.categoryName}</span>}
              </div>
              <div className="mt-4">
                <ShareButton size="sm" title={title} description={description} />
              </div>
              <p className="prose-bn mt-5 whitespace-pre-line text-farm-700">{pick(pub.descriptionBn, pub.descriptionEn)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {pub.fileUrl && (
                  <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-farm-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-farm-800">
                    <Download className="h-4 w-4" /> {t('common.download')}
                  </a>
                )}
                {pub.externalUrl && (
                  <a href={pub.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-farm-200 px-5 py-2.5 text-sm text-farm-700 hover:bg-farm-50">
                    <ExternalLink className="h-4 w-4" /> {t('common.visit')}
                  </a>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
