/** Supported interface locales. Keep domain terminology separate from UI labels. */
export const locales = ['vi', 'en', 'zh-CN'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

export const localeLabels: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  'zh-CN': '简体中文',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
