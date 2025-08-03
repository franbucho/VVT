import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../localization';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languageOptions: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
  ];

  return (
    <div className="flex space-x-1">
      {languageOptions.map((langOption) => (
        <button
          key={langOption.code}
          onClick={() => setLanguage(langOption.code)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
            ${language === langOption.code 
              ? 'bg-accent text-white cursor-default dark:bg-dark-accent dark:text-primary-dark' 
              : 'bg-gray-200 text-primary hover:bg-primary/10 dark:bg-dark-border/50 dark:text-dark-text-primary dark:hover:bg-dark-border'
            }`}
          aria-pressed={language === langOption.code}
          disabled={language === langOption.code}
          lang={langOption.code} // For assistive technologies to identify button language
        >
          {langOption.name}
        </button>
      ))}
    </div>
  );
};
