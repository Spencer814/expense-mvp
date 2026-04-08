import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFormatters } from '../hooks/useFormatters';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL } from '../services/api';

/**
 * Represents an expense record from the API
 *
 * @interface Expense
 * @property {number} id - Unique identifier for the expense
 * @property {string} title - Short description/title of the expense
 * @property {string} vendor_name - Name of the vendor or merchant
 * @property {string} amount - Monetary amount as a string (for precision)
 * @property {string} expense_date - Date the expense occurred (ISO format)
 * @property {'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'} status - Current workflow status
 */
interface Expense {
  readonly id: number;
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: string;
  readonly expense_date: string;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
}

/**
 * Color mapping for expense status badges
 * Maps each status to a Tailwind-compatible hex color
 */
const statusColors: Record<Expense['status'], string> = {
  draft: '#6b7280',
  submitted: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
  paid: '#8b5cf6',
};

/**
 * ExpenseList Component
 *
 * Displays a paginated table of all expenses in the system.
 * Features include:
 * - Fetches expenses from the API on mount
 * - Shows loading spinner during data fetch
 * - Displays error messages with retry option
 * - Links each expense title to its detail view
 * - Color-coded status badges for quick visual reference
 * - Full i18n support with locale-aware formatting
 *
 * @component
 * @example
 * ```tsx
 * <ExpenseList />
 * ```
 *
 * @returns {JSX.Element} A table of expenses or appropriate loading/error state
 */
const ExpenseList: React.FC = () => {
  const { t } = useLanguage();
  const { formatDate, formatAmount, translateText } = useFormatters();
  const { isDark } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize theme-aware styles
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  useEffect(() => {
    const fetchExpenses = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/expenses`);

        if (!response.ok) {
          throw new Error(`Failed to fetch expenses: ${response.statusText}`);
        }

        const data = await response.json() as Expense[];
        setExpenses(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching expenses:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchExpenses();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>{t('expenses.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{t('common.error')}: {error}</p>
          <button
            style={styles.retryButton}
            onClick={() => { window.location.reload(); }}
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('expenses.title')}</h1>
        <Link to="/new" style={styles.newButton}>
          {t('nav.newExpense')}
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>{t('expenses.empty')}</p>
          <Link to="/new" style={styles.newButton}>
            {t('expenses.createFirst')}
          </Link>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>{t('expenses.table.title')}</th>
                <th style={styles.tableHeader}>{t('expenses.table.vendor')}</th>
                <th style={styles.tableHeader}>{t('expenses.table.amount')}</th>
                <th style={styles.tableHeader}>{t('expenses.table.date')}</th>
                <th style={styles.tableHeader}>{t('expenses.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <Link
                      to={`/expenses/${expense.id}`}
                      style={styles.expenseLink}
                    >
                      {translateText(expense.title)}
                    </Link>
                  </td>
                  <td style={styles.tableCell}>{expense.vendor_name}</td>
                  <td style={styles.tableCell}>{formatAmount(expense.amount)}</td>
                  <td style={styles.tableCell}>{formatDate(expense.expense_date)}</td>
                  <td style={styles.tableCell}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusColors[expense.status],
                      }}
                    >
                      {t(`status.${expense.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Theme-aware colors
const lightColors = {
  text: '#1f2937',
  textLight: '#6b7280',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  border: '#e5e7eb',
  primary: '#3b82f6',
  error: '#ef4444',
};

const darkColors = {
  text: '#f9fafb',
  textLight: '#9ca3af',
  surface: '#1f2937',
  surfaceAlt: '#374151',
  border: '#374151',
  primary: '#60a5fa',
  error: '#f87171',
};

// Function to get theme-aware styles
const getStyles = (isDark: boolean): Record<string, React.CSSProperties> => {
  const colors = isDark ? darkColors : lightColors;

  return {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: colors.text,
      margin: 0,
      transition: 'color 0.2s',
    },
    newButton: {
      backgroundColor: colors.primary,
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      textDecoration: 'none',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: `4px solid ${colors.border}`,
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    loadingText: {
      marginTop: '1rem',
      color: colors.textLight,
      fontSize: '1rem',
    },
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    },
    errorText: {
      color: colors.error,
      fontSize: '1rem',
      marginBottom: '1rem',
    },
    retryButton: {
      backgroundColor: colors.primary,
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    },
    emptyText: {
      color: colors.textLight,
      fontSize: '1.125rem',
      marginBottom: '1rem',
    },
    tableContainer: {
      backgroundColor: colors.surface,
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'background-color 0.2s',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeaderRow: {
      backgroundColor: colors.surfaceAlt,
      borderBottom: `1px solid ${colors.border}`,
    },
    tableHeader: {
      padding: '0.75rem 1rem',
      textAlign: 'left',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: colors.textLight,
      textTransform: 'uppercase',
    },
    tableRow: {
      borderBottom: `1px solid ${colors.border}`,
    },
    tableCell: {
      padding: '1rem',
      fontSize: '0.875rem',
      color: colors.text,
    },
    expenseLink: {
      color: colors.primary,
      textDecoration: 'none',
      fontWeight: '500',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'white',
      textTransform: 'capitalize',
    },
  };
};

export default ExpenseList;
