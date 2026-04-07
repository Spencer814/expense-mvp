import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExpenseList from './ExpenseList';

// Helper to wrap component with router
const renderWithRouter = (component: React.ReactElement) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('ExpenseList', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      // Mock fetch to never resolve
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      expect(screen.getByText(/loading expenses/i)).toBeInTheDocument();
    });

    it('should display spinner during loading', () => {
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      const loadingText = screen.getByText(/loading expenses/i);
      expect(loadingText).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/error:/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should display retry button on error', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Failed to fetch'))
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should reload page when retry button is clicked', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Failed to fetch'))
      ) as unknown as typeof fetch;

      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('should handle non-ok response status', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/error:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no expenses exist', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
      });
    });

    it('should display "Create your first expense" link in empty state', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/create your first expense/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success State - Expense Table', () => {
    const mockExpenses = [
      {
        id: 1,
        title: 'Office Supplies',
        vendor_name: 'Staples',
        amount: '125.50',
        expense_date: '2026-01-15',
        status: 'draft' as const,
      },
      {
        id: 2,
        title: 'Client Lunch',
        vendor_name: 'Restaurant ABC',
        amount: '89.99',
        expense_date: '2026-01-16',
        status: 'submitted' as const,
      },
      {
        id: 3,
        title: 'Travel Expenses',
        vendor_name: 'Airline XYZ',
        amount: '450.00',
        expense_date: '2026-01-17',
        status: 'approved' as const,
      },
    ];

    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExpenses),
        })
      ) as unknown as typeof fetch;
    });

    it('should render expense table after successful fetch', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display table headers', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/title/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/vendor/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/date/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });

    it('should display all expense data in table rows', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      });

      expect(screen.getByText('Staples')).toBeInTheDocument();
      expect(screen.getByText('Client Lunch')).toBeInTheDocument();
      expect(screen.getByText('Restaurant ABC')).toBeInTheDocument();
      expect(screen.getByText('Travel Expenses')).toBeInTheDocument();
      expect(screen.getByText('Airline XYZ')).toBeInTheDocument();
    });

    it('should format amounts with dollar sign and decimals', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('$125.50')).toBeInTheDocument();
      });

      expect(screen.getByText('$89.99')).toBeInTheDocument();
      expect(screen.getByText('$450.00')).toBeInTheDocument();
    });

    it('should format dates in readable format', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2026/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Jan 16, 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 17, 2026/i)).toBeInTheDocument();
    });

    it('should display status badges with correct text', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('draft')).toBeInTheDocument();
      });

      expect(screen.getByText('submitted')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('should display correct status badge colors', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const draftBadge = screen.getByText('draft');
        expect(draftBadge).toHaveStyle({ backgroundColor: '#6b7280' });
      });

      const submittedBadge = screen.getByText('submitted');
      expect(submittedBadge).toHaveStyle({ backgroundColor: '#3b82f6' });

      const approvedBadge = screen.getByText('approved');
      expect(approvedBadge).toHaveStyle({ backgroundColor: '#22c55e' });
    });

    it('should display rejected status with correct color', async () => {
      const rejectedExpense = [
        {
          id: 4,
          title: 'Rejected Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-18',
          status: 'rejected' as const,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(rejectedExpense),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const rejectedBadge = screen.getByText('rejected');
        expect(rejectedBadge).toHaveStyle({ backgroundColor: '#ef4444' });
      });
    });

    it('should display paid status with correct color', async () => {
      const paidExpense = [
        {
          id: 5,
          title: 'Paid Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-18',
          status: 'paid' as const,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(paidExpense),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const paidBadge = screen.getByText('paid');
        expect(paidBadge).toHaveStyle({ backgroundColor: '#8b5cf6' });
      });
    });

    it('should render expense titles as clickable links', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const officeSuppliesLink = screen.getByRole('link', { name: /office supplies/i });
        expect(officeSuppliesLink).toBeInTheDocument();
        expect(officeSuppliesLink).toHaveAttribute('href', '/expenses/1');
      });

      const lunchLink = screen.getByRole('link', { name: /client lunch/i });
      expect(lunchLink).toHaveAttribute('href', '/expenses/2');

      const travelLink = screen.getByRole('link', { name: /travel expenses/i });
      expect(travelLink).toHaveAttribute('href', '/expenses/3');
    });
  });

  describe('Header and Navigation', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;
    });

    it('should display "Expenses" title', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /expenses/i })).toBeInTheDocument();
      });
    });

    it('should display "New Expense" button in header', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const newExpenseLinks = screen.getAllByRole('link', { name: /new expense/i });
        expect(newExpenseLinks[0]).toBeInTheDocument();
        expect(newExpenseLinks[0]).toHaveAttribute('href', '/new');
      });
    });

    it('should have correct styling on New Expense button', async () => {
      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        const [newExpenseLink] = screen.getAllByRole('link', { name: /new expense/i });
        expect(newExpenseLink).toHaveStyle({
          backgroundColor: '#3b82f6',
          color: 'white',
        });
      });
    });
  });

  describe('API Integration', () => {
    it('should call /api/expenses endpoint', async () => {
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;
      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/expenses');
      });
    });

    it('should call fetch exactly once on mount', async () => {
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;
      global.fetch = fetchSpy;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date gracefully', async () => {
      const expenseWithInvalidDate = [
        {
          id: 1,
          title: 'Test Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: 'invalid-date',
          status: 'draft' as const,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(expenseWithInvalidDate),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        // Should display the original string if date parsing fails
        expect(screen.getByText('invalid-date')).toBeInTheDocument();
      });
    });

    it('should handle invalid amount gracefully', async () => {
      const expenseWithInvalidAmount = [
        {
          id: 1,
          title: 'Test Expense',
          vendor_name: 'Vendor',
          amount: 'not-a-number',
          expense_date: '2026-01-15',
          status: 'draft' as const,
        },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(expenseWithInvalidAmount),
        })
      ) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        // Should display the original string if parsing fails
        expect(screen.getByText('not-a-number')).toBeInTheDocument();
      });
    });

    it('should handle console.error on fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Network failure');

      global.fetch = vi.fn(() => Promise.reject(testError)) as unknown as typeof fetch;

      renderWithRouter(<ExpenseList />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching expenses:',
          testError
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
