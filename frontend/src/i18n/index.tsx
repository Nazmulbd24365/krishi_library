import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { bn } from './bn';
import { en } from './en';
import { formatBengaliDate, formatEnglishDate } from './bengaliDate';

export type Lang = 'bn' | 'en';

const DICTS: Record<Lang, Record<string, string>> = { bn, en };
const STORAGE_KEY = 'sail-lang';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Translate an interface string key. Falls back to Bengali, then the key. */
  t: (key: string) => string;
  /**
   * Pick a localized content value.
   * Fallback policy: use the requested language; if it is empty, fall back to
   * the other language; if both are empty return an empty string (never
   * "undefined"). This avoids showing undefined content anywhere.
   */
  pick: (bnValue?: string | null, enValue?: string | null) => string;
  formatDate: (date?: Date) => string;
  isBn: boolean;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'bn';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'bn' ? stored : 'bn';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((l) => (l === 'bn' ? 'en' : 'bn')), []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (key) => DICTS[lang][key] ?? DICTS.bn[key] ?? key,
      pick: (bnValue, enValue) => {
        const primary = lang === 'bn' ? bnValue : enValue;
        const secondary = lang === 'bn' ? enValue : bnValue;
        const chosen = (primary ?? '').trim() ? primary! : (secondary ?? '');
        return chosen ?? '';
      },
      formatDate: (date = new Date()) => (lang === 'bn' ? formatBengaliDate(date) : formatEnglishDate(date)),
      isBn: lang === 'bn',
    }),
    [lang, setLang, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider');
  return ctx;
}
