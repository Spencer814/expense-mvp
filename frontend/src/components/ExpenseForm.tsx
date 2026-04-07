import React, { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

/**
 * Form data structure for creating/editing expenses
 *
 * @interface ExpenseFormData
 * @property {string} title - Short title for the expense
 * @property {string} vendor_name - Name of the vendor or merchant
 * @property {string} amount - Expense amount as string for form input
 * @property {string} expense_date - Date of the expense (YYYY-MM-DD format)
 * @property {string} category - Expense category (e.g., travel, meals)
 * @property {string} description - Optional detailed description
 * @property {string} receipt_url - URL to uploaded receipt image
 */
interface ExpenseFormData {
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: string;
  readonly expense_date: string;
  readonly category: string;
  readonly description: string;
  readonly receipt_url: string;
}

/**
 * Response structure from the OCR receipt parsing API
 *
 * @interface OcrResponse
 * @property {string} [title] - Extracted title from receipt
 * @property {string} [vendor_name] - Extracted vendor name
 * @property {string} [amount] - Extracted amount
 * @property {string} [expense_date] - Extracted date
 * @property {string} [category] - Inferred category
 */
interface OcrResponse {
  readonly title?: string;
  readonly vendor_name?: string;
  readonly amount?: string;
  readonly expense_date?: string;
  readonly category?: string;
}

/**
 * Category keys that map to translation strings
 * @constant
 */
const CATEGORY_KEYS = [
  'travel',
  'meals',
  'office',
  'software',
  'equipment',
  'other',
] as const;

/**
 * ExpenseForm Component
 *
 * A comprehensive form for creating new expense reports.
 * Features include:
 * - OCR integration for auto-filling from receipt images
 * - Draft saving before final submission
 * - Form validation with user feedback
 * - Category selection from predefined options
 * - Full i18n support with locale-aware labels
 *
 * @component
 * @example
 * ```tsx
 * <ExpenseForm />
 * ```
 *
 * @returns {JSX.Element} A form for creating expense reports
 */
const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { symbol } = useCurrency();
  const [draftId, setDraftId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    vendor_name: '',
    amount: '',
    expense_date: '',
    category: '',
    description: '',
    receipt_url: '',
  });

  /**
   * Handles changes to any form input field
   * Updates the corresponding field in formData state
   *
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - Change event
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Triggers OCR parsing of a receipt image
   * Sends the receipt URL to the backend OCR service and
   * populates form fields with extracted data
   *
   * @async
   * @returns {Promise<void>}
   */
  const parseReceipt = async (): Promise<void> => {
    if (!formData.receipt_url.trim()) {
      setError('Please enter a receipt URL before parsing');
      return;
    }

    try {
      setOcrLoading(true);
      setError(null);

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipt_url: formData.receipt_url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to parse receipt: ${response.statusText}`);
      }

      const ocrData = await response.json() as OcrResponse;

      // Populate form fields with OCR data
      setFormData((prev) => ({
        ...prev,
        title: ocrData.title ?? prev.title,
        vendor_name: ocrData.vendor_name ?? prev.vendor_name,
        amount: ocrData.amount ?? prev.amount,
        expense_date: ocrData.expense_date ?? prev.expense_date,
        category: ocrData.category ?? prev.category,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse receipt';
      setError(errorMessage);
      console.error('Error parsing receipt:', err);
    } finally {
      setOcrLoading(false);
    }
  };

  /**
   * Saves the current form data as a draft expense
   * Creates a new expense with draft status without submitting for approval
   *
   * @async
   * @returns {Promise<void>}
   */
  const saveDraft = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save draft: ${response.statusText}`);
      }

      const data = await response.json() as { id: number };
      setDraftId(data.id);
      alert(t('form.draftSaved'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      console.error('Error saving draft:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validates all required form fields before submission
   * Sets error message if validation fails
   *
   * @returns {boolean} True if all required fields are valid, false otherwise
   */
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.vendor_name.trim()) {
      setError('Vendor name is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid amount is required');
      return false;
    }
    if (!formData.expense_date) {
      setError('Expense date is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    return true;
  };

  /**
   * Handles form submission
   * Creates the expense if not already saved as draft, then submits for approval
   * Redirects to expense list on success
   *
   * @async
   * @param {FormEvent<HTMLFormElement>} e - Form submit event
   * @returns {Promise<void>}
   */
  const submitExpense = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let expenseId = draftId;

      // Create expense if not already saved as draft
      if (!expenseId) {
        const payload = {
          ...formData,
          amount: parseFloat(formData.amount),
        };

        const createResponse = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create expense: ${createResponse.statusText}`);
        }

        const createData = await createResponse.json() as { id: number };
        expenseId = createData.id;
      }

      // Submit the expense
      const submitResponse = await fetch(`/api/expenses/${expenseId}/submit`, {
        method: 'POST',
      });

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit expense: ${submitResponse.statusText}`);
      }

      // Redirect to list
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit expense';
      setError(errorMessage);
      console.error('Error submitting expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t('form.title')}</h1>

        {error && (
          <div style={styles.errorBanner}>
            <p style={styles.errorText}>{error}</p>
            <button
              style={styles.dismissButton}
              onClick={() => { setError(null); }}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {draftId && (
          <div style={styles.infoBanner}>
            <p style={styles.infoText}>{t('form.draftSaved')} (ID: {draftId})</p>
          </div>
        )}

        <form onSubmit={(e) => { void submitExpense(e); }} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="receipt_url" style={styles.label}>
              {t('form.receiptUrl')}
            </label>
            <div style={styles.inputWithButton}>
              <input
                type="url"
                id="receipt_url"
                name="receipt_url"
                value={formData.receipt_url}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://example.com/receipt.jpg"
              />
              <button
                type="button"
                onClick={() => { void parseReceipt(); }}
                disabled={ocrLoading || !formData.receipt_url.trim()}
                style={{
                  ...styles.secondaryButton,
                  ...(ocrLoading || !formData.receipt_url.trim()
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {ocrLoading ? t('form.parsing') : t('form.parseReceipt')}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="title" style={styles.label}>
              {t('form.expenseTitle')} <span style={styles.required}>{t('form.required')}</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="vendor_name" style={styles.label}>
              {t('form.vendor')} <span style={styles.required}>{t('form.required')}</span>
            </label>
            <input
              type="text"
              id="vendor_name"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="amount" style={styles.label}>
              {t('form.amount')} ({symbol}) <span style={styles.required}>{t('form.required')}</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              style={styles.input}
              placeholder="0.00"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="expense_date" style={styles.label}>
              {t('form.date')} <span style={styles.required}>{t('form.required')}</span>
            </label>
            <input
              type="date"
              id="expense_date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="category" style={styles.label}>
              {t('form.category')} <span style={styles.required}>{t('form.required')}</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={styles.select}
            >
              <option value="">{t('form.selectCategory')}</option>
              {CATEGORY_KEYS.map((catKey) => (
                <option key={catKey} value={catKey}>
                  {t(`categories.${catKey}`)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="description" style={styles.label}>
              {t('form.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              style={styles.textarea}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => { void saveDraft(); }}
              disabled={loading}
              style={{
                ...styles.secondaryButton,
                ...(loading ? styles.disabledButton : {}),
              }}
            >
              {loading ? t('form.saving') : t('form.saveDraft')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.disabledButton : {}),
              }}
            >
              {loading ? t('form.submitting') : t('form.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '2rem',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1.5rem',
    marginTop: 0,
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
  errorText: {
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
  infoBanner: {
    backgroundColor: '#dbeafe',
    border: '1px solid #3b82f6',
    borderRadius: '0.375rem',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  },
  infoText: {
    color: '#1e40af',
    margin: 0,
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
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
  required: {
    color: '#ef4444',
  },
  input: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    outline: 'none',
  },
  select: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    outline: 'none',
    backgroundColor: 'white',
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
  inputWithButton: {
    display: 'flex',
    gap: '0.5rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    whiteSpace: 'nowrap',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default ExpenseForm;
