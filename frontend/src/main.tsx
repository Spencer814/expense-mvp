import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

/**
 * Main entry point for the Expense Approval MVP application
 *
 * Initializes React root and renders the App component with providers.
 * Provider hierarchy:
 * - ThemeProvider: Manages light/dark theme state
 * - LanguageProvider: Manages language state and translations
 * - CurrencyProvider: Manages currency state and conversion
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Please ensure index.html contains a div with id="root".');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
