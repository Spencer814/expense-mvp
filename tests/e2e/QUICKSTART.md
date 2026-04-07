# Quick Start Guide

Get up and running with E2E tests in 5 minutes.

## Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check if backend is running
curl http://localhost:3000/api/expenses

# Check if frontend is running
curl http://localhost:5173
```

## Installation (One Time)

```bash
cd tests/e2e
npm install
npm run install-browsers
```

## Run Tests

### Option 1: UI Mode (Recommended)

```bash
npm run test:ui
```

Then:
1. Click on any test to run it
2. Watch it execute in real-time
3. Debug failures with trace viewer

### Option 2: Headless Mode

```bash
npm test
```

### Option 3: Headed Mode (Watch Browser)

```bash
npm run test:headed
```

## View Results

```bash
npm run report
```

## Common Commands

```bash
# Run specific test file
npm run test:workflow

# Run single test
npx playwright test -g "should complete full expense workflow"

# Debug mode
npm run test:debug

# Generate test code
npm run codegen
```

## Troubleshooting

### Tests fail immediately

Check if servers are running:
```bash
# Terminal 1
cd backend && rails server

# Terminal 2
cd frontend && npm run dev

# Terminal 3
cd tests/e2e && npm test
```

### "Browser not found" error

```bash
npm run install-browsers
```

### All tests timeout

Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 seconds
```

## Next Steps

1. Read [README.md](./README.md) for comprehensive documentation
2. Explore page objects in `pages/` directory
3. Write your own tests using existing patterns
4. Check test reports in `test-results/` directory

## Test Coverage

- ✅ Complete expense workflow (create → paid)
- ✅ Role-based access control (3 roles)
- ✅ Form validation (all fields)
- ✅ OCR functionality
- ✅ Dashboard metrics
- ✅ Real-time updates

Total: **50+ test cases** covering critical user flows.
