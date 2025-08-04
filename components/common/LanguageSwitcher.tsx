import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../localization';
import { TranslationKeys } from '../../localization/en';

interface LanguageSwitcherProps {
  variant?: 'header' | 'panel';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { language, setLanguage, t } = useLanguage();

  const languageOptions: { code: Language; key: keyof TranslationKeys }[] = [
    { code: 'en', key: 'language_switcher_en' },
    { code: 'es', key: 'language_switcher_es' },
    { code: 'zh', key: 'language_switcher_zh' },
  ];
  
  const baseClasses = "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors";

  // Classes for the main header (light background in light mode)
  const headerActiveClasses = 'bg-accent text-white cursor-default dark:bg-dark-accent dark:text-primary-dark';
  const headerInactiveClasses = 'bg-gray-200 text-primary hover:bg-primary/10 dark:bg-dark-border/50 dark:text-dark-text-primary dark:hover:bg-dark-border';
  
  // Classes for the side panel (always a dark background)
  const panelActiveClasses = 'bg-accent text-white cursor-default';
  const panelInactiveClasses = 'bg-white/10 text-white hover:bg-white/20';

  const getButtonClasses = (code: Language) => {
    const isActive = language === code;
    if (variant === 'panel') {
      return isActive ? panelActiveClasses : panelInactiveClasses;
    }
    // Default to header styles
    return isActive ? headerActiveClasses : headerInactiveClasses;
  };

  return (
    <div className="flex space-x-1">
      {languageOptions.map((langOption) => (
        <button
          key={langOption.code}
          onClick={() => setLanguage(langOption.code)}
          className={`${baseClasses} ${getButtonClasses(langOption.code)}`}
          aria-pressed={language === langOption.code}
          disabled={language === langOption.code}
          lang={langOption.code}
        >
          {t(langOption.key)}
        </button>
      ))}
    </div>
  );
};