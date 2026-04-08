import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFormatters } from '../hooks/useFormatters';
import { API_BASE_URL } from '../services/api';

/**
 * User interface for role-based access control
 *
 * @interface User
 * @property {number} id - Unique user identifier
 * @property {string} username - Display name for the user
 * @property {'employee' | 'manager' | 'finance'} role - User's role determining available actions
 */
interface User {
  readonly id: number;
  readonly username: string;
  readonly role: 'employee' | 'manager' | 'finance';
}

/**
 * Represents a single entry in the expense approval history
 *
 * @interface ApprovalHistory
 * @property {number} id - Unique history entry identifier
 * @property {string} action - The action taken (e.g., "approved", "rejected")
 * @property {string | null} comment - Optional comment provided with the action
 * @property {string} created_at - ISO timestamp of when the action occurred
 * @property {number} user_id - ID of the user who took the action
 */
interface ApprovalHistory {
  readonly id: number;
  readonly action: string;
  readonly comment: string | null;
  readonly created_at: string;
  readonly user_id: number;
}

/**
 * Complete expense record with all details and history
 *
 * @interface Expense
 * @property {number} id - Unique expense identifier
 * @property {string} title - Short title/description
 * @property {string} vendor_name - Name of the vendor
 * @property {string} amount - Monetary amount as string
 * @property {string} expense_date - Date the expense occurred
 * @property {string} category - Expense category
 * @property {string} description - Detailed description
 * @property {string} receipt_url - URL to receipt image
 * @property {'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'} status - Current status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {ApprovalHistory[]} [approval_history] - Optional array of approval actions
 */
interface Expense {
  readonly id: number;
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: string;
  readonly expense_date: string;
  readonly category: string;
  readonly description: string;
  readonly receipt_url: string;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  readonly created_at: string;
  readonly updated_at: string;
  readonly approval_history?: readonly ApprovalHistory[];
}

/**
 * Props for the ExpenseDetail component
 *
 * @interface ExpenseDetailProps
 * @property {User} currentUser - The currently authenticated user
 */
interface ExpenseDetailProps {
  readonly currentUser: User;
}

/**
 * Color mapping for expense status badges
 */
const statusColors: Record<Expense['status'], string> = {
  draft: '#6b7280',
  submitted: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
  paid: '#8b5cf6',
};

/**
 * ExpenseDetail Component
 *
 * Displays complete details of a single expense with role-based actions.
 * Features include:
 * - Full expense details with approval history timeline
 * - Role-based action buttons (Submit, Approve/Reject, Mark Paid)
 * - Comment field for approval/rejection feedback
 * - Receipt link for viewing uploaded documents
 * - Full i18n support with locale-aware formatting
 *
 * Role permissions:
 * - **Employee**: Can submit draft expenses
 * - **Manager**: Can approve or reject submitted expenses
 * - **Finance**: Can mark approved expenses as paid
 *
 * @component
 * @example
 * ```tsx
 * <ExpenseDetail currentUser={{ id: 1, username: "john", role: "manager" }} />
 * ```
 *
 * @param {ExpenseDetailProps} props - Component props
 * @param {User} props.currentUser - Currently authenticated user for role-based actions
 * @returns {JSX.Element} Detailed expense view with actions
 */
const ExpenseDetail: React.FC<ExpenseDetailProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatDate, formatDateTime, formatAmount, translateText } = useFormatters();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    const fetchExpense = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/expenses/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch expense: ${response.statusText}`);
        }

        const data = await response.json() as Expense;
        setExpense(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching expense:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchExpense();
    }
  }, [id]);

  /**
   * Submits a draft expense for approval
   * Changes status from 'draft' to 'submitted'
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleSubmit = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}/submit`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to submit expense: ${response.statusText}`);
      }

      const updatedExpense = await response.json() as Expense;
      setExpense(updatedExpense);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit expense';
      setError(errorMessage);
      console.error('Error submitting expense:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Approves a submitted expense
   * Changes status to 'approved' with optional comment
   * Only available to users with manager role
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleApprove = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: comment.trim() || null }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve expense: ${response.statusText}`);
      }

      const updatedExpense = await response.json() as Expense;
      setExpense(updatedExpense);
      setComment('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve expense';
      setError(errorMessage);
      console.error('Error approving expense:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Rejects a submitted expense
   * Requires a comment explaining the rejection reason
   * Changes status to 'rejected'
   * Only available to users with manager role
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleReject = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    if (!comment.trim()) {
      setError('Please provide a comment when rejecting an expense');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: comment.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject expense: ${response.statusText}`);
      }

      const updatedExpense = await response.json() as Expense;
      setExpense(updatedExpense);
      setComment('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject expense';
      setError(errorMessage);
      console.error('Error rejecting expense:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Marks an approved expense as paid
   * Changes status from 'approved' to 'paid'
   * Only available to users with finance role
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleMarkAsPaid = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}/mark-paid`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to mark expense as paid: ${response.statusText}`);
      }

      const updatedExpense = await response.json() as Expense;
      setExpense(updatedExpense);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark expense as paid';
      setError(errorMessage);
      console.error('Error marking expense as paid:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const canSubmit = expense?.status === 'draft' && currentUser.role === 'employee';
  const canApproveReject = expense?.status === 'submitted' && currentUser.role === 'manager';
  const canMarkPaid = expense?.status === 'approved' && currentUser.role === 'finance';

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !expense) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{t('common.error')}: {error}</p>
          <button style={styles.backButton} onClick={() => { navigate('/'); }}>
            {t('detail.backToList')}
          </button>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{t('detail.notFound')}</p>
          <button style={styles.backButton} onClick={() => { navigate('/'); }}>
            {t('detail.backToList')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => { navigate('/'); }}>
        ← {t('detail.backToList')}
      </button>

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{translateText(expense.title)}</h1>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: statusColors[expense.status],
            }}
          >
            {t(`status.${expense.status}`)}
          </span>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <p style={styles.errorBannerText}>{error}</p>
            <button
              style={styles.dismissButton}
              onClick={() => { setError(null); }}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.vendor')}:</span>
            <span style={styles.detailValue}>{expense.vendor_name}</span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.amount')}:</span>
            <span style={styles.detailValue}>{formatAmount(expense.amount)}</span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.date')}:</span>
            <span style={styles.detailValue}>{formatDate(expense.expense_date)}</span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.category')}:</span>
            <span style={styles.detailValue}>{t(`categories.${expense.category}`) || expense.category}</span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.created')}:</span>
            <span style={styles.detailValue}>{formatDateTime(expense.created_at)}</span>
          </div>

          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('detail.updated')}:</span>
            <span style={styles.detailValue}>{formatDateTime(expense.updated_at)}</span>
          </div>

          {expense.description && (
            <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
              <span style={styles.detailLabel}>{t('detail.description')}:</span>
              <p style={styles.description}>{translateText(expense.description)}</p>
            </div>
          )}

          {expense.receipt_url && (
            <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
              <span style={styles.detailLabel}>{t('detail.receipt')}:</span>
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                {t('detail.viewReceipt')}
              </a>
            </div>
          )}
        </div>

        {expense.approval_history && expense.approval_history.length > 0 && (
          <div style={styles.historySection}>
            <h2 style={styles.sectionTitle}>{t('detail.approvalHistory')}</h2>
            <div style={styles.historyList}>
              {expense.approval_history.map((history) => (
                <div key={history.id} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <span style={styles.historyAction}>{history.action}</span>
                    <span style={styles.historyDate}>
                      {formatDateTime(history.created_at)}
                    </span>
                  </div>
                  {history.comment && (
                    <p style={styles.historyComment}>{translateText(history.comment)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(canSubmit || canApproveReject || canMarkPaid) && (
          <div style={styles.actionsSection}>
            <h2 style={styles.sectionTitle}>{t('detail.actions')}</h2>

            {canSubmit && (
              <div style={styles.actionsButtons}>
                <button
                  onClick={() => { void handleSubmit(); }}
                  disabled={actionLoading}
                  style={{
                    ...styles.submitButton,
                    ...(actionLoading ? styles.disabledButton : {}),
                  }}
                >
                  {actionLoading ? t('detail.submitting') : t('detail.submitForApproval')}
                </button>
              </div>
            )}

            {canApproveReject && (
              <div style={styles.approvalSection}>
                <div style={styles.formGroup}>
                  <label htmlFor="comment" style={styles.label}>
                    {t('detail.commentLabel')}
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); }}
                    rows={3}
                    style={styles.textarea}
                    placeholder={t('detail.commentPlaceholder')}
                    disabled={actionLoading}
                  />
                </div>
                <div style={styles.actionsButtons}>
                  <button
                    onClick={() => { void handleReject(); }}
                    disabled={actionLoading}
                    style={{
                      ...styles.rejectButton,
                      ...(actionLoading ? styles.disabledButton : {}),
                    }}
                  >
                    {actionLoading ? t('detail.rejecting') : t('detail.reject')}
                  </button>
                  <button
                    onClick={() => { void handleApprove(); }}
                    disabled={actionLoading}
                    style={{
                      ...styles.approveButton,
                      ...(actionLoading ? styles.disabledButton : {}),
                    }}
                  >
                    {actionLoading ? t('detail.approving') : t('detail.approve')}
                  </button>
                </div>
              </div>
            )}

            {canMarkPaid && (
              <div style={styles.actionsButtons}>
                <button
                  onClick={() => { void handleMarkAsPaid(); }}
                  disabled={actionLoading}
                  style={{
                    ...styles.paidButton,
                    ...(actionLoading ? styles.disabledButton : {}),
                  }}
                >
                  {actionLoading ? t('detail.processing') : t('detail.markAsPaid')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    marginTop: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
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
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#6b7280',
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
    color: '#ef4444',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    border: '1px solid #ef4444',
    borderRadius: '0.375rem',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#991b1b',
    margin: 0,
    fontSize: '0.875rem',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: '#991b1b',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  backButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  detailLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '1rem',
    color: '#1f2937',
  },
  description: {
    fontSize: '1rem',
    color: '#1f2937',
    margin: '0.5rem 0 0 0',
    lineHeight: '1.5',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '1rem',
  },
  historySection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1rem',
    marginTop: 0,
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  historyItem: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  historyAction: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  historyComment: {
    fontSize: '0.875rem',
    color: '#4b5563',
    margin: 0,
    fontStyle: 'italic',
  },
  actionsSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e5e7eb',
  },
  approvalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  textarea: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  actionsButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  approveButton: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  paidButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default ExpenseDetail;
