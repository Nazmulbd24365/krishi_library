import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { SocialLink } from '@/types';
import { WeatherRotator } from './WeatherRotator';
import { NoticeTicker } from './NoticeTicker';

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  youtube: Youtube,
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
};

export function TopHeader() {
  const { t, lang, setLang, formatDate } = useI18n();
  const { data: socials } = useFetch<SocialLink[]>('/social-links', { pageSize: 20 });

  return (
    <div className="bg-farm-900 text-farm-50">
      <div className="shell flex flex-col gap-2 py-2 lg:flex-row lg:items-center lg:gap-6">
        {/* LEFT - weather rotator */}
        <div className="flex min-w-0 shrink-0 items-center order-1 lg:w-[300px]">
          <WeatherRotator />
        </div>

        {/* CENTER - notice ticker */}
        <div className="order-3 flex min-w-0 flex-1 items-center border-t border-white/10 pt-2 lg:order-2 lg:border-l lg:border-t-0 lg:border-white/10 lg:pl-6 lg:pt-0">
          <NoticeTicker />
        </div>

        {/* RIGHT - social, date, language */}
        <div className="order-2 flex shrink-0 items-center justify-between gap-4 lg:order-3 lg:justify-end">
          <div className="flex items-center gap-1">
            {(socials ?? []).map((s) => {
              const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="rounded-md p-1.5 text-farm-100/80 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>

          <time dateTime={new Date().toISOString()} className="hidden text-xs text-farm-100/80 md:block">
            {formatDate(new Date())}
          </time>

          <div className="flex overflow-hidden rounded-lg border border-white/20" role="group" aria-label="Language">
            <button
              onClick={() => setLang('bn')}
              aria-pressed={lang === 'bn'}
              className={`px-2.5 py-1 text-xs font-semibold transition ${
                lang === 'bn' ? 'bg-gold-500 text-farm-950' : 'text-farm-100/80 hover:bg-white/10'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`px-2.5 py-1 text-xs font-semibold transition ${
                lang === 'en' ? 'bg-gold-500 text-farm-950' : 'text-farm-100/80 hover:bg-white/10'
              }`}
            >
              EN
            </button>
          </div>
          <span className="sr-only">{t('brand.short')}</span>
        </div>
      </div>
    </div>
  );
}
