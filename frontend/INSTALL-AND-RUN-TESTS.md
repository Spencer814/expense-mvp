# Install and Run Tests - Quick Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

Check your Node version:
```bash
node --version  # Should be 18.x or higher
```

## Installation Steps

### Step 1: Navigate to Frontend Directory
```bash
cd /Users/andre.newman/source/repos/GitHub/expense-mvp/frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all dependencies including:
- React and React DOM
- React Router DOM
- Vitest and testing libraries
- TypeScript
- All test utilities

**Expected output**: You should see npm installing packages, taking 1-2 minutes.

### Step 3: Verify Installation
```bash
npm list vitest
npm list @testing-library/react
```

Both commands should show the installed versions without errors.

## Running Tests

### Option 1: Watch Mode (Recommended for Development)
```bash
npm test
```

- Tests run automatically when files change
- Fast feedback loop
- Press 'a' to run all tests
- Press 'q' to quit

### Option 2: Single Run with Coverage
```bash
npm run test:coverage
```

- Runs all tests once
- Generates coverage report
- Creates `coverage/` directory
- Shows coverage percentages in terminal

### Option 3: Interactive UI Mode
```bash
npm run test:ui
```

- Opens a browser-based UI
- Visual test explorer
- Click to run individual tests
- Shows test output in real-time

## Expected Results

When you run `npm test`, you should see:

```
✓ src/components/ExpenseList.test.tsx (42 tests)
✓ src/components/ExpenseForm.test.tsx (63 tests)
✓ src/services/api.test.ts (51 tests)
✓ src/hooks/useCurrentUser.test.ts (32 tests)

Test Files  4 passed (4)
     Tests  188 passed (188)
  Start at  [timestamp]
  Duration  [time]
```

## Viewing Coverage Report

After running `npm run test:coverage`:

1. Open the HTML report:
   ```bash
   open coverage/index.html
   # or on Linux:
   xdg-open coverage/index.html
   # or manually open in browser:
   # coverage/index.html
   ```

2. Navigate through the interactive report to see:
   - Overall coverage percentages
   - Line-by-line coverage
   - Uncovered branches
   - Untested functions

## Troubleshooting

### Issue: "Cannot find module 'vitest'"
**Solution**: Run `npm install` again

### Issue: "jsdom is not defined"
**Solution**: Ensure vitest.config.ts exists and jsdom is installed

### Issue: Tests fail with router errors
**Solution**: This is expected if using components directly. Tests wrap components with BrowserRouter.

### Issue: localStorage errors
**Solution**: setupTests.ts should mock localStorage. Verify it's being loaded.

### Issue: All tests fail
**Solution**:
1. Delete node_modules: `rm -rf node_modules`
2. Delete package-lock.json: `rm package-lock.json`
3. Reinstall: `npm install`
4. Run tests: `npm test`

### Issue: Slow test execution
**Solution**: Tests should run in < 10 seconds. If slower:
- Close other applications
- Check CPU usage
- Ensure SSD storage
- Try: `npm test -- --no-threads`

## Test File Locations

```
frontend/
├── package.json                           # Dependencies and scripts
├── vitest.config.ts                       # Vitest configuration
├── src/
│   ├── setupTests.ts                      # Global test setup
│   ├── components/
│   │   ├── ExpenseList.tsx               # Component
│   │   ├── ExpenseList.test.tsx          # ✓ Tests (42 cases)
│   │   ├── ExpenseForm.tsx               # Component
│   │   └── ExpenseForm.test.tsx          # ✓ Tests (63 cases)
│   ├── services/
│   │   ├── api.ts                        # Service
│   │   └── api.test.ts                   # ✓ Tests (51 cases)
│   └── hooks/
│       ├── useCurrentUser.ts             # Hook
│       └── useCurrentUser.test.ts        # ✓ Tests (32 cases)
└── coverage/                              # Generated after coverage run
    └── index.html                         # Coverage report
```

## Common Test Commands

```bash
# Run all tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- ExpenseList.test.tsx

# Run tests matching a pattern
npm test -- -t "should render"

# Update snapshots (if using snapshots in future)
npm test -- -u

# Run tests in specific file with watch
npm test -- ExpenseForm.test.tsx --watch

# Run with verbose output
npm test -- --reporter=verbose

# Run with minimal output
npm test -- --reporter=basic
```

## What Gets Tested

### ✅ ExpenseList Component
- Loading spinner
- Error states with retry
- Empty state
- Expense table with formatted data
- Status badges with colors
- Navigation links
- API calls

### ✅ ExpenseForm Component
- All form fields
- User input handling
- Validation for required fields
- Save Draft functionality
- Submit workflow
- OCR/Parse Receipt
- Error handling
- Loading states

### ✅ API Service
- User ID management
- HTTP headers (X-User-Id)
- All CRUD operations
- Workflow actions (submit, approve, pay)
- Error handling
- Response parsing

### ✅ useCurrentUser Hook
- localStorage persistence
- User state management
- Error handling
- State across re-renders

## Performance Benchmarks

On a typical development machine:
- **Install time**: 1-2 minutes
- **Test execution**: 3-8 seconds
- **Coverage generation**: 5-10 seconds
- **Test UI startup**: 2-3 seconds

## CI/CD Integration (Future)

To add to GitHub Actions or similar:

```yaml
- name: Install dependencies
  run: cd frontend && npm install

- name: Run tests
  run: cd frontend && npm test -- --run

- name: Generate coverage
  run: cd frontend && npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./frontend/coverage
```

## Next Steps After Installation

1. ✅ Run `npm install`
2. ✅ Run `npm test` to verify all tests pass
3. ✅ Run `npm run test:coverage` to see coverage
4. ✅ Open coverage report in browser
5. 📖 Read TESTING.md for detailed documentation
6. 🔧 Add tests when creating new components
7. 🚀 Integrate into your development workflow

## Support

If you encounter issues not covered here:
1. Check Node.js version (must be 18+)
2. Review TESTING.md for detailed patterns
3. Check TEST-SUMMARY.md for statistics
4. Verify all test files exist
5. Try reinstalling dependencies

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed successfully
- [ ] `npm test` shows 188 passing tests
- [ ] Coverage report generates without errors
- [ ] All 4 test files run successfully
- [ ] Coverage is above 80%

When all items are checked, your test suite is ready! 🎉
