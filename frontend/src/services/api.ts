/**
 * API Service for Expense Approval MVP
 *
 * Provides centralized API communication with headers management
 * for user authentication simulation
 */

// Use environment variable for production, fallback to /api for development (proxied by Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Global state for current user ID (used for X-User-Id header)
let currentUserId: number | null = null;

/**
 * Set the current user ID for API requests
 * This will be included in all subsequent API calls as X-User-Id header
 *
 * @param userId - User ID to set, or null to clear
 */
export const setCurrentUser = (userId: number | null): void => {
  currentUserId = userId;
};

/**
 * Get the current user ID
 *
 * @returns Current user ID or null
 */
export const getCurrentUserId = (): number | null => currentUserId;

/**
 * Create headers for API requests with X-User-Id if available
 *
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object
 */
const createHeaders = (additionalHeaders?: HeadersInit): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (currentUserId !== null) {
    (headers as Record<string, string>)['X-User-Id'] = currentUserId.toString();
  }

  return headers;
};

/**
 * Generic fetch wrapper with error handling
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response data
 */
const fetchApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: createHeaders(options?.headers),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { detail?: string; message?: string };
      throw new Error(
        errorData.detail ?? errorData.message ?? `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
};

// API Methods

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: 'submitter' | 'approver' | 'finance';
}

export interface Expense {
  readonly id: number;
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: string;
  readonly expense_date: string;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  readonly description?: string;
  readonly submitter_id: number;
  readonly submitter_name?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface CreateExpenseRequest {
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: number;
  readonly expense_date: string;
  readonly description?: string;
  readonly submitter_id: number;
}

export interface UpdateExpenseRequest {
  readonly title?: string;
  readonly vendor_name?: string;
  readonly amount?: number;
  readonly expense_date?: string;
  readonly description?: string;
}

export interface ApprovalRequest {
  readonly approved: boolean;
  readonly comment?: string;
}

export interface DashboardStats {
  readonly total_expenses: number;
  readonly pending_approval: number;
  readonly approved_expenses: number;
  readonly total_amount: string;
}

/**
 * User API
 */
export const usersApi = {
  getAll: (): Promise<User[]> => fetchApi<User[]>('/users'),
  getById: (id: number): Promise<User> => fetchApi<User>(`/users/${id}`),
};

/**
 * Expenses API
 */
export const expensesApi = {
  getAll: (): Promise<Expense[]> => fetchApi<Expense[]>('/expenses'),

  getById: (id: number): Promise<Expense> => fetchApi<Expense>(`/expenses/${id}`),

  create: (data: CreateExpenseRequest): Promise<Expense> =>
    fetchApi<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateExpenseRequest): Promise<Expense> =>
    fetchApi<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    fetchApi<void>(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  submit: (id: number): Promise<Expense> =>
    fetchApi<Expense>(`/expenses/${id}/submit`, {
      method: 'POST',
    }),

  approve: (id: number, data: ApprovalRequest): Promise<Expense> =>
    fetchApi<Expense>(`/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markPaid: (id: number): Promise<Expense> =>
    fetchApi<Expense>(`/expenses/${id}/mark-paid`, {
      method: 'POST',
    }),
};

/**
 * Dashboard API
 */
export const dashboardApi = {
  getStats: (): Promise<DashboardStats> => fetchApi<DashboardStats>('/dashboard/stats'),
};

// Export all APIs as default
export default {
  users: usersApi,
  expenses: expensesApi,
  dashboard: dashboardApi,
  setCurrentUser,
  getCurrentUserId,
};
