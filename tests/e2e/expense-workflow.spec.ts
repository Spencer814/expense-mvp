import { test, expect } from '@playwright/test';
import { ExpenseListPage } from './pages/ExpenseListPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoleSwitcherPage } from './pages/RoleSwitcherPage';

/**
 * Complete Expense Workflow E2E Test
 *
 * Tests the full lifecycle of an expense:
 * 1. Employee creates and submits expense
 * 2. Manager approves expense
 * 3. Finance marks expense as paid
 * 4. Dashboard reflects all changes
 */
test.describe('Expense Workflow', () => {
  let expenseListPage: ExpenseListPage;
  let expenseFormPage: ExpenseFormPage;
  let expenseDetailPage: ExpenseDetailPage;
  let dashboardPage: DashboardPage;
  let roleSwitcher: RoleSwitcherPage;

  const testExpense = {
    title: `Test Expense ${Date.now()}`,
    vendorName: 'Acme Corp',
    amount: '125.50',
    expenseDate: '2026-03-15',
    category: 'Travel',
    description: 'Business trip to client site',
  };

  test.beforeEach(async ({ page }) => {
    expenseListPage = new ExpenseListPage(page);
    expenseFormPage = new ExpenseFormPage(page);
    expenseDetailPage = new ExpenseDetailPage(page);
    dashboardPage = new DashboardPage(page);
    roleSwitcher = new RoleSwitcherPage(page);

    // Setup API interception for Employee role (User ID: 1)
    await roleSwitcher.setupAPIInterception(1);
  });

  test('should complete full expense workflow from creation to payment', async ({ page }) => {
    // ===== STEP 1: Employee Creates Expense =====
    test.step('Employee creates new expense', async () => {
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      // Fill in expense form
      await expenseFormPage.fillForm(testExpense);

      // Save as draft first
      await expenseFormPage.clickSaveDraft();
      await expenseFormPage.saveDraftAndWaitForConfirmation();

      // Verify we're back on list page
      await expect(page).toHaveURL(/\//);
    });

    // ===== STEP 2: Employee Submits Expense =====
    test.step('Employee submits expense', async () => {
      await expenseListPage.navigate();

      // Find and click on the expense
      await expenseListPage.clickExpense(testExpense.title);

      // Submit the expense
      await expenseDetailPage.clickSubmit();

      // Verify status changed to submitted
      await expenseDetailPage.verifyStatus('submitted');
    });

    // ===== STEP 3: Manager Approves Expense =====
    test.step('Manager approves expense', async () => {
      // Switch to Manager role (User ID: 2)
      await roleSwitcher.setupAPIInterception(2);
      await expenseListPage.navigate();

      // Find and click on the submitted expense
      await expenseListPage.clickExpense(testExpense.title);

      // Verify approve button is visible
      await expenseDetailPage.verifyButtonVisible('Approve');

      // Approve the expense
      await expenseDetailPage.clickApprove();

      // Verify status changed to approved
      await expenseDetailPage.verifyStatus('approved');
    });

    // ===== STEP 4: Finance Marks as Paid =====
    test.step('Finance marks expense as paid', async () => {
      // Switch to Finance role (User ID: 3)
      await roleSwitcher.setupAPIInterception(3);
      await expenseListPage.navigate();

      // Find and click on the approved expense
      await expenseListPage.clickExpense(testExpense.title);

      // Verify mark paid button is visible
      await expenseDetailPage.verifyButtonVisible('Mark Paid');

      // Mark as paid
      await expenseDetailPage.clickMarkPaid();

      // Verify status changed to paid
      await expenseDetailPage.verifyStatus('paid');
    });

    // ===== STEP 5: Verify Dashboard Updates =====
    test.step('Verify dashboard reflects changes', async () => {
      // Navigate to dashboard (already as Finance user)
      await dashboardPage.navigate();

      // Verify dashboard loads
      await dashboardPage.verifyDashboardLoaded();

      // Verify status cards are visible
      await dashboardPage.verifyStatusCardsVisible();

      // Get paid expenses count - should include our new expense
      const paidCount = await dashboardPage.getStatusCount('paid');
      expect(paidCount).toBeGreaterThan(0);

      // Verify category table shows our expense
      if (testExpense.category) {
        await dashboardPage.verifyCategoryExists(testExpense.category);
      }
    });
  });

  test('should handle expense rejection by manager', async ({ page }) => {
    // ===== STEP 1: Employee Creates and Submits Expense =====
    test.step('Employee creates and submits expense', async () => {
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const rejectedExpense = {
        ...testExpense,
        title: `Rejected Expense ${Date.now()}`,
      };

      await expenseFormPage.fillForm(rejectedExpense);
      await expenseFormPage.clickSubmit();

      // Wait for redirect to list
      await page.waitForURL(/\//);
    });

    // ===== STEP 2: Manager Rejects Expense =====
    test.step('Manager rejects expense', async () => {
      // Switch to Manager role
      await roleSwitcher.setupAPIInterception(2);
      await page.reload();
      await expenseListPage.waitForPageLoad();

      // Find the submitted expense
      const submittedExpense = page.locator('tr:has-text("submitted")').first();
      await submittedExpense.locator('a').first().click();

      // Verify reject button is visible
      await expenseDetailPage.verifyButtonVisible('Reject');

      // Reject the expense
      await expenseDetailPage.clickReject();

      // Verify status changed to rejected
      await expenseDetailPage.verifyStatus('rejected');
    });

    // ===== STEP 3: Verify Rejected Expense in List =====
    test.step('Verify rejected expense appears in list', async () => {
      await expenseListPage.navigate();

      // Verify rejected status in list
      const rejectedExpenses = page.locator('span:has-text("rejected")');
      await expect(rejectedExpenses.first()).toBeVisible();
    });
  });

  test('should allow employee to edit draft expense', async ({ page }) => {
    // Create draft expense
    await expenseListPage.navigate();
    await expenseListPage.clickNewExpense();

    const draftExpense = {
      title: `Draft Expense ${Date.now()}`,
      vendorName: 'Initial Vendor',
      amount: '50.00',
      expenseDate: '2026-03-20',
    };

    await expenseFormPage.fillForm(draftExpense);
    await expenseFormPage.clickSaveDraft();
    await expenseFormPage.saveDraftAndWaitForConfirmation();

    // Navigate back to list and edit
    await expenseListPage.navigate();
    await expenseListPage.clickExpense(draftExpense.title);

    // Click edit button
    await expenseDetailPage.clickEdit();

    // Update expense
    await expenseFormPage.vendorNameInput.fill('Updated Vendor');
    await expenseFormPage.amountInput.fill('75.00');
    await expenseFormPage.clickSaveDraft();

    // Verify changes were saved
    await page.waitForTimeout(1000);
    await expenseFormPage.verifyFormData({
      vendorName: 'Updated Vendor',
      amount: '75.00',
    });
  });

  test('should prevent editing submitted expense', async ({ page }) => {
    // Create and submit expense
    await expenseListPage.navigate();
    await expenseListPage.clickNewExpense();

    const submittedExpense = {
      title: `Submitted Expense ${Date.now()}`,
      vendorName: 'Test Vendor',
      amount: '100.00',
      expenseDate: '2026-03-25',
    };

    await expenseFormPage.fillForm(submittedExpense);
    await expenseFormPage.clickSubmit();

    // Navigate to expense detail
    await expenseListPage.navigate();
    await expenseListPage.clickExpense(submittedExpense.title);

    // Verify edit button is not visible (or disabled)
    try {
      await expenseDetailPage.verifyButtonNotVisible('Edit');
    } catch {
      // Edit button might be visible but disabled - check that clicking it doesn't work
      const editButton = expenseDetailPage.editButton;
      const isDisabled = await editButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('should track expense history through workflow', async ({ page }) => {
    // This test verifies that the expense maintains its identity through all status changes
    const trackedExpense = {
      title: `Tracked Expense ${Date.now()}`,
      vendorName: 'Tracking Test Corp',
      amount: '200.00',
      expenseDate: '2026-03-28',
    };

    // Create expense
    await expenseListPage.navigate();
    await expenseListPage.clickNewExpense();
    await expenseFormPage.fillForm(trackedExpense);
    await expenseFormPage.clickSubmit();

    // Verify in list as submitted
    await expenseListPage.navigate();
    await expenseListPage.verifyExpenseStatus(trackedExpense.title, 'submitted');

    // Manager approves
    await roleSwitcher.setupAPIInterception(2);
    await expenseListPage.navigate();
    await expenseListPage.clickExpense(trackedExpense.title);
    await expenseDetailPage.clickApprove();

    // Verify in list as approved
    await expenseListPage.navigate();
    await expenseListPage.verifyExpenseStatus(trackedExpense.title, 'approved');

    // Finance marks paid
    await roleSwitcher.setupAPIInterception(3);
    await expenseListPage.navigate();
    await expenseListPage.clickExpense(trackedExpense.title);
    await expenseDetailPage.clickMarkPaid();

    // Verify in list as paid
    await expenseListPage.navigate();
    await expenseListPage.verifyExpenseStatus(trackedExpense.title, 'paid');

    // Verify expense details are unchanged
    await expenseListPage.clickExpense(trackedExpense.title);
    await expenseDetailPage.verifyField('Vendor', trackedExpense.vendorName);
    await expenseDetailPage.verifyField('Amount', trackedExpense.amount);
  });
});
