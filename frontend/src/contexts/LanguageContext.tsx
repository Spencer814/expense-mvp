import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Import translation files
import en from '../locales/en.json';
import es from '../locales/es.json';
import ca from '../locales/ca.json';

// Supported languages
export type Language = 'en' | 'es' | 'ca';

// Translation dictionary type
type TranslationDict = typeof en;

// All translations mapped by language
const translations: Record<Language, TranslationDict> = {
  en,
  es,
  ca,
};

// Language display names and flag image paths (served from public folder)
export const languageOptions: Record<Language, { name: string; flagSrc: string }> = {
  en: { name: 'English', flagSrc: '/flags/en.png' },
  es: { name: 'Español', flagSrc: '/flags/es.png' },
  ca: { name: 'Català', flagSrc: '/flags/ca.png' },
};

// localStorage key for persistence
const STORAGE_KEY = 'expense_mvp_language';

// Default language (Catalan for Barcelona)
const DEFAULT_LANGUAGE: Language = 'ca';

// Context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get nested value from object using dot notation
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path; // Return key if path not found
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : path;
}

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component
export function LanguageProvider({ children }: LanguageProviderProps): React.JSX.Element {
  // Initialize from localStorage or default
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'es' || stored === 'ca')) {
        return stored as Language;
      }
    }
    return DEFAULT_LANGUAGE;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  // Set language function
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  // Translation function
  const t = useCallback((key: string): string => getNestedValue(translations[language], key), [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
