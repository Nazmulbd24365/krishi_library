import { useEffect, useRef, useState } from 'react';
import { BookOpen, Award, CalendarDays, FileText } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Statistic } from '@/types';
import { toBengaliNumerals } from '@/i18n/bengaliDate';

const ICONS: Record<string, typeof BookOpen> = {
  books: BookOpen,
  programs: CalendarDays,
  publications: FileText,
  achievements: Award,
};

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function StatCard({ stat }: { stat: Statistic }) {
  const { isBn, pick } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[stat.key] ?? BookOpen;
  const value = useCountUp(stat.value, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="card-surface flex items-center gap-4 p-5 md:p-6">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-farm-100 text-farm-700">
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="font-display text-3xl font-bold text-farm-900">
          {isBn ? toBengaliNumerals(value) : value.toLocaleString('en-US')}
          <span className="sr-only">{stat.value}</span>
        </p>
        <p className="text-sm font-medium text-farm-600">{pick(stat.labelBn, stat.labelEn)}</p>
      </div>
    </div>
  );
}

export function StatCounters() {
  const { t } = useI18n();
  const { data } = useFetch<Statistic[]>('/statistics');
  if (!data || data.length === 0) return null;
  return (
    <section className="shell mt-10 md:mt-14" aria-label={t('home.stats.title')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((s) => (
          <StatCard key={s.key} stat={s} />
        ))}
      </div>
    </section>
  );
}
