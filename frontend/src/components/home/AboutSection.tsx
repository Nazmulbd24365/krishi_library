import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { AboutContent } from '@/types';
import { VideoEmbed } from '@/components/media';
import { SmartImage } from '@/components/ui';

export function AboutSection() {
  const { t, pick } = useI18n();
  const { data } = useFetch<AboutContent>('/about');
  if (!data) return null;

  return (
    <section className="section">
      <div className="shell grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{t('home.about.title')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">
            {pick(data.headingBn, data.headingEn)}
          </h2>
          <p className="prose-bn mt-4 text-farm-700">
            {pick(data.excerptBn, data.excerptEn) || pick(data.contentBn, data.contentEn).slice(0, 320)}
          </p>
          <Link
            to="/about"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-farm-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-farm-800"
          >
            {t('common.readMore')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          <SmartImage
            src={data.imageUrl}
            alt={pick(data.headingBn, data.headingEn)}
            className="h-56 w-full rounded-2xl object-cover shadow-soft md:h-64"
          />
          <VideoEmbed youtubeUrl={data.youtubeUrl} title={pick(data.headingBn, data.headingEn)} />
        </div>
      </div>
    </section>
  );
}
