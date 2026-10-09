import { useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Loader2,
  MapPin,
  Sun,
} from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { WeatherEntry } from '@/types';
import { cn } from '@/components/ui';

const ICONS: Record<string, typeof Sun> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
};

interface WeatherResponse {
  provider: string;
  units: string;
  divisions: WeatherEntry[];
}

export function WeatherRotator() {
  const { t, pick, isBn } = useI18n();
  const { data, loading, error } = useFetch<WeatherResponse>('/weather');
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState<number | null>(null);

  const divisions = data?.divisions ?? [];

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (reduceMotion || manual !== null || divisions.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % divisions.length), 3000);
    return () => clearInterval(id);
  }, [reduceMotion, manual, divisions.length]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-farm-100/90">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span className="text-xs">{t('weather.loading')}</span>
      </div>
    );
  }

  if (error || divisions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-farm-100/80">
        <Cloud className="h-4 w-4" aria-hidden />
        <span className="text-xs">{t('weather.unavailable')}</span>
      </div>
    );
  }

  const current = divisions[manual ?? index % divisions.length];
  const Icon = ICONS[current.icon] ?? Cloud;
  const name = isBn ? current.nameBn : current.nameEn;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2" aria-live="polite">
        <MapPin className="h-3.5 w-3.5 text-gold-400" aria-hidden />
        <span className="text-xs font-semibold text-farm-50">{name}</span>
        <Icon className="h-4 w-4 text-gold-400" aria-hidden />
        {current.ok && current.temperature !== null ? (
          <span className="text-xs text-farm-100">
            {Math.round(current.temperature)}°{current.units === 'metric' ? 'C' : 'F'}
            <span className="mx-1 text-farm-100/50">·</span>
            <span className="text-farm-100/90">{pick(current.conditionBn, current.condition)}</span>
          </span>
        ) : (
          <span className="text-xs text-farm-100/80">{t('common.unavailable')}</span>
        )}
      </div>
      <label className="sr-only" htmlFor="weather-division">
        {t('weather.divisions')}
      </label>
      <select
        id="weather-division"
        className="hidden rounded-md border border-white/20 bg-transparent px-1 py-0.5 text-[11px] text-farm-50 outline-none hover:bg-white/10 lg:block"
        value={manual ?? index % divisions.length}
        onChange={(e) => setManual(Number(e.target.value))}
        aria-label={t('weather.divisions')}
      >
        {divisions.map((d, i) => (
          <option key={d.division} value={i} className="text-farm-950">
            {isBn ? d.nameBn : d.nameEn}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Cloud;
  return <Icon className={cn('h-6 w-6', className)} aria-hidden />;
}
