import { en } from './en';
import { es } from './es';

export const translations = {
  en,
  es,
};

export type Language = keyof typeof translations;

export const DEFAULT_LANGUAGE: Language = 'en';

export const getTranslator = (lang: Language) => { // Changed: Correctly define lang as parameter
  const selectedTranslations = translations[lang] || translations[DEFAULT_LANGUAGE];
  
  return (key: keyof typeof en, replacements?: Record<string, string | number>): string => {
    let translation = selectedTranslations[key] || translations[DEFAULT_LANGUAGE][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      });
    }
    return translation as string; // Cast because TS can't infer it correctly with dynamic keys from default
  };
};