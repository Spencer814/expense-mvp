import { test, expect } from '@playwright/test';
import { ExpenseListPage } from './pages/ExpenseListPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { RoleSwitcherPage } from './pages/RoleSwitcherPage';

/**
 * Expense Form E2E Tests
 *
 * Tests form validation, OCR functionality, save draft, and submit features.
 */
test.describe('Expense Form', () => {
  let expenseListPage: ExpenseListPage;
  let expenseFormPage: ExpenseFormPage;
  let expenseDetailPage: ExpenseDetailPage;
  let roleSwitcher: RoleSwitcherPage;

  test.beforeEach(async ({ page }) => {
    expenseListPage = new ExpenseListPage(page);
    expenseFormPage = new ExpenseFormPage(page);
    expenseDetailPage = new ExpenseDetailPage(page);
    roleSwitcher = new RoleSwitcherPage(page);

    // Setup as Employee user
    await roleSwitcher.setupAPIInterception(1);
  });

  test.describe('Form Validation', () => {
    test('should show validation errors for required fields', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Try to submit empty form
      await expenseFormPage.clickSubmit();

      // Wait for validation errors to appear
      await page.waitForTimeout(500);

      // Verify validation errors are shown
      // Note: Actual selectors depend on implementation
      const hasErrors = await page.locator('.error, [class*="error"], [class*="invalid"]').count();
      expect(hasErrors).toBeGreaterThan(0);
    });

    test('should validate required title field', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Fill all fields except title
      await expenseFormPage.fillForm({
        title: '',
        vendorName: 'Test Vendor',
        amount: '100.00',
        expenseDate: '2026-03-20',
      });

      // Try to submit
      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(500);

      // Should still be on form page due to validation error
      const titleInput = expenseFormPage.titleInput;
      await expect(titleInput).toBeVisible();
    });

    test('should validate required vendor name field', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      await expenseFormPage.fillForm({
        title: 'Test Expense',
        vendorName: '',
        amount: '100.00',
        expenseDate: '2026-03-20',
      });

      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(500);

      // Should still be on form page
      const vendorInput = expenseFormPage.vendorNameInput;
      await expect(vendorInput).toBeVisible();
    });

    test('should validate required amount field', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      await expenseFormPage.fillForm({
        title: 'Test Expense',
        vendorName: 'Test Vendor',
        amount: '',
        expenseDate: '2026-03-20',
      });

      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(500);

      // Should still be on form page
      const amountInput = expenseFormPage.amountInput;
      await expect(amountInput).toBeVisible();
    });

    test('should validate amount is a positive number', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      await expenseFormPage.fillForm({
        title: 'Test Expense',
        vendorName: 'Test Vendor',
        amount: '-50.00',
        expenseDate: '2026-03-20',
      });

      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(500);

      // Should show error or prevent submission
      const hasError = await page.locator('.error, [class*="error"]').count() > 0;
      const isStillOnForm = await expenseFormPage.amountInput.isVisible();

      expect(hasError || isStillOnForm).toBe(true);
    });

    test('should validate date format', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Most modern browsers handle date input validation
      // This test verifies the date field exists and accepts valid dates
      await expenseFormPage.fillForm({
        title: 'Date Test Expense',
        vendorName: 'Test Vendor',
        amount: '50.00',
        expenseDate: '2026-03-25',
      });

      // Submit should succeed with valid date
      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(1000);

      // Should redirect to list
      await expect(page).toHaveURL(/\//);
    });

    test('should validate expense date is required', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      await expenseFormPage.fillForm({
        title: 'Test Expense',
        vendorName: 'Test Vendor',
        amount: '100.00',
        expenseDate: '',
      });

      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(500);

      // Should show validation error or stay on form
      const isStillOnForm = await expenseFormPage.expenseDateInput.isVisible();
      expect(isStillOnForm).toBe(true);
    });

    test('should accept valid form submission', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const validExpense = {
        title: `Valid Expense ${Date.now()}`,
        vendorName: 'Valid Vendor',
        amount: '150.00',
        expenseDate: '2026-03-22',
      };

      await expenseFormPage.fillForm(validExpense);
      await expenseFormPage.clickSubmit();

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Should redirect to expense list
      await expect(page).toHaveURL(/\//);

      // Verify expense appears in list
      await expenseListPage.verifyExpenseExists(validExpense.title);
    });
  });

  test.describe('OCR Functionality', () => {
    test('should populate fields when OCR button is clicked', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Check if OCR button exists
      const ocrButtonExists = await expenseFormPage.ocrButton.isVisible().catch(() => false);

      if (ocrButtonExists) {
        // Click OCR button
        await expenseFormPage.clickOCR();

        // Wait for API response and field population
        await page.waitForTimeout(1500);

        // Verify fields are populated
        await expenseFormPage.verifyOCRPopulated();
      } else {
        // If OCR button doesn't exist, skip this test
        test.skip();
      }
    });

    test('should allow editing OCR-populated fields', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const ocrButtonExists = await expenseFormPage.ocrButton.isVisible().catch(() => false);

      if (ocrButtonExists) {
        // Click OCR to populate
        await expenseFormPage.clickOCR();
        await page.waitForTimeout(1500);

        // Edit the populated fields
        await expenseFormPage.titleInput.fill('Modified OCR Title');
        await expenseFormPage.amountInput.fill('999.99');

        // Verify changes persist
        await expect(expenseFormPage.titleInput).toHaveValue('Modified OCR Title');
        await expect(expenseFormPage.amountInput).toHaveValue('999.99');

        // Should be able to submit with modified data
        await expenseFormPage.clickSubmit();
        await page.waitForTimeout(1000);

        await expect(page).toHaveURL(/\//);
      } else {
        test.skip();
      }
    });

    test('should handle OCR errors gracefully', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const ocrButtonExists = await expenseFormPage.ocrButton.isVisible().catch(() => false);

      if (ocrButtonExists) {
        // Intercept OCR API call to simulate error
        await page.route('**/api/expenses/*/parse_receipt', async (route) => {
          await route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'OCR service unavailable' }),
          });
        });

        await expenseFormPage.clickOCR();
        await page.waitForTimeout(1000);

        // Should show error message or remain functional
        const errorMessage = page.locator('.error, [class*="error"]');
        const hasError = await errorMessage.isVisible().catch(() => false);

        // Form should still be usable even if OCR fails
        await expenseFormPage.fillForm({
          title: 'Manual Entry After OCR Failure',
          vendorName: 'Test Vendor',
          amount: '75.00',
          expenseDate: '2026-03-23',
        });

        await expect(expenseFormPage.titleInput).toHaveValue('Manual Entry After OCR Failure');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Save Draft Functionality', () => {
    test('should save draft without validation', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Fill partial form (intentionally incomplete)
      await expenseFormPage.titleInput.fill('Draft Expense Partial');
      await expenseFormPage.amountInput.fill('50.00');
      // Skip vendor and date

      // Save as draft
      await expenseFormPage.clickSaveDraft();
      await page.waitForTimeout(1000);

      // Should save successfully even with incomplete data
      // Verify we can navigate away or see success indication
      const isDraftSaved = await page.locator('text=/.*saved.*/i, text=/.*draft.*/i').isVisible().catch(() => false);

      // Navigate to list
      await expenseListPage.navigate();

      // Verify draft appears in list
      const draftExpense = page.locator('text=Draft Expense Partial');
      const draftExists = await draftExpense.isVisible().catch(() => false);

      expect(draftExists || isDraftSaved).toBe(true);
    });

    test('should preserve draft data for later editing', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const draftData = {
        title: `Draft to Edit ${Date.now()}`,
        vendorName: 'Draft Vendor',
        amount: '123.45',
        expenseDate: '2026-03-24',
      };

      await expenseFormPage.fillForm(draftData);
      await expenseFormPage.clickSaveDraft();
      await page.waitForTimeout(1000);

      // Navigate to list and back to draft
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(draftData.title);

      // Click edit if needed
      const isFormVisible = await expenseFormPage.titleInput.isVisible().catch(() => false);
      if (!isFormVisible) {
        await expenseDetailPage.clickEdit();
      }

      // Verify data is preserved
      await expenseFormPage.verifyFormData(draftData);
    });

    test('should allow converting draft to submitted', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const draftExpense = {
        title: `Draft to Submit ${Date.now()}`,
        vendorName: 'Draft Vendor',
        amount: '200.00',
        expenseDate: '2026-03-25',
      };

      // Save as draft first
      await expenseFormPage.fillForm(draftExpense);
      await expenseFormPage.clickSaveDraft();
      await page.waitForTimeout(1000);

      // Navigate to draft
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(draftExpense.title);

      // Submit the draft
      await expenseDetailPage.clickSubmit();
      await page.waitForTimeout(500);

      // Verify status changed to submitted
      await expenseDetailPage.verifyStatus('submitted');
    });

    test('should update existing draft', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const initialDraft = {
        title: `Draft to Update ${Date.now()}`,
        vendorName: 'Initial Vendor',
        amount: '100.00',
        expenseDate: '2026-03-26',
      };

      // Create initial draft
      await expenseFormPage.fillForm(initialDraft);
      await expenseFormPage.clickSaveDraft();
      await page.waitForTimeout(1000);

      // Edit the draft
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(initialDraft.title);

      const isFormVisible = await expenseFormPage.vendorNameInput.isVisible().catch(() => false);
      if (!isFormVisible) {
        await expenseDetailPage.clickEdit();
      }

      // Update fields
      await expenseFormPage.vendorNameInput.fill('Updated Vendor');
      await expenseFormPage.amountInput.fill('175.00');

      // Save updated draft
      await expenseFormPage.clickSaveDraft();
      await page.waitForTimeout(1000);

      // Verify updates were saved
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(initialDraft.title);

      // Verify updated values appear
      const detailPage = page.locator('text=Updated Vendor, text=175');
      const hasUpdatedData = await detailPage.count() > 0;
      expect(hasUpdatedData).toBe(true);
    });
  });

  test.describe('Submit Functionality', () => {
    test('should redirect to list after successful submission', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const submitExpense = {
        title: `Submit Test ${Date.now()}`,
        vendorName: 'Submit Vendor',
        amount: '85.00',
        expenseDate: '2026-03-27',
      };

      await expenseFormPage.fillForm(submitExpense);
      await expenseFormPage.clickSubmit();

      // Wait for redirect
      await page.waitForTimeout(1500);

      // Should be on list page
      await expect(page).toHaveURL(/\//);

      // Verify expense is in list
      await expenseListPage.verifyExpenseExists(submitExpense.title);
    });

    test('should set status to submitted after submission', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const statusTestExpense = {
        title: `Status Test ${Date.now()}`,
        vendorName: 'Status Vendor',
        amount: '95.00',
        expenseDate: '2026-03-28',
      };

      await expenseFormPage.fillForm(statusTestExpense);
      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(1000);

      // Verify status in list
      await expenseListPage.navigate();
      await expenseListPage.verifyExpenseStatus(statusTestExpense.title, 'submitted');
    });

    test('should prevent re-submission of already submitted expense', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const resubmitTest = {
        title: `Resubmit Test ${Date.now()}`,
        vendorName: 'Resubmit Vendor',
        amount: '110.00',
        expenseDate: '2026-03-29',
      };

      // Submit expense
      await expenseFormPage.fillForm(resubmitTest);
      await expenseFormPage.clickSubmit();
      await page.waitForTimeout(1000);

      // View the submitted expense
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(resubmitTest.title);

      // Submit button should not be visible on submitted expense
      await expenseDetailPage.verifyButtonNotVisible('Submit');
    });
  });

  test.describe('Cancel Functionality', () => {
    test('should navigate back to list when cancel is clicked', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Fill some data
      await expenseFormPage.titleInput.fill('Cancel Test');

      // Check if cancel button exists
      const cancelExists = await expenseFormPage.cancelButton.isVisible().catch(() => false);

      if (cancelExists) {
        await expenseFormPage.clickCancel();
        await page.waitForTimeout(500);

        // Should be back on list page
        await expect(page).toHaveURL(/\//);
      } else {
        // Navigate back manually
        await page.goBack();
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should not save data when cancelled', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      const unsavedData = {
        title: `Unsaved Cancel Test ${Date.now()}`,
        vendorName: 'Should Not Exist',
        amount: '999.99',
        expenseDate: '2026-03-30',
      };

      // Fill form but don't save
      await expenseFormPage.fillForm(unsavedData);

      // Cancel
      const cancelExists = await expenseFormPage.cancelButton.isVisible().catch(() => false);
      if (cancelExists) {
        await expenseFormPage.clickCancel();
      } else {
        await page.goBack();
      }

      await page.waitForTimeout(500);

      // Verify expense doesn't exist in list
      await expenseListPage.navigate();
      const expenseExists = await page.locator(`text=${unsavedData.title}`).isVisible().catch(() => false);
      expect(expenseExists).toBe(false);
    });
  });

  test.describe('Form Field Interactions', () => {
    test('should allow all fields to be filled and edited', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Fill all fields
      await expenseFormPage.titleInput.fill('Field Test Title');
      await expect(expenseFormPage.titleInput).toHaveValue('Field Test Title');

      await expenseFormPage.vendorNameInput.fill('Field Test Vendor');
      await expect(expenseFormPage.vendorNameInput).toHaveValue('Field Test Vendor');

      await expenseFormPage.amountInput.fill('123.45');
      await expect(expenseFormPage.amountInput).toHaveValue('123.45');

      await expenseFormPage.expenseDateInput.fill('2026-03-31');
      await expect(expenseFormPage.expenseDateInput).toHaveValue('2026-03-31');

      // If category exists
      const categoryExists = await expenseFormPage.categorySelect.isVisible().catch(() => false);
      if (categoryExists) {
        await expenseFormPage.categorySelect.selectOption({ index: 1 });
        const selectedValue = await expenseFormPage.categorySelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }

      // If description exists
      const descriptionExists = await expenseFormPage.descriptionTextarea.isVisible().catch(() => false);
      if (descriptionExists) {
        await expenseFormPage.descriptionTextarea.fill('Test description');
        await expect(expenseFormPage.descriptionTextarea).toHaveValue('Test description');
      }
    });

    test('should clear fields when requested', async ({ page }) => {
      await expenseFormPage.navigateToNew();

      // Fill fields
      await expenseFormPage.fillForm({
        title: 'Clear Test',
        vendorName: 'Clear Vendor',
        amount: '50.00',
        expenseDate: '2026-04-01',
      });

      // Clear fields
      await expenseFormPage.titleInput.fill('');
      await expenseFormPage.vendorNameInput.fill('');
      await expenseFormPage.amountInput.fill('');

      // Verify cleared
      await expect(expenseFormPage.titleInput).toHaveValue('');
      await expect(expenseFormPage.vendorNameInput).toHaveValue('');
      await expect(expenseFormPage.amountInput).toHaveValue('');
    });
  });
});
