import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, DEFAULT_LANGUAGE, Language, getTranslator } from '../localization';
import { TranslationKeys } from '../localization/en';

type TranslateFunction = (key: keyof TranslationKeys, replacements?: Record<string, string | number>) => string;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFunction;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const getInitialLanguage = (): Language => {
  const storedLang = localStorage.getItem('virtualvisiontest-lang') as Language;
  return translations[storedLang] ? storedLang : DEFAULT_LANGUAGE;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());
  
  const setLanguage = useCallback((lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('virtualvisiontest-lang', lang);
    }
  }, []);

  const t = useCallback(getTranslator(language), [language]);

  useEffect(() => {
    // Optional: listen to storage changes from other tabs, though less common for language.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'virtualvisiontest-lang' && event.newValue && translations[event.newValue as Language]) {
        setLanguageState(event.newValue as Language);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};