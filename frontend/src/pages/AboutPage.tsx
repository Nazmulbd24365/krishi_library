import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { AboutContent, MissionVision as MV } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
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
            <div className="group relative mx-auto h-64 w-64 overflow-hidden rounded-full shadow-soft ring-4 ring-farm-50">
              <SmartImage
                src={data?.imageUrl}
                alt={pick(data?.headingBn, data?.headingEn)}
                className="h-full w-full rounded-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
          </aside>
        </div>
      </section>
      <MissionVision />
    </>
  );
}
