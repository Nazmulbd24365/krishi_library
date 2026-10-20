import { Link } from 'react-router-dom';
import { Facebook, Globe, Instagram, Linkedin, Mail, MapPin, Phone, Sprout, Twitter, Youtube } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { SiteSettings, SocialLink } from '@/types';
import { cn } from '@/components/ui';

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  youtube: Youtube,
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
};

/** Official brand colours applied to the icon on hover. */
const SOCIAL_HOVER: Record<string, string> = {
  facebook: 'hover:text-[#1877F2]',
  youtube: 'hover:text-[#FF0000]',
  instagram: 'hover:text-[#E4405F]',
  linkedin: 'hover:text-[#0A66C2]',
  x: 'hover:text-white',
  twitter: 'hover:text-[#1DA1F2]',
};

export function Footer() {
  const { t, pick } = useI18n();
  const { data: settings } = useFetch<SiteSettings>('/settings');
  const { data: socials } = useFetch<SocialLink[]>('/social-links', { pageSize: 20 });

  const quickLinks = [
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.programs'), to: '/programs' },
    { label: t('nav.achievement'), to: '/achievement' },
    { label: t('nav.weather'), to: '/weather' },
    { label: t('nav.contact'), to: '/contact' },
  ];
  const libraryLinks = [
    { label: t('nav.library'), to: '/library' },
    { label: t('nav.museum'), to: '/museum' },
    { label: t('nav.publication'), to: '/publication' },
    { label: t('nav.research'), to: '/research' },
  ];

  const name = settings ? pick(settings.siteNameBn, settings.siteNameEn) : t('brand.name');

  return (
    <footer className="mt-16 bg-farm-950 text-farm-100">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-farm-700 text-white">
                <Sprout className="h-5 w-5" />
              </span>
            )}
            <span className="font-display font-bold text-white">{name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-farm-100/75">
            {settings ? pick(settings.footerAboutBn, settings.footerAboutEn) : ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(socials ?? []).map((s) => {
              const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={cn(
                    'rounded-lg bg-white/5 p-2 text-farm-100/80 transition',
                    SOCIAL_HOVER[s.platform] ?? 'hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
            {t('footer.quickLinks')}
          </h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-farm-100/80 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
            {t('footer.library')}
          </h3>
          <ul className="space-y-2 text-sm">
            {libraryLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-farm-100/80 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-3 text-sm text-farm-100/80">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>{settings ? pick(settings.addressBn, settings.addressEn) : ''}</span>
            </li>
            {settings?.phone1 && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a href={`tel:${settings.phone1}`} className="hover:text-white">
                  {settings.phone1}
                </a>
              </li>
            )}
            {settings?.email1 && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a href={`mailto:${settings.email1}`} className="hover:text-white">
                  {settings.email1}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-5 text-xs text-farm-100/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {name}. {t('footer.rights')}.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
