import { useCallback, useState } from 'react';
import { Share2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { WeatherShareDialog } from '@/components/WeatherShareDialog';
import { WeatherOverview } from '@/components/home/WeatherOverview';
import { useI18n } from '@/i18n';
import { useFetch } from '@/lib/useApi';
import { usePageMeta } from '@/lib/seo';
import type { WeatherResponse } from '@/types';

export default function WeatherPage() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<WeatherResponse>('/weather');
  const [shareOpen, setShareOpen] = useState(false);
  const closeShare = useCallback(() => setShareOpen(false), []);

  usePageMeta({
    title: `${t('weather.overview')} | Weather Update`,
    description: t('weather.overviewDesc'),
    type: 'website',
  });

  return (
    <>
      <PageHeader eyebrow={t('nav.weather')} title={t('weather.overview')} subtitle={t('weather.overviewDesc')}>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-farm-700 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-farm-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-500 focus-visible:ring-offset-2"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {t('weather.share')}
        </button>
      </PageHeader>
      <WeatherOverview
        showHeading={false}
        withShare
        controlled
        weather={data}
        weatherLoading={loading}
        weatherError={error}
      />
      <WeatherShareDialog
        open={shareOpen}
        onClose={closeShare}
        weather={data}
        loading={loading}
        error={error}
      />
    </>
  );
}
