import { Compass, Target, ListChecks } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { MissionVision as MissionVisionType } from '@/types';

export function MissionVision() {
  const { t, pick } = useI18n();
  const { data } = useFetch<MissionVisionType>('/mission-vision');
  if (!data) return null;

  const cards = [
    { key: 'mission', label: t('home.mission.mission'), text: pick(data.missionBn, data.missionEn), Icon: Target },
    { key: 'vision', label: t('home.mission.vision'), text: pick(data.visionBn, data.visionEn), Icon: Compass },
    { key: 'objectives', label: t('home.mission.objectives'), text: pick(data.objectivesBn, data.objectivesEn), Icon: ListChecks },
  ];

  return (
    <section className="section bg-farm-50">
      <div className="shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t('home.mission.tag')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">{t('home.mission.title')}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map(({ key, label, text, Icon }) => (
            <article key={key} className="card-surface flex flex-col p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-farm-700 text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-farm-900">{label}</h3>
              <p className="prose-bn mt-3 flex-1 text-sm text-farm-700">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
