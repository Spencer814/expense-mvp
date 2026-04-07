import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type Language, languageOptions, useLanguage } from '../contexts/LanguageContext';
import { type Currency, currencyOptions, useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SettingsBar component displays language, currency, and theme selectors
 * Positioned in the header for quick access to i18n and display settings
 * Uses custom dropdown for language to display flags inline with text
 */
export function SettingsBar(): React.JSX.Element {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { toggleTheme, isDark } = useTheme();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Memoize theme-aware styles
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleLanguageSelect = (lang: Language): void => {
    setLanguage(lang);
    setIsLangOpen(false);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setCurrency(e.target.value as Currency);
  };

  return (
    <div style={styles.container}>
      {/* Language Selector - Custom Dropdown with Flags */}
      <div style={styles.selectorGroup}>
        <span style={styles.label}>
          {t('settings.language')}:
        </span>
        <div ref={langDropdownRef} style={styles.customDropdown}>
          <button
            type="button"
            onClick={() => { setIsLangOpen(!isLangOpen); }}
            style={styles.dropdownButton}
            aria-haspopup="listbox"
            aria-expanded={isLangOpen}
          >
            <img
              src={languageOptions[language].flagSrc}
              alt=""
              style={styles.flagImage}
            />
            <span>{languageOptions[language].name}</span>
            <span style={styles.dropdownArrow}>▼</span>
          </button>
          {isLangOpen && (
            <ul style={styles.dropdownMenu} role="listbox">
              {(Object.keys(languageOptions) as Language[]).map((lang) => (
                <li
                  key={lang}
                  role="option"
                  aria-selected={language === lang}
                  style={{
                    ...styles.dropdownItem,
                    ...(language === lang ? styles.dropdownItemSelected : {}),
                  }}
                  onClick={() => { handleLanguageSelect(lang); }}
                >
                  <img
                    src={languageOptions[lang].flagSrc}
                    alt=""
                    style={styles.flagImage}
                  />
                  <span>{languageOptions[lang].name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Currency Selector */}
      <div style={styles.selectorGroup}>
        <label htmlFor="currency-select" style={styles.label}>
          {t('settings.currency')}:
        </label>
        <select
          id="currency-select"
          value={currency}
          onChange={handleCurrencyChange}
          style={styles.select}
          aria-label={t('settings.currency')}
        >
          {(Object.keys(currencyOptions) as Currency[]).map((curr) => (
            <option key={curr} value={curr}>
              {currencyOptions[curr].symbol} {curr}
            </option>
          ))}
        </select>
      </div>

      {/* Theme Toggle */}
      <div style={styles.selectorGroup}>
        <span style={styles.label}>
          {t('settings.theme')}:
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          style={styles.themeButton}
          aria-label={isDark ? t('settings.lightMode') : t('settings.darkMode')}
          title={isDark ? t('settings.lightMode') : t('settings.darkMode')}
        >
          <span style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? t('settings.lightMode') : t('settings.darkMode')}</span>
        </button>
      </div>
    </div>
  );
}

// Theme-aware colors
const lightColors = {
  containerBg: '#f8f9fa',
  containerBorder: '#e9ecef',
  label: '#6c757d',
  inputBg: '#fff',
  inputBorder: '#ced4da',
  inputText: '#1f2937',
  flagBorder: '#dee2e6',
  dropdownShadow: '0 2px 8px rgba(0,0,0,0.15)',
  selectedBg: '#e9ecef',
};

const darkColors = {
  containerBg: '#1f2937',
  containerBorder: '#374151',
  label: '#9ca3af',
  inputBg: '#374151',
  inputBorder: '#4b5563',
  inputText: '#f9fafb',
  flagBorder: '#4b5563',
  dropdownShadow: '0 2px 8px rgba(0,0,0,0.4)',
  selectedBg: '#4b5563',
};

// Function to get theme-aware styles
const getStyles = (isDark: boolean): Record<string, React.CSSProperties> => {
  const colors = isDark ? darkColors : lightColors;

  return {
    container: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      padding: '8px 16px',
      backgroundColor: colors.containerBg,
      borderBottom: `1px solid ${colors.containerBorder}`,
      fontSize: '14px',
      transition: 'background-color 0.2s, border-color 0.2s',
    },
    selectorGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    label: {
      color: colors.label,
      fontWeight: 500,
    },
    select: {
      padding: '4px 8px',
      border: `1px solid ${colors.inputBorder}`,
      borderRadius: '4px',
      backgroundColor: colors.inputBg,
      color: colors.inputText,
      fontSize: '14px',
      cursor: 'pointer',
    },
    customDropdown: {
      position: 'relative' as const,
    },
    dropdownButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      border: `1px solid ${colors.inputBorder}`,
      borderRadius: '4px',
      backgroundColor: colors.inputBg,
      color: colors.inputText,
      fontSize: '14px',
      cursor: 'pointer',
      minWidth: '120px',
    },
    dropdownArrow: {
      marginLeft: 'auto',
      fontSize: '10px',
      color: colors.label,
    },
    dropdownMenu: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      margin: 0,
      padding: 0,
      listStyle: 'none',
      backgroundColor: colors.inputBg,
      border: `1px solid ${colors.inputBorder}`,
      borderRadius: '4px',
      boxShadow: colors.dropdownShadow,
      zIndex: 1000,
      marginTop: '2px',
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 8px',
      cursor: 'pointer',
      color: colors.inputText,
    },
    dropdownItemSelected: {
      backgroundColor: colors.selectedBg,
    },
    flagImage: {
      width: '20px',
      height: '14px',
      objectFit: 'cover' as const,
      borderRadius: '2px',
      border: `1px solid ${colors.flagBorder}`,
    },
    themeButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      border: `1px solid ${colors.inputBorder}`,
      borderRadius: '4px',
      backgroundColor: colors.inputBg,
      color: colors.inputText,
      fontSize: '14px',
      cursor: 'pointer',
    },
    themeIcon: {
      fontSize: '16px',
    },
  };
};

export default SettingsBar;
