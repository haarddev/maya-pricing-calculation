import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import he from '../locales/he.json';

export const supportedLanguages = ['en', 'he'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function applyDocumentDirection(language: string) {
  const dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

applyDocumentDirection(i18n.language);
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
