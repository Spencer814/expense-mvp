# Installation Guide

Step-by-step installation instructions for the Playwright E2E test suite.

## Step 1: Navigate to Test Directory

```bash
cd /Users/andre.newman/source/repos/GitHub/expense-mvp/tests/e2e
```

## Step 2: Install Node Dependencies

```bash
npm install
```

This will install:
- `@playwright/test` - Playwright testing framework
- `@types/node` - TypeScript Node types
- `typescript` - TypeScript compiler

## Step 3: Install Playwright Browsers

```bash
npx playwright install chromium
```

Or install all browsers:
```bash
npx playwright install
```

Or install with system dependencies:
```bash
npx playwright install --with-deps chromium
```

## Step 4: Verify Installation

```bash
npx playwright --version
```

Should output: `Version 1.42.1` (or similar)

## Step 5: Start Required Services

### Terminal 1: Backend Server

```bash
cd /Users/andre.newman/source/repos/GitHub/expense-mvp/backend
rails server
```

Backend will run on `http://localhost:3000`

### Terminal 2: Frontend Server

```bash
cd /Users/andre.newman/source/repos/GitHub/expense-mvp/frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 6: Run Tests

### Terminal 3: Test Execution

```bash
cd /Users/andre.newman/source/repos/GitHub/expense-mvp/tests/e2e

# Run with UI (recommended first time)
npm run test:ui

# Or run in terminal
npm test
```

## Verification Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Dependencies installed (`ls node_modules/@playwright`)
- [ ] Chromium browser installed (`ls ~/.cache/ms-playwright/chromium-*`)
- [ ] Backend running (`curl http://localhost:3000/api/expenses`)
- [ ] Frontend running (`curl http://localhost:5173`)
- [ ] Tests executable (`npm run test:ui`)

## Troubleshooting

### "Cannot find module '@playwright/test'"

```bash
npm install
```

### "browserType.launch: Executable doesn't exist"

```bash
npx playwright install chromium
```

### "ECONNREFUSED" errors

Ensure backend and frontend servers are running:
```bash
# Check backend
curl http://localhost:3000/api/expenses

# Check frontend
curl http://localhost:5173
```

### Permission errors on browser install

```bash
sudo npx playwright install chromium
```

### Tests timeout immediately

Increase timeout in `playwright.config.ts` or check server logs.

## Next Steps

1. ✅ Installation complete
2. Read [QUICKSTART.md](./QUICKSTART.md) for quick commands
3. Read [README.md](./README.md) for comprehensive guide
4. Explore test files in root directory
5. View page objects in `pages/` directory

## System Requirements

- **OS**: macOS, Linux, Windows
- **Node.js**: 18.x or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 1GB for Playwright + browsers
- **Ports**: 3000 (backend), 5173 (frontend) available

## Optional: VS Code Integration

Install Playwright extension for VS Code:

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Playwright Test for VSCode"
4. Install the extension
5. Run tests directly from VS Code

## Support

If you encounter issues:
1. Check this installation guide
2. Review [README.md](./README.md) troubleshooting section
3. Check Playwright documentation: https://playwright.dev/
4. Verify system requirements are met
