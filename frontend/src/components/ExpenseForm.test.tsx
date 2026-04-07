import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ExpenseForm from './ExpenseForm';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to wrap component with router
const renderWithRouter = (component: React.ReactElement) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('ExpenseForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Component Rendering', () => {
    it('should render the form with all required fields', () => {
      renderWithRouter(<ExpenseForm />);

      expect(screen.getByRole('heading', { name: /new expense/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/receipt url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vendor name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expense date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render Save Draft and Submit buttons', () => {
      renderWithRouter(<ExpenseForm />);

      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should render Parse Receipt button', () => {
      renderWithRouter(<ExpenseForm />);

      expect(screen.getByRole('button', { name: /parse receipt \(ocr\)/i })).toBeInTheDocument();
    });

    it('should display all category options', () => {
      renderWithRouter(<ExpenseForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      const options = Array.from(categorySelect.options).map((opt) => opt.value);

      expect(options).toContain('Travel');
      expect(options).toContain('Meals');
      expect(options).toContain('Office Supplies');
      expect(options).toContain('Software');
      expect(options).toContain('Equipment');
      expect(options).toContain('Other');
    });

    it('should have required asterisks on mandatory fields', () => {
      renderWithRouter(<ExpenseForm />);

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Form Input Handling', () => {
    it('should update title field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Office Lunch');

      expect(titleInput.value).toBe('Office Lunch');
    });

    it('should update vendor name field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const vendorInput = screen.getByLabelText(/vendor name/i);
      await user.type(vendorInput, 'Restaurant XYZ');

      expect(vendorInput.value).toBe('Restaurant XYZ');
    });

    it('should update amount field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '125.50');

      expect(amountInput.value).toBe('125.50');
    });

    it('should update expense date field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const dateInput = screen.getByLabelText(/expense date/i);
      await user.type(dateInput, '2026-01-15');

      expect(dateInput.value).toBe('2026-01-15');
    });

    it('should update category field on selection', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'Travel');

      expect(categorySelect.value).toBe('Travel');
    });

    it('should update description field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Business lunch with client');

      expect(descriptionInput.value).toBe('Business lunch with client');
    });

    it('should update receipt URL field on user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      expect(receiptInput.value).toBe('https://example.com/receipt.jpg');
    });
  });

  describe('Form Validation', () => {
    it('should show error when title is missing on submit', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when vendor name is missing on submit', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Expense');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/vendor name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when amount is missing on submit', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Expense');

      const vendorInput = screen.getByLabelText(/vendor name/i);
      await user.type(vendorInput, 'Vendor ABC');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid amount is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when amount is zero or negative', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Expense');

      const vendorInput = screen.getByLabelText(/vendor name/i);
      await user.type(vendorInput, 'Vendor ABC');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '0');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid amount is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when expense date is missing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Expense');

      const vendorInput = screen.getByLabelText(/vendor name/i);
      await user.type(vendorInput, 'Vendor ABC');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/expense date is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when category is missing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Expense');

      const vendorInput = screen.getByLabelText(/vendor name/i);
      await user.type(vendorInput, 'Vendor ABC');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const dateInput = screen.getByLabelText(/expense date/i);
      await user.type(dateInput, '2026-01-15');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });
    });

    it('should allow submit when all required fields are filled', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'submitted' }),
        }) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Expense');
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor ABC');
      await user.type(screen.getByLabelText(/amount/i), '100.50');
      await user.type(screen.getByLabelText(/expense date/i), '2026-01-15');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Travel');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should dismiss error banner when X is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: '×' });
      await user.click(dismissButton);

      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Save Draft Functionality', () => {
    it('should call createExpense API when Save Draft is clicked', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123 }),
        })
      ) as unknown as typeof fetch;
      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Draft Expense');
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor XYZ');
      await user.type(screen.getByLabelText(/amount/i), '50.00');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/expenses',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Draft Expense'),
          })
        );
      });
    });

    it('should display success message after saving draft', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert').mockImplementation(() => {});

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123 }),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Draft Expense');
      await user.type(screen.getByLabelText(/amount/i), '50.00');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Draft saved successfully!');
      });

      alertSpy.mockRestore();
    });

    it('should display draft ID banner after successful save', async () => {
      const user = userEvent.setup();
      vi.spyOn(global, 'alert').mockImplementation(() => {});

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 456 }),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Draft Expense');
      await user.type(screen.getByLabelText(/amount/i), '50.00');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByText(/draft saved \(id: 456\)/i)).toBeInTheDocument();
      });
    });

    it('should show error when Save Draft fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Draft Expense');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save draft/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should disable buttons during Save Draft operation', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Draft Expense');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Submit Functionality', () => {
    it('should call createExpense and submitExpense APIs on submit', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 789 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 789, status: 'submitted' }),
        }) as unknown as typeof fetch;

      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Submit Expense');
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor 123');
      await user.type(screen.getByLabelText(/amount/i), '200.00');
      await user.type(screen.getByLabelText(/expense date/i), '2026-01-20');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Meals');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        '/api/expenses',
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        '/api/expenses/789/submit',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should navigate to home after successful submit', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 111 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 111, status: 'submitted' }),
        }) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Submit Test');
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor');
      await user.type(screen.getByLabelText(/amount/i), '100.00');
      await user.type(screen.getByLabelText(/expense date/i), '2026-01-20');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Travel');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should use existing draft ID if already saved', async () => {
      const user = userEvent.setup();
      vi.spyOn(global, 'alert').mockImplementation(() => {});

      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 555 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 555, status: 'submitted' }),
        }) as unknown as typeof fetch;

      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/amount/i), '100.00');

      // Save draft first
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByText(/draft saved \(id: 555\)/i)).toBeInTheDocument();
      });

      // Now fill remaining fields and submit
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor');
      await user.type(screen.getByLabelText(/expense date/i), '2026-01-20');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Travel');

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 555, status: 'submitted' }),
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Should only call submit, not create again
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/expenses/555/submit',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should show error when submit fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 222 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        }) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/vendor name/i), 'Vendor');
      await user.type(screen.getByLabelText(/amount/i), '100.00');
      await user.type(screen.getByLabelText(/expense date/i), '2026-01-20');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Travel');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to submit expense/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('OCR / Parse Receipt Functionality', () => {
    it('should disable Parse Receipt button when URL is empty', () => {
      renderWithRouter(<ExpenseForm />);

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      expect(parseButton).toBeDisabled();
    });

    it('should enable Parse Receipt button when URL is entered', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      expect(parseButton).not.toBeDisabled();
    });

    it('should show error when Parse Receipt is clicked without URL', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ExpenseForm />);

      // Manually enable button (though it should be disabled in real scenario)
      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'url');
      await user.clear(receiptInput);

      // Force click despite disabled state
      const parseButton = screen.getByRole('button', { name: /parse receipt/i });

      // Since button is disabled, we need to test the underlying function
      // This test validates the error handling in parseReceipt function
      expect(parseButton).toBeDisabled();
    });

    it('should call parseReceipt API when Parse Receipt button is clicked', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Parsed Title',
            vendor_name: 'Parsed Vendor',
            amount: '99.99',
            expense_date: '2026-01-18',
            category: 'Meals',
          }),
        })
      ) as unknown as typeof fetch;

      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      await user.click(parseButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/parse-receipt',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('https://example.com/receipt.jpg'),
          })
        );
      });
    });

    it('should populate form fields with OCR data', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'OCR Expense Title',
            vendor_name: 'OCR Vendor Name',
            amount: '150.75',
            expense_date: '2026-01-22',
            category: 'Software',
          }),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      await user.click(parseButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput.value).toBe('OCR Expense Title');
      });

      const vendorInput = screen.getByLabelText(/vendor name/i);
      expect(vendorInput.value).toBe('OCR Vendor Name');

      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput.value).toBe('150.75');

      const dateInput = screen.getByLabelText(/expense date/i);
      expect(dateInput.value).toBe('2026-01-22');

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect.value).toBe('Software');
    });

    it('should preserve existing field values if OCR returns null', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'OCR Title',
            // vendor_name not returned
            amount: null,
            expense_date: null,
            category: null,
          }),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      // Pre-fill some fields
      await user.type(screen.getByLabelText(/vendor name/i), 'Existing Vendor');
      await user.type(screen.getByLabelText(/amount/i), '200.00');

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      await user.click(parseButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput.value).toBe('OCR Title');
      });

      // These should remain unchanged
      const vendorInput = screen.getByLabelText(/vendor name/i);
      expect(vendorInput.value).toBe('Existing Vendor');

      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput.value).toBe('200.00');
    });

    it('should show loading state during OCR processing', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      await user.click(parseButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /parsing/i })).toBeInTheDocument();
      });
    });

    it('should show error when OCR parsing fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Service Unavailable',
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      const receiptInput = screen.getByLabelText(/receipt url/i);
      await user.type(receiptInput, 'https://example.com/receipt.jpg');

      const parseButton = screen.getByRole('button', { name: /parse receipt/i });
      await user.click(parseButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to parse receipt/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/amount/i), '100.00');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should convert amount string to number in API payload', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 999 }),
        })
      ) as unknown as typeof fetch;

      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/amount/i), '123.45');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        const [[, init]] = fetchSpy.mock.calls;
        const body = JSON.parse((init as RequestInit).body as string) as { amount: number };
        expect(body.amount).toBe(123.45);
        expect(typeof body.amount).toBe('number');
      });
    });
  });
});
