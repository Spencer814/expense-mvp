/**
 * Shared TypeScript type definitions for Expense Approval MVP
 *
 * All interfaces use readonly properties to enforce immutability
 * and prevent accidental mutations in the application.
 */

/**
 * Available user roles in the expense approval workflow
 */
export type UserRole = 'submitter' | 'approver' | 'finance';

/**
 * Possible statuses for an expense throughout its lifecycle
 */
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';

/**
 * User account information
 *
 * @interface User
 * @property {number} id - Unique user identifier
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {UserRole} role - User's role determining permissions
 */
export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

/**
 * Complete expense record
 *
 * @interface Expense
 * @property {number} id - Unique expense identifier
 * @property {string} title - Short title/description
 * @property {string} vendor_name - Name of the vendor
 * @property {string} amount - Monetary amount as string for precision
 * @property {string} expense_date - Date the expense occurred (ISO format)
 * @property {ExpenseStatus} status - Current workflow status
 * @property {string} [description] - Optional detailed description
 * @property {number} submitter_id - ID of the user who submitted
 * @property {string} [submitter_name] - Name of the submitter
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [updated_at] - Last update timestamp
 */
export interface Expense {
  readonly id: number;
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: string;
  readonly expense_date: string;
  readonly status: ExpenseStatus;
  readonly description?: string;
  readonly submitter_id: number;
  readonly submitter_name?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Request payload for creating a new expense
 *
 * @interface CreateExpenseRequest
 */
export interface CreateExpenseRequest {
  readonly title: string;
  readonly vendor_name: string;
  readonly amount: number;
  readonly expense_date: string;
  readonly description?: string;
  readonly submitter_id: number;
}

/**
 * Request payload for updating an existing expense
 * All fields are optional - only provided fields will be updated
 *
 * @interface UpdateExpenseRequest
 */
export interface UpdateExpenseRequest {
  readonly title?: string;
  readonly vendor_name?: string;
  readonly amount?: number;
  readonly expense_date?: string;
  readonly description?: string;
}

/**
 * Request payload for approving or rejecting an expense
 *
 * @interface ApprovalRequest
 * @property {boolean} approved - Whether the expense is approved
 * @property {string} [comment] - Optional comment (required for rejections)
 */
export interface ApprovalRequest {
  readonly approved: boolean;
  readonly comment?: string;
}

/**
 * Dashboard statistics summary
 *
 * @interface DashboardStats
 * @property {number} total_expenses - Total number of expenses
 * @property {number} pending_approval - Count of expenses pending approval
 * @property {number} approved_expenses - Count of approved expenses
 * @property {string} total_amount - Total monetary amount as string
 */
export interface DashboardStats {
  readonly total_expenses: number;
  readonly pending_approval: number;
  readonly approved_expenses: number;
  readonly total_amount: string;
}
