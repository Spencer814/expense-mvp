import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFormatters } from '../hooks/useFormatters';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Aggregate statistics for expense dashboard
 *
 * @interface DashboardStats
 * @property {number} submitted_count - Number of expenses pending approval
 * @property {number} approved_count - Number of approved expenses
 * @property {number} paid_count - Number of paid expenses
 * @property {string} pending_amount - Total monetary value of pending expenses
 */
interface DashboardStats {
  readonly submitted_count: number;
  readonly approved_count: number;
  readonly paid_count: number;
  readonly pending_amount: string;
}

/**
 * Expense total grouped by category
 *
 * @interface CategoryTotal
 * @property {string} category - Category name (e.g., "travel", "meals")
 * @property {string} total - Total amount for this category as string
 */
interface CategoryTotal {
  readonly category: string;
  readonly total: string;
}

/**
 * Complete dashboard data structure from API
 *
 * @interface DashboardData
 * @property {DashboardStats} stats - Aggregate statistics
 * @property {CategoryTotal[]} category_totals - Breakdown by expense category
 */
interface DashboardData {
  readonly stats: DashboardStats;
  readonly category_totals: readonly CategoryTotal[];
}

/**
 * Dashboard Component
 *
 * Displays a summary view of expense statistics and category breakdowns.
 * Features include:
 * - Summary cards showing submitted, approved, paid counts and pending amount
 * - Category breakdown table with totals
 * - Color-coded cards for visual distinction
 * - Grand total calculation across all categories
 * - Full i18n support with locale-aware formatting
 *
 * @component
 * @example
 * ```tsx
 * <Dashboard />
 * ```
 *
 * @returns {JSX.Element} Dashboard with statistics cards and category table
 */
const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { formatAmount } = useFormatters();
  const { isDark } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize theme-aware styles
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  useEffect(() => {
    const fetchDashboard = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard');

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const dashboardData = await response.json() as DashboardData;
        setData(dashboardData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error ?? !data) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{t('common.error')}: {error ?? 'Failed to load dashboard'}</p>
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

  const cards = [
    {
      title: t('dashboard.submitted'),
      value: data.stats.submitted_count,
      color: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      title: t('dashboard.approved'),
      value: data.stats.approved_count,
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
    {
      title: t('dashboard.paid'),
      value: data.stats.paid_count,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      title: t('dashboard.pendingAmount'),
      value: formatAmount(data.stats.pending_amount),
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{t('dashboard.title')}</h1>

      <div style={styles.cardsGrid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              ...styles.card,
              backgroundColor: card.bgColor,
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={{ ...styles.cardValue, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.categorySection}>
        <h2 style={styles.sectionTitle}>{t('dashboard.categoryTotals')}</h2>

        {data.category_totals.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>{t('dashboard.noData')}</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>{t('dashboard.category')}</th>
                  <th style={styles.tableHeader}>{t('dashboard.totalAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.category_totals.map((categoryTotal) => (
                  <tr key={categoryTotal.category} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      {t(`categories.${categoryTotal.category}`) || categoryTotal.category}
                    </td>
                    <td style={styles.tableCellAmount}>
                      {formatAmount(categoryTotal.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={styles.tableTotalRow}>
                  <td style={styles.tableTotalCell}>{t('dashboard.total')}</td>
                  <td style={styles.tableTotalCellAmount}>
                    {formatAmount(
                      data.category_totals
                        .reduce(
                          (sum, cat) => sum + parseFloat(cat.total),
                          0
                        )
                        .toString()
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
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
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: '2rem',
      marginTop: 0,
      transition: 'color 0.2s',
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
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem',
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: colors.textLight,
      textTransform: 'uppercase',
      margin: '0 0 0.5rem 0',
      letterSpacing: '0.05em',
    },
    cardValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: 0,
    },
    categorySection: {
      backgroundColor: colors.surface,
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      transition: 'background-color 0.2s',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: '1.5rem',
      marginTop: 0,
    },
    emptyState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
    emptyText: {
      color: colors.textLight,
      fontSize: '1rem',
    },
    tableContainer: {
      overflow: 'hidden',
      borderRadius: '0.5rem',
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeaderRow: {
      backgroundColor: colors.surfaceAlt,
      borderBottom: `2px solid ${colors.border}`,
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
      fontSize: '1rem',
      color: colors.text,
    },
    tableCellAmount: {
      padding: '1rem',
      fontSize: '1rem',
      color: colors.text,
      textAlign: 'right',
      fontWeight: '500',
    },
    tableTotalRow: {
      backgroundColor: colors.surfaceAlt,
      borderTop: `2px solid ${colors.border}`,
    },
    tableTotalCell: {
      padding: '1rem',
      fontSize: '1rem',
      fontWeight: '700',
      color: colors.text,
    },
    tableTotalCellAmount: {
      padding: '1rem',
      fontSize: '1rem',
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
  };
};

export default Dashboard;
