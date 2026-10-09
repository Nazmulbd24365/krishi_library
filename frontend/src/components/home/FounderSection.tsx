import { Quote } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { FounderMessage } from '@/types';
import { SmartImage } from '@/components/ui';

export function FounderSection() {
  const { t, pick } = useI18n();
  const { data } = useFetch<FounderMessage>('/founder-message');
  if (!data) return null;

  return (
    <section className="section bg-white">
      <div className="shell grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="eyebrow">{t('home.founder.title')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">
            {t('home.founder.title')}
          </h2>
          <Quote className="mt-6 h-9 w-9 text-gold-400" />
          <p className="prose-bn mt-3 whitespace-pre-line text-farm-800">
            {pick(data.messageBn, data.messageEn)}
          </p>
        </div>

        <div className="mx-auto w-full max-w-xs text-center lg:mx-0">
          <SmartImage
            src={data.portraitUrl}
            alt={pick(data.nameBn, data.nameEn)}
            className="mx-auto h-72 w-full rounded-2xl object-cover shadow-card"
          />
          <p className="mt-4 font-display text-lg font-bold text-farm-900">{pick(data.nameBn, data.nameEn)}</p>
          <p className="text-sm text-farm-600">{pick(data.designationBn, data.designationEn)}</p>
        </div>
      </div>
    </section>
  );
}
