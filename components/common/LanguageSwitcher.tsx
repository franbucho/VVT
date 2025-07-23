import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../localization';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ['en', 'es'];

  return (
    <div className="flex space-x-1">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
            ${language === lang 
              ? 'bg-accent text-white cursor-default dark:bg-dark-accent dark:text-primary-dark' 
              : 'bg-gray-200 text-primary hover:bg-primary/10 dark:bg-dark-border/50 dark:text-dark-text-primary dark:hover:bg-dark-border'
            }`}
          aria-pressed={language === lang}
          disabled={language === lang}
          lang={lang} // For assistive technologies to identify button language
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
