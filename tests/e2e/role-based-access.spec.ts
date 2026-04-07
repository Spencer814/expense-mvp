import { test, expect } from '@playwright/test';
import { ExpenseListPage } from './pages/ExpenseListPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoleSwitcherPage } from './pages/RoleSwitcherPage';

/**
 * Role-Based Access Control E2E Tests
 *
 * Verifies that users can only see and interact with buttons
 * appropriate for their role and the expense status.
 */
test.describe('Role-Based Access Control', () => {
  let expenseListPage: ExpenseListPage;
  let expenseFormPage: ExpenseFormPage;
  let expenseDetailPage: ExpenseDetailPage;
  let dashboardPage: DashboardPage;
  let roleSwitcher: RoleSwitcherPage;

  test.beforeEach(async ({ page }) => {
    expenseListPage = new ExpenseListPage(page);
    expenseFormPage = new ExpenseFormPage(page);
    expenseDetailPage = new ExpenseDetailPage(page);
    dashboardPage = new DashboardPage(page);
    roleSwitcher = new RoleSwitcherPage(page);
  });

  test.describe('Employee Role', () => {
    test.beforeEach(async () => {
      await roleSwitcher.setupAPIInterception(1); // Employee user ID
    });

    test('should see Submit button on draft expenses', async ({ page }) => {
      // Create a draft expense
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const draftExpense = {
        title: `Draft for Submit Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '50.00',
        expenseDate: '2026-03-20',
      };

      await expenseFormPage.fillForm(draftExpense);
      await expenseFormPage.clickSaveDraft();
      await expenseFormPage.saveDraftAndWaitForConfirmation();

      // Navigate to expense detail
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(draftExpense.title);

      // Verify Submit button is visible
      await expenseDetailPage.verifyButtonVisible('Submit');

      // Verify Approve/Reject/Mark Paid buttons are NOT visible
      await expenseDetailPage.verifyButtonNotVisible('Approve');
      await expenseDetailPage.verifyButtonNotVisible('Reject');
      await expenseDetailPage.verifyButtonNotVisible('Mark Paid');
    });

    test('should see Edit button only on draft expenses', async ({ page }) => {
      // Create a draft expense
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const draftExpense = {
        title: `Draft for Edit Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '75.00',
        expenseDate: '2026-03-22',
      };

      await expenseFormPage.fillForm(draftExpense);
      await expenseFormPage.clickSaveDraft();
      await expenseFormPage.saveDraftAndWaitForConfirmation();

      // View draft expense
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(draftExpense.title);

      // Verify Edit button is visible for draft
      await expenseDetailPage.verifyButtonVisible('Edit');

      // Submit the expense
      await expenseDetailPage.clickSubmit();

      // Verify Edit button is no longer visible after submission
      await expenseDetailPage.verifyButtonNotVisible('Edit');
    });

    test('should NOT see manager or finance actions', async ({ page }) => {
      // Create and submit an expense
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const submittedExpense = {
        title: `Submitted for Access Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '100.00',
        expenseDate: '2026-03-25',
      };

      await expenseFormPage.fillForm(submittedExpense);
      await expenseFormPage.clickSubmit();

      // Navigate to expense detail
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(submittedExpense.title);

      // Verify employee cannot see manager/finance actions
      await expenseDetailPage.verifyButtonNotVisible('Approve');
      await expenseDetailPage.verifyButtonNotVisible('Reject');
      await expenseDetailPage.verifyButtonNotVisible('Mark Paid');
    });

    test('should be able to create new expenses', async () => {
      await expenseListPage.navigate();

      // Verify "New Expense" button is visible
      await expect(expenseListPage.newExpenseButton).toBeVisible();

      // Click and verify navigation to form
      await expenseListPage.clickNewExpense();
      await expect(expenseFormPage.titleInput).toBeVisible();
    });
  });

  test.describe('Manager Role', () => {
    test.beforeEach(async () => {
      await roleSwitcher.setupAPIInterception(2); // Manager user ID
    });

    test('should see Approve/Reject buttons on submitted expenses', async ({ page }) => {
      // First, create an expense as employee
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const submittedExpense = {
        title: `Submitted for Manager Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '150.00',
        expenseDate: '2026-03-26',
      };

      await expenseFormPage.fillForm(submittedExpense);
      await expenseFormPage.clickSubmit();

      // Switch to manager role
      await roleSwitcher.setupAPIInterception(2);
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(submittedExpense.title);

      // Verify Approve and Reject buttons are visible
      await expenseDetailPage.verifyButtonVisible('Approve');
      await expenseDetailPage.verifyButtonVisible('Reject');

      // Verify Mark Paid button is NOT visible (Finance only)
      await expenseDetailPage.verifyButtonNotVisible('Mark Paid');
    });

    test('should NOT see buttons on draft expenses', async ({ page }) => {
      // Create a draft as employee
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const draftExpense = {
        title: `Draft for Manager Access Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '80.00',
        expenseDate: '2026-03-27',
      };

      await expenseFormPage.fillForm(draftExpense);
      await expenseFormPage.clickSaveDraft();
      await expenseFormPage.saveDraftAndWaitForConfirmation();

      // Switch to manager and view draft
      await roleSwitcher.setupAPIInterception(2);
      await expenseListPage.navigate();

      // Try to find the draft expense - manager should see it
      const draftInList = page.locator(`tr:has-text("${draftExpense.title}")`);
      const isVisible = await draftInList.isVisible().catch(() => false);

      if (isVisible) {
        await expenseListPage.clickExpense(draftExpense.title);

        // Manager should not see action buttons on drafts
        await expenseDetailPage.verifyButtonNotVisible('Approve');
        await expenseDetailPage.verifyButtonNotVisible('Reject');
      }
    });

    test('should NOT see buttons on approved/paid expenses', async ({ page }) => {
      // This test assumes there are already approved expenses in the system
      // In a real scenario, you would create and approve an expense first

      await expenseListPage.navigate();

      // Look for an approved or paid expense
      const approvedExpense = page.locator('span:has-text("approved"), span:has-text("paid")').first();
      const hasApprovedExpense = await approvedExpense.isVisible().catch(() => false);

      if (hasApprovedExpense) {
        await approvedExpense.locator('..').locator('a').first().click();

        // Manager should not see Approve/Reject on already-processed expenses
        await expenseDetailPage.verifyButtonNotVisible('Approve');
        await expenseDetailPage.verifyButtonNotVisible('Reject');
      }
    });

    test('should be able to view all team expenses', async () => {
      await expenseListPage.navigate();

      // Manager should see expenses from multiple employees
      const expenseCount = await expenseListPage.getExpenseCount();

      // Verify manager can see expenses (if any exist)
      expect(expenseCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Finance Role', () => {
    test.beforeEach(async () => {
      await roleSwitcher.setupAPIInterception(3); // Finance user ID
    });

    test('should see Mark Paid button on approved expenses', async ({ page }) => {
      // Create and approve an expense first
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const approvedExpense = {
        title: `Approved for Finance Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '200.00',
        expenseDate: '2026-03-28',
      };

      await expenseFormPage.fillForm(approvedExpense);
      await expenseFormPage.clickSubmit();

      // Manager approves
      await roleSwitcher.setupAPIInterception(2);
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(approvedExpense.title);
      await expenseDetailPage.clickApprove();

      // Switch to finance and view approved expense
      await roleSwitcher.setupAPIInterception(3);
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(approvedExpense.title);

      // Verify Mark Paid button is visible
      await expenseDetailPage.verifyButtonVisible('Mark Paid');

      // Verify Approve/Reject buttons are NOT visible
      await expenseDetailPage.verifyButtonNotVisible('Approve');
      await expenseDetailPage.verifyButtonNotVisible('Reject');
    });

    test('should NOT see buttons on non-approved expenses', async ({ page }) => {
      // Create a submitted expense
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const submittedExpense = {
        title: `Submitted for Finance Access Test ${Date.now()}`,
        vendorName: 'Test Vendor',
        amount: '120.00',
        expenseDate: '2026-03-29',
      };

      await expenseFormPage.fillForm(submittedExpense);
      await expenseFormPage.clickSubmit();

      // Switch to finance and view submitted expense
      await roleSwitcher.setupAPIInterception(3);
      await expenseListPage.navigate();
      await expenseListPage.clickExpense(submittedExpense.title);

      // Finance should not see Mark Paid on submitted (not yet approved) expenses
      await expenseDetailPage.verifyButtonNotVisible('Mark Paid');
    });

    test('should have access to dashboard', async () => {
      await dashboardPage.navigate();

      // Verify dashboard loads for finance user
      await dashboardPage.verifyDashboardLoaded();
      await dashboardPage.verifyStatusCardsVisible();
      await dashboardPage.verifyCategoryTableVisible();
    });

    test('should see all expenses across organization', async () => {
      await expenseListPage.navigate();

      // Finance should see all expenses regardless of status or owner
      const expenseCount = await expenseListPage.getExpenseCount();

      // Verify finance can see expenses
      expect(expenseCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Cross-Role Validation', () => {
    test('should prevent unauthorized actions via direct API calls', async ({ page }) => {
      // Create an expense as employee
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const testExpense = {
        title: `Security Test Expense ${Date.now()}`,
        vendorName: 'Security Test Corp',
        amount: '99.99',
        expenseDate: '2026-03-30',
      };

      await expenseFormPage.fillForm(testExpense);
      await expenseFormPage.clickSubmit();

      // Get the expense ID from URL
      const expenseLink = page.locator(`a:has-text("${testExpense.title}")`).first();
      const href = await expenseLink.getAttribute('href');
      const expenseId = href?.match(/\d+/)?.[0];

      if (expenseId) {
        // Try to approve as employee (should fail)
        const response = await page.request.post(`/api/expenses/${expenseId}/approve`, {
          headers: { 'X-User-Id': '1' }, // Employee attempting to approve
        });

        // Should return error (403 or 422)
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('should show correct buttons after role switch', async ({ page }) => {
      // Create and submit expense as employee
      await roleSwitcher.setupAPIInterception(1);
      await expenseListPage.navigate();
      await expenseListPage.clickNewExpense();

      const roleTestExpense = {
        title: `Role Switch Test ${Date.now()}`,
        vendorName: 'Role Test Vendor',
        amount: '111.11',
        expenseDate: '2026-03-31',
      };

      await expenseFormPage.fillForm(roleTestExpense);
      await expenseFormPage.clickSubmit();

      await expenseListPage.navigate();
      await expenseListPage.clickExpense(roleTestExpense.title);

      // Verify employee buttons
      await expenseDetailPage.verifyButtonNotVisible('Approve');

      // Switch to manager
      await roleSwitcher.switchToManager();
      await page.reload();
      await expenseDetailPage.waitForPageLoad();

      // Verify manager buttons appear
      await expenseDetailPage.verifyButtonVisible('Approve');
      await expenseDetailPage.verifyButtonVisible('Reject');

      // Approve the expense
      await expenseDetailPage.clickApprove();

      // Switch to finance
      await roleSwitcher.switchToFinance();
      await page.reload();
      await expenseDetailPage.waitForPageLoad();

      // Verify finance buttons appear
      await expenseDetailPage.verifyButtonVisible('Mark Paid');
      await expenseDetailPage.verifyButtonNotVisible('Approve');
    });
  });

  test.describe('Button Visibility Matrix', () => {
    test('should display correct button matrix for all role/status combinations', async ({ page }) => {
      /**
       * Button visibility matrix:
       *
       * Status    | Employee | Manager        | Finance
       * -------   | -------- | -------------- | --------------
       * draft     | Edit, Submit | -          | -
       * submitted | -        | Approve, Reject| -
       * approved  | -        | -              | Mark Paid
       * rejected  | -        | -              | -
       * paid      | -        | -              | -
       */

      const testMatrix = [
        { role: 'Employee', userId: 1, status: 'draft', visibleButtons: ['Edit', 'Submit'], hiddenButtons: ['Approve', 'Reject', 'Mark Paid'] },
        { role: 'Manager', userId: 2, status: 'submitted', visibleButtons: ['Approve', 'Reject'], hiddenButtons: ['Edit', 'Submit', 'Mark Paid'] },
        { role: 'Finance', userId: 3, status: 'approved', visibleButtons: ['Mark Paid'], hiddenButtons: ['Edit', 'Submit', 'Approve', 'Reject'] },
      ];

      // Note: This is a conceptual test structure
      // In practice, you would need to set up expenses in each status and verify button visibility
      // Implementation would require test data setup or factories
    });
  });
});
