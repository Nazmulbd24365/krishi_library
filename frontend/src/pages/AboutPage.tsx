import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { AboutContent, MissionVision as MV } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { VideoEmbed } from '@/components/media';
import { SmartImage } from '@/components/ui';
import { MissionVision } from '@/components/home/MissionVision';

export default function AboutPage() {
  usePageTitle('আমাদের সম্পর্কে | About Us');
  const { pick, t } = useI18n();
  const { data } = useFetch<AboutContent>('/about');
  const { data: mv } = useFetch<MV>('/mission-vision');
  void mv;

  return (
    <>
      <PageHeader eyebrow={t('nav.about')} title={t('about.title')} subtitle={pick(data?.headingBn, data?.headingEn)} />
      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="prose-bn whitespace-pre-line text-lg text-farm-800">
              {pick(data?.contentBn, data?.contentEn)}
            </p>
          </div>
          <aside className="space-y-4">
            <SmartImage
              src={data?.imageUrl}
              alt={pick(data?.headingBn, data?.headingEn)}
              className="h-64 w-full rounded-2xl object-cover shadow-soft"
            />
            <VideoEmbed youtubeUrl={data?.youtubeUrl} title={pick(data?.headingBn, data?.headingEn)} />
          </aside>
        </div>
      </section>
      <MissionVision />
    </>
  );
}
