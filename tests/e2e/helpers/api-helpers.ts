import { Page, APIRequestContext } from '@playwright/test';

/**
 * API Helper Functions
 *
 * Direct API interactions for test setup and verification
 */

export class ApiHelpers {
  private baseURL: string;
  private defaultHeaders: { [key: string]: string };

  constructor(baseURL: string = 'http://localhost:3000', userId: number = 1) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-User-Id': userId.toString(),
    };
  }

  /**
   * Set user ID for subsequent requests
   */
  setUserId(userId: number): void {
    this.defaultHeaders['X-User-Id'] = userId.toString();
  }

  /**
   * Create expense via API
   */
  async createExpense(
    context: APIRequestContext,
    expenseData: {
      title: string;
      vendor_name: string;
      amount: number;
      expense_date: string;
      category?: string;
      description?: string;
    }
  ): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses`, {
      headers: this.defaultHeaders,
      data: { expense: expenseData },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Submit expense via API
   */
  async submitExpense(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses/${expenseId}/submit`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to submit expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Approve expense via API (Manager only)
   */
  async approveExpense(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses/${expenseId}/approve`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to approve expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Reject expense via API (Manager only)
   */
  async rejectExpense(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses/${expenseId}/reject`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to reject expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Mark expense as paid via API (Finance only)
   */
  async markExpensePaid(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses/${expenseId}/pay`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to mark expense as paid: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Get expense by ID via API
   */
  async getExpense(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.get(`${this.baseURL}/api/expenses/${expenseId}`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to get expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Get all expenses via API
   */
  async getAllExpenses(context: APIRequestContext): Promise<any[]> {
    const response = await context.get(`${this.baseURL}/api/expenses`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to get expenses: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Get dashboard data via API
   */
  async getDashboardData(context: APIRequestContext): Promise<any> {
    const response = await context.get(`${this.baseURL}/api/dashboard`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to get dashboard data: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Delete expense via API (if endpoint exists)
   */
  async deleteExpense(context: APIRequestContext, expenseId: number): Promise<void> {
    const response = await context.delete(`${this.baseURL}/api/expenses/${expenseId}`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Failed to delete expense: ${response.status()}`);
    }
  }

  /**
   * Update expense via API
   */
  async updateExpense(
    context: APIRequestContext,
    expenseId: number,
    updates: Partial<{
      title: string;
      vendor_name: string;
      amount: number;
      expense_date: string;
      category: string;
      description: string;
    }>
  ): Promise<any> {
    const response = await context.patch(`${this.baseURL}/api/expenses/${expenseId}`, {
      headers: this.defaultHeaders,
      data: { expense: updates },
    });

    if (!response.ok()) {
      throw new Error(`Failed to update expense: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Parse receipt via OCR API
   */
  async parseReceipt(context: APIRequestContext, expenseId: number): Promise<any> {
    const response = await context.post(`${this.baseURL}/api/expenses/${expenseId}/parse_receipt`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to parse receipt: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Get all users via API
   */
  async getAllUsers(context: APIRequestContext): Promise<any[]> {
    const response = await context.get(`${this.baseURL}/api/users`, {
      headers: this.defaultHeaders,
    });

    if (!response.ok()) {
      throw new Error(`Failed to get users: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Create complete expense workflow via API
   * Useful for test setup
   */
  async createCompleteWorkflow(
    context: APIRequestContext,
    expenseData: {
      title: string;
      vendor_name: string;
      amount: number;
      expense_date: string;
    }
  ): Promise<{ expense: any; submitted: any; approved: any; paid: any }> {
    // Create as Employee
    this.setUserId(1);
    const expense = await this.createExpense(context, expenseData);

    // Submit as Employee
    const submitted = await this.submitExpense(context, expense.id);

    // Approve as Manager
    this.setUserId(2);
    const approved = await this.approveExpense(context, expense.id);

    // Mark paid as Finance
    this.setUserId(3);
    const paid = await this.markExpensePaid(context, expense.id);

    return { expense, submitted, approved, paid };
  }

  /**
   * Wait for API call to complete
   */
  async waitForResponse(
    page: Page,
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ): Promise<any> {
    const responsePromise = page.waitForResponse(
      (response) =>
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())
    );

    await action();

    const response = await responsePromise;
    return await response.json();
  }

  /**
   * Verify API response status
   */
  async verifyResponseStatus(
    context: APIRequestContext,
    url: string,
    expectedStatus: number
  ): Promise<boolean> {
    const response = await context.get(url, {
      headers: this.defaultHeaders,
    });

    return response.status() === expectedStatus;
  }
}

/**
 * Create API helper instance for specific user
 */
export function createApiHelper(userId: number = 1): ApiHelpers {
  return new ApiHelpers('http://localhost:3000', userId);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}
