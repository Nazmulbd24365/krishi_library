import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Sprout, X, Search, Lock } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { NavItem, SiteSettings } from '@/types';
import { SearchBar } from './SearchBar';
import { cn } from '@/components/ui';

const FALLBACK: { labelKey: string; url: string; children?: { labelKey: string; url: string }[] }[] = [
  { labelKey: 'nav.home', url: '/' },
  { labelKey: 'nav.about', url: '/about' },
  { labelKey: 'nav.library', url: '/library' },
  { labelKey: 'nav.museum', url: '/museum' },
  { labelKey: 'nav.gallery', url: '/gallery' },
  { labelKey: 'nav.programs', url: '/programs' },
  { labelKey: 'nav.publication', url: '/publication' },
  { labelKey: 'nav.achievement', url: '/achievement' },
  { labelKey: 'nav.contact', url: '/contact' },
  {
    labelKey: 'nav.more',
    url: '#',
    children: [
      { labelKey: 'nav.boardMembers', url: '/board-members' },
      { labelKey: 'nav.links', url: '/links' },
      { labelKey: 'nav.research', url: '/research' },
    ],
  },
  {
    labelKey: 'nav.videos',
    url: '/videos',
    children: [
      { labelKey: 'videos.programsNews', url: '/videos?category=programs-news' },
      { labelKey: 'videos.pressMedia', url: '/videos?category=press-media' },
      { labelKey: 'videos.krishiNews', url: '/videos?category=krishi-news' },
    ],
  },
];

export function MainHeader() {
  const { t, pick } = useI18n();
  const { data: navItems } = useFetch<NavItem[]>('/navigation');
  const { data: settings } = useFetch<SiteSettings>('/settings');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const items: NavItem[] | null =
    navItems && navItems.length
      ? navItems
      : FALLBACK.map((f, i) => ({
          id: `fallback-${i}`,
          labelBn: t(f.labelKey),
          labelEn: t(f.labelKey),
          url: f.url,
          type: 'internal' as const,
          order: i,
          isActive: true,
          openInNewTab: false,
          children: f.children?.map((c, j) => ({
            id: `fallback-${i}-${j}`,
            labelBn: t(c.labelKey),
            labelEn: t(c.labelKey),
            url: c.url,
            type: 'internal' as const,
            order: j,
            isActive: true,
            openInNewTab: false,
          })),
        }));

  const siteName = settings ? pick(settings.siteNameBn, settings.siteNameEn) : t('brand.name');

  return (
    <header className="sticky top-0 z-40 border-b border-farm-100 bg-cream/95 backdrop-blur">
      <div className="shell flex items-center justify-between gap-4 py-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3" aria-label={siteName}>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-farm-700 text-white shadow-soft">
              <Sprout className="h-6 w-6" />
            </span>
          )}
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-farm-900 md:text-lg">{siteName}</span>
            <span className="hidden text-xs text-farm-500 sm:block">
              {settings ? pick(settings.taglineBn, settings.taglineEn) : t('brand.sub')}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav ref={navRef} className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
          {items.map((item) => {
            const hasChildren = (item.children?.length ?? 0) > 0;
            const label = pick(item.labelBn, item.labelEn);
            const isExternal = item.type === 'external';
            if (!hasChildren) {
              const external = isExternal || /^https?:\/\//.test(item.url);
              return external ? (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-farm-800 transition hover:bg-farm-50 hover:text-farm-900"
                >
                  {label}
                </a>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.url}
                  end={item.url === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive ? 'bg-farm-100 text-farm-900' : 'text-farm-800 hover:bg-farm-50 hover:text-farm-900',
                    )
                  }
                >
                  {label}
                </NavLink>
              );
            }
            const open = openMenu === item.id;
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.id)}
                onMouseLeave={() => setOpenMenu((m) => (m === item.id ? null : m))}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(open ? null : item.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                    open ? 'bg-farm-100 text-farm-900' : 'text-farm-800 hover:bg-farm-50',
                  )}
                >
                  {label}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.ul
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-0 top-full z-50 min-w-52 overflow-hidden rounded-2xl border border-farm-100 bg-white py-1.5 shadow-card"
                    >
                      {item.children!.map((child) => {
                        const childExternal = child.type === 'external' || /^https?:\/\//.test(child.url);
                        const childLabel = pick(child.labelBn, child.labelEn);
                        return (
                          <li key={child.id}>
                            {childExternal ? (
                              <a
                                href={child.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 text-sm text-farm-800 hover:bg-farm-50"
                              >
                                {childLabel}
                              </a>
                            ) : (
                              <Link to={child.url} className="block px-4 py-2 text-sm text-farm-800 hover:bg-farm-50">
                                {childLabel}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <SearchBar className="relative hidden lg:block lg:w-56 xl:w-64" />
          <Link
            to="/admin"
            className="hidden rounded-lg p-2 text-farm-600 transition hover:bg-farm-50 hover:text-farm-800 sm:block"
            aria-label="Admin"
            title="Admin"
          >
            <Lock className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-farm-800 hover:bg-farm-50 xl:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-farm-100 bg-white xl:hidden"
          >
            <div className="shell space-y-3 py-4">
              <SearchBar className="relative" />
              <nav className="space-y-1" aria-label="Mobile navigation">
                {items.map((item) => {
                  const label = pick(item.labelBn, item.labelEn);
                  const hasChildren = (item.children?.length ?? 0) > 0;
                  const expanded = mobileExpanded === item.id;
                  if (!hasChildren) {
                    return (
                      <Link
                        key={item.id}
                        to={item.url}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-farm-800 hover:bg-farm-50"
                      >
                        {label}
                      </Link>
                    );
                  }
                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => setMobileExpanded(expanded ? null : item.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-farm-800 hover:bg-farm-50"
                      >
                        {label}
                        <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                      </button>
                      {expanded && (
                        <div className="ml-3 space-y-1 border-l border-farm-100 pl-3 pt-1">
                          {item.children!.map((child) => (
                            <Link
                              key={child.id}
                              to={child.url}
                              className="block rounded-lg px-3 py-2 text-sm text-farm-700 hover:bg-farm-50"
                            >
                              {pick(child.labelBn, child.labelEn)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
