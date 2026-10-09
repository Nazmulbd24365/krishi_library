import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Video } from '@/types';
import { usePageTitle } from '@/components/PageHeader';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { VideoEmbed } from '@/components/media';

export default function VideoDetailPage() {
  const { id } = useParams();
  const { t, pick } = useI18n();
  const { data: video, loading, error, refetch } = useFetch<Video>(id ? `/videos/${id}` : null);
  usePageTitle(pick(video?.titleBn, video?.titleEn) || t('videos.title'));

  return (
    <section className="section">
      <div className="shell">
        <Link to="/videos" className="mb-6 inline-flex items-center gap-2 text-sm text-farm-600 hover:text-farm-800">
          <ArrowLeft className="h-4 w-4" /> {t('nav.videos')}
        </Link>
        {loading && <Skeleton className="h-96" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && video && (
          <div className="mx-auto max-w-4xl">
            <VideoEmbed youtubeUrl={video.youtubeUrl} title={pick(video.titleBn, video.titleEn)} autoplay />
            <Card className="mt-6 p-6">
              <h1 className="font-display text-2xl font-bold text-farm-900">{pick(video.titleBn, video.titleEn)}</h1>
              <p className="prose-bn mt-3 text-farm-700">{pick(video.descriptionBn, video.descriptionEn)}</p>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
