import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Program } from '@/types';
import { Badge, Card, ErrorState, Skeleton, SmartImage } from '@/components/ui';
import { VideoEmbed } from '@/components/media';
import { ShareButton } from '@/components/ShareButton';
import { usePageMeta } from '@/lib/seo';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const { t, pick, formatDate } = useI18n();
  const { data: program, loading, error, refetch } = useFetch<Program>(id ? `/programs/${id}` : null);
  const title = pick(program?.titleBn, program?.titleEn) || t('programs.detail');
  const description = pick(program?.descriptionBn, program?.descriptionEn) || t('programs.subtitle');
  usePageMeta({
    title,
    description,
    image: program?.images?.[0]?.imageUrl,
    type: 'article',
  });

  return (
    <section className="section">
      <div className="shell">
        <Link to="/programs" className="mb-6 inline-flex items-center gap-2 text-sm text-farm-600 hover:text-farm-800">
          <ArrowLeft className="h-4 w-4" /> {t('nav.programs')}
        </Link>
        {loading && <Skeleton className="h-80" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && program && (
          <Card>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-farm-500">
                  <Badge tone="gold">{program.year}</Badge>
                  {program.categoryName && <Badge tone="gray">{program.categoryName}</Badge>}
                </div>
                <h1 className="mt-3 font-display text-2xl font-bold text-farm-900 md:text-3xl">
                  {pick(program.titleBn, program.titleEn)}
                </h1>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-farm-600">
                  {program.programDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> {formatDate(new Date(program.programDate))}
                    </span>
                  )}
                  {program.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {program.location}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <ShareButton size="sm" title={title} description={description} />
                </div>
                <p className="prose-bn mt-5 whitespace-pre-line text-farm-700">
                  {pick(program.descriptionBn, program.descriptionEn)}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {program.reportUrl && (
                    <a href={program.reportUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-farm-200 px-4 py-2 text-sm text-farm-700 hover:bg-farm-50">
                      {t('common.downloadReport')}
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-3 p-6 md:p-8">
                {(program.images ?? []).map((im) => (
                  <SmartImage key={im.id} src={im.imageUrl} alt={im.altText ?? ''} className="h-48 w-full rounded-xl object-cover" />
                ))}
                {program.videoUrl && <VideoEmbed youtubeUrl={program.videoUrl} title={pick(program.titleBn, program.titleEn)} />}
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
