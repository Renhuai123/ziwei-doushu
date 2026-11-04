
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import vi from '@/messages/vi.json';
import en from '@/messages/en.json';
import zhCN from '@/messages/zh-CN.json';

import {
  defaultLocale,
  locales,
  type Locale,
} from '@/lib/i18n/config';

const dictionaries = {
  vi,
  en,
  'zh-CN': zhCN,
} as const;

type Dictionary = typeof vi;

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function getTranslation(
  dictionary: unknown,
  key: string,
): string | undefined {
  const result = key.split('.').reduce<unknown>((value, part) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      part in value
    ) {
      return (value as Record<string, unknown>)[part];
    }

    return undefined;
  }, dictionary);

  return typeof result === 'string' ? result : undefined;
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem('ziwei-locale');

    if (saved && locales.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('ziwei-locale', locale);
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    if (locales.includes(nextLocale)) {
      setLocaleState(nextLocale);
    }
  };

  const dictionary = dictionaries[locale] as Dictionary;

  const value = useMemo<LanguageContextType>(() => ({
    locale,
    setLocale,

    t: (key: string) => {
      return (
        getTranslation(dictionary, key) ??
        getTranslation(dictionaries[defaultLocale], key) ??
        key
      );
    },
  }), [locale, dictionary]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider',
    );
  }

  return context;
}
