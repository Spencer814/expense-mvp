/**
 * Test Data Helpers
 *
 * Utilities for generating test data with unique identifiers
 */

export interface TestExpense {
  title: string;
  vendorName: string;
  amount: string;
  expenseDate: string;
  category?: string;
  description?: string;
}

export interface TestUser {
  id: number;
  role: 'Employee' | 'Manager' | 'Finance';
}

/**
 * Generate unique test expense data
 */
export function generateTestExpense(overrides?: Partial<TestExpense>): TestExpense {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  return {
    title: `Test Expense ${timestamp}`,
    vendorName: `Vendor ${randomNum}`,
    amount: (Math.random() * 500 + 50).toFixed(2),
    expenseDate: generateFutureDate(),
    category: 'Travel',
    description: `Test description for expense ${timestamp}`,
    ...overrides,
  };
}

/**
 * Generate a future date string in YYYY-MM-DD format
 */
export function generateFutureDate(daysFromNow: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Generate a past date string in YYYY-MM-DD format
 */
export function generatePastDate(daysAgo: number = 7): string {
  return generateFutureDate(-daysAgo);
}

/**
 * Get user ID for role
 */
export function getUserIdForRole(role: 'Employee' | 'Manager' | 'Finance'): number {
  const roleMap: { [key: string]: number } = {
    Employee: 1,
    Manager: 2,
    Finance: 3,
  };
  return roleMap[role];
}

/**
 * Get test users
 */
export function getTestUsers(): TestUser[] {
  return [
    { id: 1, role: 'Employee' },
    { id: 2, role: 'Manager' },
    { id: 3, role: 'Finance' },
  ];
}

/**
 * Generate random amount within range
 */
export function generateRandomAmount(min: number = 10, max: number = 1000): string {
  const amount = Math.random() * (max - min) + min;
  return amount.toFixed(2);
}

/**
 * Generate test expense with specific status
 */
export function generateExpenseForStatus(
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
): TestExpense {
  const baseExpense = generateTestExpense();

  switch (status) {
    case 'draft':
      return { ...baseExpense, title: `Draft ${baseExpense.title}` };
    case 'submitted':
      return { ...baseExpense, title: `Submitted ${baseExpense.title}` };
    case 'approved':
      return { ...baseExpense, title: `Approved ${baseExpense.title}` };
    case 'rejected':
      return { ...baseExpense, title: `Rejected ${baseExpense.title}` };
    case 'paid':
      return { ...baseExpense, title: `Paid ${baseExpense.title}` };
    default:
      return baseExpense;
  }
}

/**
 * Wait helper for network requests
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

/**
 * Parse amount from display format
 */
export function parseAmount(displayAmount: string): number {
  return parseFloat(displayAmount.replace(/[$,]/g, ''));
}

/**
 * Generate test data for category
 */
export function generateExpensesByCategory(): { [category: string]: TestExpense[] } {
  const categories = ['Travel', 'Meals', 'Office', 'Equipment'];
  const result: { [category: string]: TestExpense[] } = {};

  categories.forEach((category) => {
    result[category] = [
      generateTestExpense({ category }),
      generateTestExpense({ category }),
    ];
  });

  return result;
}

/**
 * Validate expense data
 */
export function validateExpenseData(expense: TestExpense): boolean {
  if (!expense.title || expense.title.trim() === '') return false;
  if (!expense.vendorName || expense.vendorName.trim() === '') return false;
  if (!expense.amount || parseFloat(expense.amount) <= 0) return false;
  if (!expense.expenseDate || expense.expenseDate.trim() === '') return false;

  return true;
}

/**
 * Create minimal valid expense
 */
export function createMinimalExpense(): TestExpense {
  return {
    title: `Minimal Expense ${Date.now()}`,
    vendorName: 'Test Vendor',
    amount: '50.00',
    expenseDate: generateFutureDate(),
  };
}

/**
 * Create complete expense with all fields
 */
export function createCompleteExpense(): TestExpense {
  return {
    title: `Complete Expense ${Date.now()}`,
    vendorName: 'Complete Vendor LLC',
    amount: '234.56',
    expenseDate: generatePastDate(3),
    category: 'Travel',
    description: 'Complete expense with all fields populated for comprehensive testing',
  };
}
