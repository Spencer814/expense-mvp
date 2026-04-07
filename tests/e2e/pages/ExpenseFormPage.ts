import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ExpenseFormData {
  title: string;
  vendorName: string;
  amount: string;
  expenseDate: string;
  category?: string;
  description?: string;
}

/**
 * Page Object for Expense Form (Create/Edit)
 */
export class ExpenseFormPage extends BasePage {
  readonly titleInput: Locator;
  readonly vendorNameInput: Locator;
  readonly amountInput: Locator;
  readonly expenseDateInput: Locator;
  readonly categorySelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly saveDraftButton: Locator;
  readonly submitButton: Locator;
  readonly ocrButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator('input[name="title"], input[id="title"]');
    this.vendorNameInput = page.locator('input[name="vendor_name"], input[name="vendorName"], input[id="vendor_name"]');
    this.amountInput = page.locator('input[name="amount"], input[id="amount"]');
    this.expenseDateInput = page.locator('input[name="expense_date"], input[name="expenseDate"], input[id="expense_date"], input[type="date"]');
    this.categorySelect = page.locator('select[name="category"], select[id="category"]');
    this.descriptionTextarea = page.locator('textarea[name="description"], textarea[id="description"]');
    this.saveDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("Save")');
    this.submitButton = page.locator('button:has-text("Submit")');
    this.ocrButton = page.locator('button:has-text("Scan Receipt"), button:has-text("OCR"), button:has-text("Parse Receipt")');
    this.cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")');
  }

  /**
   * Navigate to new expense form
   */
  async navigateToNew(): Promise<void> {
    await this.goto('/new');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to edit expense form
   */
  async navigateToEdit(expenseId: number): Promise<void> {
    await this.goto(`/expenses/${expenseId}/edit`);
    await this.waitForPageLoad();
  }

  /**
   * Fill expense form with data
   */
  async fillForm(data: ExpenseFormData): Promise<void> {
    if (data.title) {
      await this.titleInput.fill(data.title);
    }
    if (data.vendorName) {
      await this.vendorNameInput.fill(data.vendorName);
    }
    if (data.amount) {
      await this.amountInput.fill(data.amount);
    }
    if (data.expenseDate) {
      await this.expenseDateInput.fill(data.expenseDate);
    }
    if (data.category) {
      await this.categorySelect.selectOption(data.category);
    }
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }
  }

  /**
   * Click Save Draft button
   */
  async clickSaveDraft(): Promise<void> {
    await this.saveDraftButton.click();
  }

  /**
   * Click Submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click OCR button to scan receipt
   */
  async clickOCR(): Promise<void> {
    await this.ocrButton.click();
  }

  /**
   * Click Cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Verify form has validation error
   */
  async verifyValidationError(fieldName: string): Promise<void> {
    const errorMessage = this.page.locator(`text=/.*${fieldName}.*required.*/i, .error:has-text("${fieldName}")`);
    await expect(errorMessage).toBeVisible();
  }

  /**
   * Verify form is populated with data
   */
  async verifyFormData(data: Partial<ExpenseFormData>): Promise<void> {
    if (data.title) {
      await expect(this.titleInput).toHaveValue(data.title);
    }
    if (data.vendorName) {
      await expect(this.vendorNameInput).toHaveValue(data.vendorName);
    }
    if (data.amount) {
      await expect(this.amountInput).toHaveValue(data.amount);
    }
  }

  /**
   * Verify OCR populated fields
   */
  async verifyOCRPopulated(): Promise<void> {
    // Wait for fields to be populated after OCR
    await this.page.waitForTimeout(1000);

    // Check that at least some fields have values
    const titleValue = await this.titleInput.inputValue();
    const vendorValue = await this.vendorNameInput.inputValue();
    const amountValue = await this.amountInput.inputValue();

    expect(titleValue || vendorValue || amountValue).toBeTruthy();
  }

  /**
   * Submit form and wait for navigation
   */
  async submitAndWaitForNavigation(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickSubmit(),
    ]);
  }

  /**
   * Save draft and wait for confirmation
   */
  async saveDraftAndWaitForConfirmation(): Promise<void> {
    await this.clickSaveDraft();
    await this.page.waitForTimeout(500); // Wait for save to complete
  }
}
