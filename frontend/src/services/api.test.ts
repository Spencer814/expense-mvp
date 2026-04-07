import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dashboardApi,
  expensesApi,
  getCurrentUserId,
  setCurrentUser,
  usersApi,
} from './api';

describe('API Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    // Reset current user before each test
    setCurrentUser(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('setCurrentUser and getCurrentUserId', () => {
    it('should set current user ID', () => {
      setCurrentUser(123);
      expect(getCurrentUserId()).toBe(123);
    });

    it('should clear current user ID when set to null', () => {
      setCurrentUser(456);
      expect(getCurrentUserId()).toBe(456);

      setCurrentUser(null);
      expect(getCurrentUserId()).toBeNull();
    });

    it('should update current user ID', () => {
      setCurrentUser(100);
      expect(getCurrentUserId()).toBe(100);

      setCurrentUser(200);
      expect(getCurrentUserId()).toBe(200);
    });
  });

  describe('Request Headers', () => {
    it('should include X-User-Id header when user is set', async () => {
      setCurrentUser(999);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      await usersApi.getAll();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Id': '999',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not include X-User-Id header when user is null', async () => {
      setCurrentUser(null);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      await usersApi.getAll();

      const [[, init]] = (global.fetch as unknown as { mock: { calls: [[string, RequestInit]] } }).mock.calls;
      const { headers } = init;

      expect(headers['X-User-Id']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should always include Content-Type header', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      await usersApi.getAll();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when response is not ok', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        })
      ) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow(/HTTP 404: Not Found/);
    });

    it('should use error detail from response if available', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ detail: 'Invalid input provided' }),
        })
      ) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow('Invalid input provided');
    });

    it('should use error message from response if available', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ message: 'Database connection failed' }),
        })
      ) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network request failed'))
      ) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow('Network request failed');
    });

    it('should handle errors when response.json() fails', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('Invalid JSON')),
        })
      ) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow(/HTTP 500: Internal Server Error/);
    });

    it('should throw generic error for unknown error types', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('String error'))) as unknown as typeof fetch;

      await expect(usersApi.getAll()).rejects.toThrow('An unknown error occurred');
    });
  });

  describe('Users API', () => {
    describe('getAll', () => {
      it('should call GET /api/users', async () => {
        const mockUsers = [
          { id: 1, name: 'Alice', email: 'alice@example.com', role: 'submitter' },
          { id: 2, name: 'Bob', email: 'bob@example.com', role: 'approver' },
        ];

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          })
        ) as unknown as typeof fetch;

        const result = await usersApi.getAll();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/users',
          expect.objectContaining({
            headers: expect.any(Object),
          })
        );
        expect(result).toEqual(mockUsers);
      });
    });

    describe('getById', () => {
      it('should call GET /api/users/:id with correct ID', async () => {
        const mockUser = { id: 5, name: 'Charlie', email: 'charlie@example.com', role: 'finance' };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUser),
          })
        ) as unknown as typeof fetch;

        const result = await usersApi.getById(5);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/users/5',
          expect.objectContaining({
            headers: expect.any(Object),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });
  });

  describe('Expenses API', () => {
    describe('getAll', () => {
      it('should call GET /api/expenses', async () => {
        const mockExpenses = [
          {
            id: 1,
            title: 'Expense 1',
            vendor_name: 'Vendor A',
            amount: '100.00',
            expense_date: '2026-01-15',
            status: 'draft',
            submitter_id: 1,
          },
        ];

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExpenses),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.getAll();

        expect(global.fetch).toHaveBeenCalledWith('/api/expenses', expect.any(Object));
        expect(result).toEqual(mockExpenses);
      });
    });

    describe('getById', () => {
      it('should call GET /api/expenses/:id', async () => {
        const mockExpense = {
          id: 10,
          title: 'Travel Expense',
          vendor_name: 'Airline',
          amount: '500.00',
          expense_date: '2026-01-20',
          status: 'submitted',
          submitter_id: 2,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExpense),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.getById(10);

        expect(global.fetch).toHaveBeenCalledWith('/api/expenses/10', expect.any(Object));
        expect(result).toEqual(mockExpense);
      });
    });

    describe('create', () => {
      it('should call POST /api/expenses with correct data', async () => {
        const createData = {
          title: 'New Expense',
          vendor_name: 'New Vendor',
          amount: 150.5,
          expense_date: '2026-01-25',
          description: 'Test expense',
          submitter_id: 3,
        };

        const mockResponse = { id: 20, ...createData, status: 'draft' };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.create(createData);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify(createData),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('update', () => {
      it('should call PUT /api/expenses/:id with correct data', async () => {
        const updateData = {
          title: 'Updated Title',
          amount: 200.0,
        };

        const mockResponse = {
          id: 15,
          title: 'Updated Title',
          vendor_name: 'Vendor',
          amount: 200.0,
          expense_date: '2026-01-15',
          status: 'draft',
          submitter_id: 1,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.update(15, updateData);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/15',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('delete', () => {
      it('should call DELETE /api/expenses/:id', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(undefined),
          })
        ) as unknown as typeof fetch;

        await expensesApi.delete(25);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/25',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    describe('submit', () => {
      it('should call POST /api/expenses/:id/submit', async () => {
        const mockResponse = {
          id: 30,
          title: 'Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-15',
          status: 'submitted',
          submitter_id: 1,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.submit(30);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/30/submit',
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('approve', () => {
      it('should call POST /api/expenses/:id/approve with approval data', async () => {
        const approvalData = {
          approved: true,
          comment: 'Looks good',
        };

        const mockResponse = {
          id: 35,
          title: 'Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-15',
          status: 'approved',
          submitter_id: 1,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.approve(35, approvalData);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/35/approve',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify(approvalData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should handle rejection with approved: false', async () => {
        const rejectionData = {
          approved: false,
          comment: 'Missing receipt',
        };

        const mockResponse = {
          id: 40,
          title: 'Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-15',
          status: 'rejected',
          submitter_id: 1,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.approve(40, rejectionData);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/40/approve',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(rejectionData),
          })
        );
        expect(result.status).toBe('rejected');
      });
    });

    describe('markPaid', () => {
      it('should call POST /api/expenses/:id/mark-paid', async () => {
        const mockResponse = {
          id: 45,
          title: 'Expense',
          vendor_name: 'Vendor',
          amount: '100.00',
          expense_date: '2026-01-15',
          status: 'paid',
          submitter_id: 1,
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          })
        ) as unknown as typeof fetch;

        const result = await expensesApi.markPaid(45);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/45/mark-paid',
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Dashboard API', () => {
    describe('getStats', () => {
      it('should call GET /api/dashboard/stats', async () => {
        const mockStats = {
          total_expenses: 100,
          pending_approval: 25,
          approved_expenses: 60,
          total_amount: '50000.00',
        };

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
          })
        ) as unknown as typeof fetch;

        const result = await dashboardApi.getStats();

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dashboard/stats',
          expect.any(Object)
        );
        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Integration with User Context', () => {
    it('should include user ID in all subsequent requests after setCurrentUser', async () => {
      setCurrentUser(777);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ) as unknown as typeof fetch;

      await usersApi.getAll();
      await expensesApi.getAll();
      await dashboardApi.getStats();

      type MockCalls = [[string, { headers: Record<string, string> }]];
      const { calls } = (global.fetch as unknown as { mock: { calls: MockCalls } }).mock;

      expect(calls[0][1].headers['X-User-Id']).toBe('777');
      expect(calls[1][1].headers['X-User-Id']).toBe('777');
      expect(calls[2][1].headers['X-User-Id']).toBe('777');
    });

    it('should update header when user changes', async () => {
      setCurrentUser(111);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch;

      type MockCalls = [[string, { headers: Record<string, string> }]];
      await usersApi.getAll();
      expect((global.fetch as unknown as { mock: { calls: MockCalls } }).mock.calls[0][1].headers['X-User-Id']).toBe('111');

      setCurrentUser(222);
      await usersApi.getAll();
      expect((global.fetch as unknown as { mock: { calls: MockCalls } }).mock.calls[1][1].headers['X-User-Id']).toBe('222');
    });
  });

  describe('API Base URL', () => {
    it('should prepend /api to all endpoints', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ) as unknown as typeof fetch;

      type MockCalls = [[string, unknown]];
      await usersApi.getAll();
      expect((global.fetch as unknown as { mock: { calls: MockCalls } }).mock.calls[0][0]).toBe('/api/users');

      await expensesApi.getAll();
      expect((global.fetch as unknown as { mock: { calls: MockCalls } }).mock.calls[1][0]).toBe('/api/expenses');

      await dashboardApi.getStats();
      expect((global.fetch as unknown as { mock: { calls: MockCalls } }).mock.calls[2][0]).toBe('/api/dashboard/stats');
    });
  });
});
