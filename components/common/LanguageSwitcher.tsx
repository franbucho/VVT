
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../localization';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: Language[] = ['en', 'es'];

  return (
    <div className="flex space-x-1">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
            ${language === lang 
              ? 'bg-accent text-white cursor-default' 
              : 'bg-gray-200 text-primary hover:bg-primary/10'
            }`}
          aria-pressed={language === lang}
          disabled={language === lang}
          lang={lang} // For assistive technologies to identify button language
        >
          {t(lang === 'en' ? 'language_switcher_en' : 'language_switcher_es')}
        </button>
      ))}
    </div>
  );
};