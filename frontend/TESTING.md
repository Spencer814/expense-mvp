# Expense MVP Frontend - Testing Documentation

## Overview

This document describes the testing setup and strategy for the Expense Approval MVP frontend application built with React, TypeScript, and Vite.

## Tech Stack

- **Test Runner**: Vitest
- **Testing Library**: @testing-library/react
- **DOM Matchers**: @testing-library/jest-dom
- **User Interactions**: @testing-library/user-event
- **API Mocking**: MSW (Mock Service Worker) - configured but not yet utilized
- **Environment**: jsdom

## Setup

### Installation

```bash
cd frontend
npm install
```

This will install all testing dependencies defined in `package.json`.

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Files

### Component Tests

#### 1. ExpenseList.test.tsx
**Location**: `src/components/ExpenseList.test.tsx`

**Coverage**:
- Loading state rendering
- Error handling and retry functionality
- Empty state display
- Expense table rendering with proper data formatting
- Status badges with correct colors
- Navigation links
- API integration
- Edge cases (invalid dates, invalid amounts)

**Key Test Cases**:
- Renders loading spinner initially
- Displays error message on fetch failure
- Shows "No expenses found" for empty results
- Formats currency amounts correctly ($XX.XX)
- Formats dates in readable format
- Displays correct status badge colors for all statuses
- Renders clickable expense title links
- Handles invalid data gracefully

#### 2. ExpenseForm.test.tsx
**Location**: `src/components/ExpenseForm.test.tsx`

**Coverage**:
- Form field rendering
- User input handling
- Form validation (all required fields)
- Save Draft functionality
- Submit functionality (create + submit workflow)
- OCR / Parse Receipt functionality
- Error handling
- Loading states

**Key Test Cases**:
- Renders all form fields correctly
- Updates field values on user input
- Validates required fields before submission
- Shows appropriate error messages
- Saves draft and displays draft ID
- Creates expense and submits in one flow
- Uses existing draft ID when already saved
- Calls Parse Receipt API and populates form
- Disables buttons during async operations
- Navigates to home after successful submit

### Service Tests

#### 3. api.test.ts
**Location**: `src/services/api.test.ts`

**Coverage**:
- User ID management (setCurrentUser, getCurrentUserId)
- Request header injection (X-User-Id)
- Error handling for various HTTP status codes
- All API endpoints (users, expenses, dashboard)
- Request payload formatting
- Response parsing

**Key Test Cases**:
- Sets and retrieves current user ID
- Includes X-User-Id header when user is set
- Throws appropriate errors for failed requests
- Calls correct endpoints with correct methods
- Parses error messages from response bodies
- Handles network failures gracefully
- Updates headers when user changes

### Hook Tests

#### 4. useCurrentUser.test.ts
**Location**: `src/hooks/useCurrentUser.test.ts`

**Coverage**:
- Hook initialization from localStorage
- Setting and clearing user
- localStorage persistence
- Error handling
- State management across re-renders

**Key Test Cases**:
- Initializes with null when localStorage is empty
- Loads user from localStorage on mount
- Persists user to localStorage on change
- Clears user and removes from localStorage
- Handles localStorage errors gracefully
- Maintains state across unmount/remount
- Supports all user roles (submitter, approver, finance)

## Configuration Files

### vitest.config.ts
Configures Vitest with:
- React plugin for JSX/TSX support
- jsdom environment for DOM testing
- Global test utilities
- Setup file reference
- Coverage configuration with v8 provider

### src/setupTests.ts
Global test setup that:
- Imports @testing-library/jest-dom matchers
- Cleans up after each test
- Mocks localStorage
- Mocks window.alert
- Mocks window.location.reload

## Testing Patterns

### 1. Component Rendering
```typescript
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

renderWithRouter(<ExpenseList />);
```

### 2. Async Testing
```typescript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### 3. User Interactions
```typescript
const user = userEvent.setup();
await user.type(screen.getByLabelText(/title/i), 'Test Expense');
await user.click(screen.getByRole('button', { name: /submit/i }));
```

### 4. API Mocking
```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => mockData,
  })
) as any;
```

### 5. Error Handling
```typescript
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code ...
consoleErrorSpy.mockRestore();
```

## Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

1. **Descriptive Test Names**: Use "should..." format for clarity
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Test User Behavior**: Focus on what users see and do, not implementation
4. **Mock External Dependencies**: Use vi.fn() for fetch, navigation, etc.
5. **Clean Up**: Always restore mocks and clear state
6. **Isolation**: Each test should be independent
7. **Edge Cases**: Test error states, empty states, and invalid inputs

## Common Issues and Solutions

### Issue: Tests fail with "not wrapped in act(...)"
**Solution**: Use `await waitFor()` for async state updates

### Issue: "Cannot find module" errors
**Solution**: Ensure vitest.config.ts includes React plugin

### Issue: localStorage is not defined
**Solution**: Use setupTests.ts to mock localStorage

### Issue: Router errors in component tests
**Solution**: Wrap components with BrowserRouter using helper function

## Future Enhancements

- [ ] Add MSW handlers for more realistic API mocking
- [ ] Add E2E tests with Playwright or Cypress
- [ ] Add visual regression testing
- [ ] Implement test data factories for DRY test data
- [ ] Add performance testing for large datasets
- [ ] Add accessibility testing with jest-axe

## Notes for ExpenseDetail and Dashboard Components

The test suite is prepared for ExpenseDetail and Dashboard components, which were mentioned in requirements but not found in the current codebase. When these components are implemented:

### ExpenseDetail.test.tsx (to be created)
Should test:
- Rendering expense details
- Role-based button visibility (Submit for Employee, Approve/Reject for Manager, Mark Paid for Finance)
- Action button functionality
- Approval history display

### Dashboard.test.tsx (to be created)
Should test:
- Loading state
- Status cards with correct counts
- Category totals table
- Data fetching and display

## Contributing

When adding new tests:
1. Follow existing patterns and naming conventions
2. Add tests for both happy path and error cases
3. Update this documentation if adding new patterns
4. Run `npm run test:coverage` to ensure coverage goals are met
5. Keep tests focused and readable

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW Documentation](https://mswjs.io/)
