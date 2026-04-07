import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Supported themes
export type Theme = 'light' | 'dark';

// Theme display options
export const themeOptions: Record<Theme, { name: string; icon: string }> = {
  light: { name: 'Light', icon: '☀️' },
  dark: { name: 'Dark', icon: '🌙' },
};

// localStorage key for persistence
const STORAGE_KEY = 'expense_mvp_theme';

// Default theme
const DEFAULT_THEME: Theme = 'light';

// Context type
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider component
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  // Initialize from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return DEFAULT_THEME;
  });

  // Update localStorage and document attribute when theme changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Set theme function
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
