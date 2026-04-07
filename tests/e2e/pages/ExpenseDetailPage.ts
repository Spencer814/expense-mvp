import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Expense Detail page
 */
export class ExpenseDetailPage extends BasePage {
  readonly expenseTitle: Locator;
  readonly expenseStatus: Locator;
  readonly editButton: Locator;
  readonly submitButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly markPaidButton: Locator;
  readonly backButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.expenseTitle = page.locator('h1, h2').first();
    this.expenseStatus = page.locator('span[style*="background"], .status-badge');
    this.editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
    this.submitButton = page.locator('button:has-text("Submit")');
    this.approveButton = page.locator('button:has-text("Approve")');
    this.rejectButton = page.locator('button:has-text("Reject")');
    this.markPaidButton = page.locator('button:has-text("Mark"), button:has-text("Paid"), button:has-text("Mark Paid")');
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back")');
    this.deleteButton = page.locator('button:has-text("Delete")');
  }

  /**
   * Navigate to expense detail page
   */
  async navigate(expenseId: number): Promise<void> {
    await this.goto(`/expenses/${expenseId}`);
    await this.waitForPageLoad();
  }

  /**
   * Get expense details
   */
  async getExpenseDetails(): Promise<{ [key: string]: string }> {
    const details: { [key: string]: string } = {};

    // Extract details from page - adapt selectors based on actual implementation
    const title = await this.expenseTitle.textContent();
    if (title) details.title = title;

    const status = await this.expenseStatus.textContent();
    if (status) details.status = status;

    return details;
  }

  /**
   * Click Edit button
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /**
   * Click Submit button (for draft expenses)
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForTimeout(500); // Wait for submission
  }

  /**
   * Click Approve button (for managers)
   */
  async clickApprove(): Promise<void> {
    await this.approveButton.click();
    await this.page.waitForTimeout(500); // Wait for approval
  }

  /**
   * Click Reject button (for managers)
   */
  async clickReject(): Promise<void> {
    await this.rejectButton.click();
    await this.page.waitForTimeout(500); // Wait for rejection
  }

  /**
   * Click Mark Paid button (for finance)
   */
  async clickMarkPaid(): Promise<void> {
    await this.markPaidButton.click();
    await this.page.waitForTimeout(500); // Wait for payment marking
  }

  /**
   * Click Back button
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Verify expense status
   */
  async verifyStatus(expectedStatus: string): Promise<void> {
    await expect(this.expenseStatus).toContainText(expectedStatus, { ignoreCase: true });
  }

  /**
   * Verify button is visible (role-based access control)
   */
  async verifyButtonVisible(buttonName: 'Edit' | 'Submit' | 'Approve' | 'Reject' | 'Mark Paid'): Promise<void> {
    const button = this.getButtonByName(buttonName);
    await expect(button).toBeVisible();
  }

  /**
   * Verify button is not visible (role-based access control)
   */
  async verifyButtonNotVisible(buttonName: 'Edit' | 'Submit' | 'Approve' | 'Reject' | 'Mark Paid'): Promise<void> {
    const button = this.getButtonByName(buttonName);
    await expect(button).not.toBeVisible();
  }

  /**
   * Get button by name
   */
  private getButtonByName(buttonName: string): Locator {
    switch (buttonName) {
      case 'Edit':
        return this.editButton;
      case 'Submit':
        return this.submitButton;
      case 'Approve':
        return this.approveButton;
      case 'Reject':
        return this.rejectButton;
      case 'Mark Paid':
        return this.markPaidButton;
      default:
        throw new Error(`Unknown button name: ${buttonName}`);
    }
  }

  /**
   * Get expense field value
   */
  async getFieldValue(fieldLabel: string): Promise<string | null> {
    const field = this.page.locator(`text=${fieldLabel}`).locator('..').locator('text=/./');
    return await field.textContent();
  }

  /**
   * Verify expense field
   */
  async verifyField(fieldLabel: string, expectedValue: string): Promise<void> {
    const field = this.page.locator(`text=/.*${fieldLabel}.*${expectedValue}.*/i`);
    await expect(field).toBeVisible();
  }
}
