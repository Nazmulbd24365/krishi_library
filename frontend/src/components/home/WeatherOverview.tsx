import { Droplets, Wind, AlertTriangle, Clock } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { WeatherEntry } from '@/types';
import { WeatherIcon } from '@/components/layout/WeatherRotator';
import { Skeleton } from '@/components/ui';

interface WeatherResponse {
  provider: string;
  units: string;
  divisions: WeatherEntry[];
}

export function WeatherOverview() {
  const { t, pick, isBn, formatDate, lang } = useI18n();
  const { data, loading, error } = useFetch<WeatherResponse>('/weather');

  const lastUpdated = data?.divisions?.find((d) => d.fetchedAt)?.fetchedAt;

  return (
    <section className="section bg-farm-50">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t('weather.divisions')}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">{t('weather.overview')}</h2>
            <p className="mt-2 text-sm text-farm-600">{t('weather.overviewDesc')}</p>
          </div>
          {lastUpdated && (
            <p className="flex items-center gap-1.5 text-xs text-farm-500">
              <Clock className="h-3.5 w-3.5" />
              {t('weather.lastUpdated')}: {formatDate(new Date(lastUpdated))}
            </p>
          )}
        </div>

        {loading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        )}

        {!loading && (error || !data) && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            {t('weather.unavailable')}
          </div>
        )}

        {!loading && data && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.divisions.map((d) => (
              <article key={d.division} className="card-surface p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold text-farm-900">{isBn ? d.nameBn : d.nameEn}</h3>
                  <WeatherIcon name={d.icon} className="text-farm-600" />
                </div>
                {d.ok && d.temperature !== null ? (
                  <>
                    <p className="mt-2 font-display text-3xl font-bold text-farm-800">
                      {Math.round(d.temperature)}°{d.units === 'metric' ? 'C' : 'F'}
                    </p>
                    <p className="text-sm text-farm-600">{pick(d.conditionBn, d.condition)}</p>
                    <div className="mt-3 flex gap-4 text-xs text-farm-500">
                      {d.humidity != null && (
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5" /> {d.humidity}%
                        </span>
                      )}
                      {d.windSpeed != null && (
                        <span className="flex items-center gap-1">
                          <Wind className="h-3.5 w-3.5" /> {Math.round(d.windSpeed)}
                        </span>
                      )}
                    </div>
                    {d.stale && (
                      <p className="mt-2 text-[11px] text-amber-600">
                        {t('common.stale')} ·{' '}
                        {new Date(d.fetchedAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-farm-500">{t('common.unavailable')}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
