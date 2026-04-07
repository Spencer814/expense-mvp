import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Expense List page
 */
export class ExpenseListPage extends BasePage {
  readonly newExpenseButton: Locator;
  readonly expenseTable: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.newExpenseButton = page.locator('a:has-text("New Expense")');
    this.expenseTable = page.locator('table');
    this.emptyState = page.locator('text=No expenses found');
  }

  /**
   * Navigate to expense list page
   */
  async navigate(): Promise<void> {
    await this.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Click on "New Expense" button
   */
  async clickNewExpense(): Promise<void> {
    await this.newExpenseButton.click();
  }

  /**
   * Get all expense rows
   */
  async getExpenseRows(): Promise<Locator[]> {
    return await this.page.locator('tbody tr').all();
  }

  /**
   * Get expense by title
   */
  getExpenseByTitle(title: string): Locator {
    return this.page.locator(`tr:has-text("${title}")`);
  }

  /**
   * Click on an expense to view details
   */
  async clickExpense(title: string): Promise<void> {
    await this.page.locator(`a:has-text("${title}")`).first().click();
  }

  /**
   * Get status badge for an expense
   */
  getExpenseStatus(title: string): Locator {
    return this.getExpenseByTitle(title).locator('span[style*="background"]');
  }

  /**
   * Verify expense exists in list
   */
  async verifyExpenseExists(title: string): Promise<void> {
    await expect(this.getExpenseByTitle(title)).toBeVisible();
  }

  /**
   * Verify expense has specific status
   */
  async verifyExpenseStatus(title: string, status: string): Promise<void> {
    const statusBadge = this.getExpenseStatus(title);
    await expect(statusBadge).toContainText(status, { ignoreCase: true });
  }

  /**
   * Get count of expenses
   */
  async getExpenseCount(): Promise<number> {
    const rows = await this.getExpenseRows();
    return rows.length;
  }

  /**
   * Verify empty state is shown
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}
