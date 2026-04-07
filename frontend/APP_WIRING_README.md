# Expense Approval MVP - Frontend App Wiring

## Overview
This document describes the main application structure and wiring for the Expense Approval MVP React frontend.

## Created Files

### 1. Core Application Files

#### `/src/App.tsx`
Main application component that provides:
- React Router setup with BrowserRouter
- User management state with localStorage persistence
- Header with navigation (Expenses, Dashboard)
- User dropdown for role switching
- Route definitions for all pages
- Footer with current user info

**Routes:**
- `/` - Expense List
- `/new` - Create New Expense Form
- `/expenses/:id` - Expense Detail (with user requirement check)
- `/dashboard` - Dashboard Statistics
- `*` - 404 Not Found page

#### `/src/App.css`
Comprehensive styling for the application including:
- Header and navigation styles
- User selector dropdown
- Footer styling
- Loading and error states
- Responsive design (mobile-friendly)
- Utility classes

#### `/src/main.tsx`
Standard Vite entry point that:
- Creates React root
- Renders App component in StrictMode
- Imports global styles

#### `/src/index.css`
Global CSS variables and base styles:
- CSS custom properties for colors, spacing, shadows
- Typography base styles
- Form element defaults
- Scrollbar customization
- Accessibility helpers

### 2. Custom Hooks

#### `/src/hooks/useCurrentUser.ts`
Custom hook for managing current user state:
- Stores user in React state and localStorage
- Automatically syncs between state and localStorage
- Provides `currentUser`, `setCurrentUser`, and `clearUser` functions
- Type-safe User interface

**User Interface:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'submitter' | 'approver' | 'finance';
}
```

### 3. Services

#### `/src/services/api.ts`
Centralized API service with:
- API base URL configuration (`/api`)
- Current user ID management for X-User-Id header
- Generic fetch wrapper with error handling
- Type-safe API methods organized by domain:
  - `usersApi`: User operations (getAll, getById)
  - `expensesApi`: Expense CRUD operations (getAll, getById, create, update, delete, submit, approve, markPaid)
  - `dashboardApi`: Dashboard statistics (getStats)
- `setCurrentUser(userId)`: Sets X-User-Id header for API calls
- Comprehensive TypeScript interfaces for all requests/responses

### 4. Types

#### `/src/types/index.ts`
Shared TypeScript type definitions:
- `User` interface
- `Expense` interface
- `ExpenseStatus` type
- `UserRole` type
- Request/Response interfaces
- Dashboard statistics interface

### 5. Component Adapters

#### `/src/components/ExpenseDetailWrapper.tsx`
Adapter component that:
- Maps User interface from `useCurrentUser` hook to ExpenseDetail's expected format
- Converts role names: `submitter` → `employee`, `approver` → `manager`
- Converts `name` property to `username`
- Ensures type compatibility between different components

## User Switching Flow

When a user is selected from the dropdown:

1. User clicks dropdown and selects a user
2. `handleUserSelect` is called in App.tsx
3. `setCurrentUser(user)` updates React state and localStorage
4. `setApiUser(user.id)` sets the X-User-Id header for all API calls
5. Components automatically re-render with new user context
6. All subsequent API calls include the X-User-Id header

## State Management

The app uses **React Context-free state management**:
- Local component state for UI concerns
- Custom hook (`useCurrentUser`) for shared user state
- API service module for HTTP header management
- No Redux or Context API needed for this MVP

## Authentication Simulation

This app simulates authentication by:
- Providing a dropdown to select different user roles
- Storing selected user in localStorage for persistence
- Including X-User-Id header in all API requests
- Components check `currentUser` to enable/disable features based on role

**Roles and Permissions:**
- **Submitter (Employee)**: Can create and submit expenses
- **Approver (Manager)**: Can approve/reject submitted expenses
- **Finance**: Can mark approved expenses as paid

## Component Architecture

```
App (BrowserRouter)
├── AppContent
│   ├── Header
│   │   ├── Title
│   │   ├── Navigation (Expenses, Dashboard)
│   │   └── UserSelector (dropdown)
│   ├── Main Content
│   │   └── Routes
│   │       ├── / → ExpenseList
│   │       ├── /new → ExpenseForm
│   │       ├── /expenses/:id → ExpenseDetailWrapper → ExpenseDetail
│   │       ├── /dashboard → Dashboard
│   │       └── * → 404 Not Found
│   └── Footer (user info)
```

## Styling Approach

- **CSS Modules**: Not used (inline styles in components)
- **Global Styles**: index.css with CSS variables
- **Component Styles**: App.css for application layout
- **Responsive**: Mobile-first with media queries
- **Color Scheme**: Professional blue/gray palette with semantic status colors

## API Integration

All components use the centralized API service:
- No direct fetch calls in components (except older components)
- Consistent error handling
- TypeScript interfaces for all API responses
- X-User-Id header automatically included when user is selected

## Development Notes

### Running the App
```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
The API base URL is hardcoded as `/api` which works with a proxy configuration. Update `api.ts` if backend is on a different URL.

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- No IE11 support

## Future Enhancements

Potential improvements:
1. Add React Query for better caching and state management
2. Implement actual authentication with JWT tokens
3. Add form validation library (e.g., React Hook Form)
4. Implement toast notifications instead of alerts
5. Add loading skeletons for better UX
6. Implement error boundaries for better error handling
7. Add unit tests for hooks and services
8. Implement i18n for internationalization

## File Structure Summary

```
frontend/src/
├── App.tsx                    # Main app component with routing
├── App.css                    # App layout styles
├── main.tsx                   # Vite entry point
├── index.css                  # Global styles and CSS variables
├── components/
│   ├── ExpenseList.tsx        # List of expenses (created by other agent)
│   ├── ExpenseForm.tsx        # Create expense form (created by other agent)
│   ├── ExpenseDetail.tsx      # Expense detail view (created by other agent)
│   ├── ExpenseDetailWrapper.tsx # Adapter for ExpenseDetail
│   └── Dashboard.tsx          # Dashboard statistics (created by other agent)
├── hooks/
│   └── useCurrentUser.ts      # Custom hook for user state management
├── services/
│   └── api.ts                 # Centralized API service
└── types/
    └── index.ts               # Shared TypeScript interfaces
```

## Key Features

1. **User Role Simulation**: Dropdown to switch between different user roles
2. **Persistent State**: User selection saved in localStorage
3. **Clean Architecture**: Separation of concerns (hooks, services, components)
4. **Type Safety**: Comprehensive TypeScript types throughout
5. **Responsive Design**: Works on mobile, tablet, and desktop
6. **Error Handling**: Graceful error states with retry functionality
7. **Loading States**: Spinner animations for async operations
8. **Navigation**: Clean routing with React Router v6
9. **Accessibility**: Semantic HTML with proper labels

## Testing Recommendations

To test the app:
1. Start the backend API server
2. Start the frontend development server
3. Open browser to http://localhost:5173 (or configured port)
4. Select a user from the dropdown
5. Navigate through different routes
6. Test role-based features by switching users
7. Verify API calls include X-User-Id header (check Network tab)

---

**Created by**: Claude Code Agent
**Date**: 2026-03-28
**Purpose**: Main application wiring for Expense Approval MVP
