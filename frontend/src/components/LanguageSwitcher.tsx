import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith('he') ? 'he' : 'en';

  const setLanguage = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {(['en', 'he'] as SupportedLanguage[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
            current === lang
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t(`language.${lang}`)}
        </button>
      ))}
    </div>
  );
}
