'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { locales, localeLabels, isLocale } from '@/lib/i18n/config';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <select
      value={locale}
      onChange={(e) => {
        if (isLocale(e.target.value)) setLocale(e.target.value);
      }}
      aria-label="Language"
      className="text-[11px] sm:text-xs rounded-full px-2 py-1 bg-transparent border"
      style={{ borderColor: 'rgba(212,168,67,0.3)', color: 'inherit' }}
    >
      {locales.map((l) => (
        <option key={l} value={l} style={{ color: '#000' }}>
          {localeLabels[l]}
        </option>
      ))}
    </select>
  );
}
