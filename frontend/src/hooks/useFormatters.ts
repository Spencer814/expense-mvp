import { useCallback, useMemo } from 'react';
import { type Language, useLanguage } from '../contexts/LanguageContext';
import { type Currency, useCurrency } from '../contexts/CurrencyContext';

// Locale mapping for Intl API
const localeMap: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  ca: 'ca-ES',
};

// Prefixes that indicate a string is a translation key
const TRANSLATION_KEY_PREFIXES = ['samples.', 'approvalComments.'];

// Return type for the hook
interface Formatters {
  formatDate: (dateString: string | Date) => string;
  formatDateTime: (dateString: string | Date) => string;
  formatAmount: (amount: number | string, fromCurrency?: Currency) => string;
  formatNumber: (num: number) => string;
  translateText: (text: string) => string;
  locale: string;
}

/**
 * Custom hook that provides locale-aware formatting functions
 * Combines language and currency settings for consistent formatting
 */
export function useFormatters(): Formatters {
  const { language, t } = useLanguage();
  const { formatAmount: currencyFormatAmount } = useCurrency();

  // Get the locale string for the current language
  const locale = useMemo(() => localeMap[language], [language]);

  // Format a date string to locale-specific date format
  const formatDate = useCallback((dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {return String(dateString);}

      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateString);
    }
  }, [locale]);

  // Format a date string to locale-specific datetime format
  const formatDateTime = useCallback((dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {return String(dateString);}

      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  }, [locale]);

  // Format amount with currency conversion (wraps currency context's formatAmount)
  const formatAmount = useCallback((amount: number | string, fromCurrency: Currency = 'EUR'): string => currencyFormatAmount(amount, fromCurrency), [currencyFormatAmount]);

  // Format a plain number with locale-specific separators
  const formatNumber = useCallback((num: number): string => num.toLocaleString(locale), [locale]);

  // Translate text if it's a translation key, otherwise return as-is
  // This allows database values to be either translation keys or plain text
  const translateText = useCallback((text: string): string => {
    if (!text) {return text;}

    // Check if the text starts with a known translation key prefix
    const isTranslationKey = TRANSLATION_KEY_PREFIXES.some(prefix => text.startsWith(prefix));

    if (isTranslationKey) {
      const translated = t(text);
      // If translation returns the key itself, the key wasn't found - return original
      return translated === text ? text : translated;
    }

    return text;
  }, [t]);

  return {
    formatDate,
    formatDateTime,
    formatAmount,
    formatNumber,
    translateText,
    locale,
  };
}

export default useFormatters;
