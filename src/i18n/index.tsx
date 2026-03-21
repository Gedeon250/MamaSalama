import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { en } from './en';
import { rw } from './rw';

export type Lang = 'en' | 'rw';
export type TranslationKeys = typeof en;

const translations: Record<Lang, TranslationKeys> = { en, rw };

interface I18nContextType {
  t: TranslationKeys;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem('app_lang');
    return (stored === 'rw' ? 'rw' : 'en') as Lang;
  });

  useEffect(() => {
    if (profile?.language) {
      const profileLang = profile.language as string;
      if (profileLang === 'rw' || profileLang === 'sw') {
        setLang('rw');
      } else {
        setLang('en');
      }
    }
  }, [profile?.language]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = translations[lang];

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within I18nProvider');
  return context;
}
