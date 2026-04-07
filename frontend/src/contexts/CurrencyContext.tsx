import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Supported currencies
export type Currency = 'EUR' | 'USD' | 'GBP';

// Exchange rates (EUR as base currency)
// Note: In production, these would come from an API
const EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1.0,      // Base currency
  USD: 1.08,     // 1 EUR = 1.08 USD
  GBP: 0.86,     // 1 EUR = 0.86 GBP
};

// Currency symbols
export const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

// Currency display options
export const currencyOptions: Record<Currency, { symbol: string; name: string }> = {
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
};

// localStorage key for persistence
const STORAGE_KEY = 'expense_mvp_currency';

// Default currency (Euro for Barcelona)
const DEFAULT_CURRENCY: Currency = 'EUR';

// Context type
interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  convert: (amount: number, fromCurrency?: Currency) => number;
  formatAmount: (amount: number | string, fromCurrency?: Currency) => string;
}

// Create context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Provider props
interface CurrencyProviderProps {
  children: ReactNode;
}

// Provider component
export function CurrencyProvider({ children }: CurrencyProviderProps): React.JSX.Element {
  // Initialize from localStorage or default
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'EUR' || stored === 'USD' || stored === 'GBP')) {
        return stored as Currency;
      }
    }
    return DEFAULT_CURRENCY;
  });

  // Update localStorage when currency changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  // Set currency function
  const setCurrency = useCallback((curr: Currency) => {
    setCurrencyState(curr);
  }, []);

  // Get current symbol
  const symbol = currencySymbols[currency];

  // Convert amount from one currency to another
  const convert = useCallback((amount: number, fromCurrency: Currency = 'EUR'): number => {
    // Convert to EUR first (base currency)
    const inEur = amount / EXCHANGE_RATES[fromCurrency];
    // Then convert to target currency
    return inEur * EXCHANGE_RATES[currency];
  }, [currency]);

  // Format amount with conversion and symbol
  const formatAmount = useCallback((amount: number | string, fromCurrency: Currency = 'EUR'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {return `${symbol}0.00`;}

    const converted = convert(numAmount, fromCurrency);

    // Format based on currency locale conventions
    const formatted = converted.toFixed(2);

    // Position symbol based on currency convention
    switch (currency) {
      case 'EUR':
        return `${formatted.replace('.', ',')} €`;
      case 'GBP':
        return `£${formatted}`;
      case 'USD':
      default:
        return `$${formatted}`;
    }
  }, [currency, symbol, convert]);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    symbol,
    convert,
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to use currency context
export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export default CurrencyContext;
