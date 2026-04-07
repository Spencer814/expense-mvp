# Expense MVP - Playwright E2E Tests

Comprehensive end-to-end test suite for the Expense Approval MVP using Playwright.

## Overview

This test suite covers:
- Complete expense workflow (create → submit → approve → paid)
- Role-based access control for Employee, Manager, and Finance roles
- Form validation and data entry
- OCR functionality
- Dashboard metrics and visualizations
- Real-time data updates

## Project Structure

```
tests/e2e/
├── pages/                      # Page Object Models
│   ├── BasePage.ts            # Base page with common functionality
│   ├── ExpenseListPage.ts     # Expense list page
│   ├── ExpenseFormPage.ts     # Expense form (create/edit)
│   ├── ExpenseDetailPage.ts   # Expense detail page
│   ├── DashboardPage.ts       # Finance dashboard
│   └── RoleSwitcherPage.ts    # Role switching utilities
├── expense-workflow.spec.ts    # Full workflow tests
├── role-based-access.spec.ts  # RBAC tests
├── expense-form.spec.ts       # Form validation tests
├── dashboard.spec.ts          # Dashboard tests
├── playwright.config.ts       # Playwright configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Prerequisites

- Node.js 18 or higher
- Backend server running on port 3000
- Frontend server running on port 5173
- Database seeded with test data

## Installation

### 1. Install Dependencies

```bash
cd tests/e2e
npm install
```

### 2. Install Playwright Browsers

```bash
npm run install-browsers
```

Or install all dependencies including system libraries:

```bash
npm run install-deps
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with UI Mode (Recommended for Development)

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- See all tests
- Run individual tests
- Watch tests run in real-time
- Debug failures
- View traces

### Run Specific Test Suites

```bash
# Workflow tests
npm run test:workflow

# Role-based access tests
npm run test:roles

# Form validation tests
npm run test:form

# Dashboard tests
npm run test:dashboard
```

### Run Tests in Headed Mode

```bash
npm run test:headed
```

### Debug Tests

```bash
npm run test:debug
```

This opens Playwright Inspector for step-by-step debugging.

### Run Tests in Parallel

```bash
npm run test:parallel
```

### Run Tests Serially

```bash
npm run test:serial
```

## Test Reports

### View HTML Report

After running tests, view the HTML report:

```bash
npm run report
```

This opens an interactive report with:
- Test results
- Screenshots of failures
- Video recordings
- Detailed traces

### CI/CD Reports

For CI/CD, generate JSON and HTML reports:

```bash
npm run test:ci
```

Reports are saved in `test-results/` directory.

## Configuration

### Base URL

Tests run against `http://localhost:5173` by default. To change this, edit `playwright.config.ts`:

```typescript
use: {
  baseURL: 'http://your-url:port',
}
```

### Timeouts

- Global timeout: 30 seconds per test
- Action timeout: 10 seconds
- Navigation timeout: 15 seconds

Adjust in `playwright.config.ts` if needed.

### Browsers

Tests run on Chromium by default. To add more browsers, uncomment in `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

## Page Object Pattern

Tests use the Page Object Model for maintainability:

### Example Usage

```typescript
import { ExpenseListPage } from './pages/ExpenseListPage';
import { ExpenseFormPage } from './pages/ExpenseFormPage';

test('create expense', async ({ page }) => {
  const listPage = new ExpenseListPage(page);
  const formPage = new ExpenseFormPage(page);

  await listPage.navigate();
  await listPage.clickNewExpense();

  await formPage.fillForm({
    title: 'My Expense',
    vendorName: 'Vendor',
    amount: '100.00',
    expenseDate: '2026-03-20',
  });

  await formPage.clickSubmit();
});
```

### Available Page Objects

- **BasePage**: Common functionality (navigation, waiting, screenshots)
- **ExpenseListPage**: List view operations (viewing, filtering expenses)
- **ExpenseFormPage**: Form operations (filling, validation, submission)
- **ExpenseDetailPage**: Detail view operations (approve, reject, mark paid)
- **DashboardPage**: Dashboard metrics and visualizations
- **RoleSwitcherPage**: Role switching utilities

## Role Switching

Tests simulate different user roles using the `X-User-Id` header:

```typescript
import { RoleSwitcherPage } from './pages/RoleSwitcherPage';

const roleSwitcher = new RoleSwitcherPage(page);

// Switch to Employee (User ID: 1)
await roleSwitcher.setupAPIInterception(1);

// Switch to Manager (User ID: 2)
await roleSwitcher.setupAPIInterception(2);

// Switch to Finance (User ID: 3)
await roleSwitcher.setupAPIInterception(3);

// Or use helper methods
await roleSwitcher.switchToEmployee();
await roleSwitcher.switchToManager();
await roleSwitcher.switchToFinance();
```

## Test Data

Tests create their own test data dynamically using timestamps:

```typescript
const testExpense = {
  title: `Test Expense ${Date.now()}`,
  vendorName: 'Test Vendor',
  amount: '100.00',
  expenseDate: '2026-03-20',
};
```

This prevents test conflicts and allows parallel execution.

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { ExpenseListPage } from './pages/ExpenseListPage';

test.describe('Feature Name', () => {
  let listPage: ExpenseListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new ExpenseListPage(page);
  });

  test('should do something', async () => {
    await listPage.navigate();
    // Test logic here
  });
});
```

### Using Test Steps

```typescript
test('complex workflow', async ({ page }) => {
  test.step('Create expense', async () => {
    // Step logic
  });

  test.step('Submit expense', async () => {
    // Step logic
  });

  test.step('Verify results', async () => {
    // Step logic
  });
});
```

### Assertions

```typescript
// Element visibility
await expect(page.locator('.button')).toBeVisible();

// Text content
await expect(page.locator('.title')).toHaveText('Expected Text');

// URL
await expect(page).toHaveURL(/expenses/);

// Count
const count = await page.locator('.item').count();
expect(count).toBeGreaterThan(0);
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd tests/e2e
          npm install
          npx playwright install --with-deps

      - name: Start servers
        run: |
          cd backend && rails server &
          cd frontend && npm run dev &
          sleep 10

      - name: Run tests
        run: |
          cd tests/e2e
          npm run test:ci

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: tests/e2e/test-results/
```

### GitLab CI

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.42.1
  script:
    - cd tests/e2e
    - npm install
    - npm run test:ci
  artifacts:
    when: always
    paths:
      - tests/e2e/test-results/
    reports:
      junit: tests/e2e/test-results/results.xml
```

## Troubleshooting

### Tests Fail with "Page not found"

Ensure backend and frontend servers are running:

```bash
# Terminal 1 - Backend
cd backend
rails server

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Tests
cd tests/e2e
npm test
```

### Tests Timeout

Increase timeouts in `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 seconds
```

### Browser Not Found

Install browsers:

```bash
npm run install-browsers
```

### Screenshots/Videos Not Saved

Check `playwright.config.ts` settings:

```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Tests Fail in CI but Pass Locally

- Ensure servers are fully started before running tests
- Use `--workers=1` for serial execution in CI
- Check for timing issues (add appropriate waits)

### Port Already in Use

Change ports in `playwright.config.ts`:

```typescript
webServer: [
  {
    command: 'cd ../../backend && rails server -p 3001',
    port: 3001,
  },
  {
    command: 'cd ../../frontend && npm run dev -- --port 5174',
    port: 5174,
  },
]
```

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions for reusability
2. **Unique Test Data**: Use timestamps to avoid test conflicts
3. **Explicit Waits**: Use `waitForSelector` instead of fixed timeouts when possible
4. **Test Independence**: Each test should be independent and not rely on others
5. **Clean Up**: Tests create data but don't clean up (MVP scope)
6. **Descriptive Names**: Use clear, descriptive test names
7. **Test Organization**: Group related tests using `test.describe`
8. **Error Messages**: Add helpful error messages to assertions

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Debugging Tests](https://playwright.dev/docs/debug)

## Support

For issues or questions:
1. Check this README
2. Review Playwright documentation
3. Examine test output and traces
4. Open an issue in the project repository

## License

MIT
