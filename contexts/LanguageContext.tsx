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
  try {
    // 1. Check for a language preference stored by the user.
    const storedLang = localStorage.getItem('niria-lang') as Language;
    if (storedLang && translations[storedLang]) {
      return storedLang;
    }

    // 2. If no preference, check the browser's language setting.
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().startsWith('es')) {
        return 'es';
      }
    }
  } catch (e) {
    console.error("Could not access browser storage for language detection:", e);
  }
  
  // 3. Fallback to the default language.
  return DEFAULT_LANGUAGE;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());
  
  // Removed useCallback to ensure the function reference is always fresh,
  // preventing stale state issues in consumers.
  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem('niria-lang', lang);
      } catch (e) {
        console.error("Could not save language to localStorage:", e);
      }
    }
  };

  const t = useCallback(getTranslator(language), [language]);

  useEffect(() => {
    // Optional: listen to storage changes from other tabs, though less common for language.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'niria-lang' && event.newValue && translations[event.newValue as Language]) {
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