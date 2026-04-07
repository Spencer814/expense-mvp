import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import ExpenseDetailWrapper from './components/ExpenseDetailWrapper';
import Dashboard from './components/Dashboard';
import SettingsBar from './components/SettingsBar';
import { useCurrentUser, type User } from './hooks/useCurrentUser';
import { useLanguage } from './contexts/LanguageContext';
import { setCurrentUser as setApiUser, usersApi } from './services/api';
import './App.css';

/**
 * Props for the UserSelector component
 *
 * @interface UserSelectorProps
 * @property {User[]} users - Array of available users to select from
 * @property {User | null} currentUser - Currently selected user
 * @property {(user: User | null) => void} onUserSelect - Callback when user selection changes
 */
interface UserSelectorProps {
  readonly users: readonly User[];
  readonly currentUser: User | null;
  readonly onUserSelect: (user: User | null) => void;
}

/**
 * UserSelector Component
 *
 * Dropdown component for selecting the current user to simulate authentication.
 * Used in the development/demo environment to switch between different user roles
 * (submitter, approver, finance) without implementing full authentication.
 *
 * @component
 * @example
 * ```tsx
 * <UserSelector
 *   users={users}
 *   currentUser={currentUser}
 *   onUserSelect={handleUserSelect}
 * />
 * ```
 *
 * @param {UserSelectorProps} props - Component props
 * @returns {JSX.Element} User selection dropdown
 */
const UserSelector: React.FC<UserSelectorProps> = ({ users, currentUser, onUserSelect }) => {
  const { t } = useLanguage();

  /**
   * Handles user selection from the dropdown
   * Parses the selected user ID and finds the corresponding user object
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Change event from select element
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const userId = parseInt(e.target.value, 10);
    if (isNaN(userId)) {
      onUserSelect(null);
    } else {
      const user = users.find(u => u.id === userId);
      onUserSelect(user ?? null);
    }
  };

  return (
    <div className="user-selector">
      <label htmlFor="user-select" className="user-selector-label">
        {t('user.currentUser')}:
      </label>
      <select
        id="user-select"
        className="user-selector-dropdown"
        value={currentUser?.id ?? ''}
        onChange={handleChange}
      >
        <option value="">-- {t('user.selectUser')} --</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({t(`roles.${user.role}`)})
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * AppContent Component
 *
 * Main application content with routing, user management, and layout.
 * This component is rendered inside the BrowserRouter and handles:
 * - Fetching available users from the API
 * - Managing current user state (persisted to localStorage)
 * - Setting up application routes
 * - Rendering the application header with navigation
 * - Displaying user role requirements for certain actions
 *
 * Routes:
 * - `/` - ExpenseList (all expenses)
 * - `/new` - ExpenseForm (create new expense)
 * - `/expenses/:id` - ExpenseDetail (view/manage single expense)
 * - `/dashboard` - Dashboard (statistics overview)
 *
 * @component
 * @returns {JSX.Element} Main application layout with routing
 */
const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const fetchedUsers = await usersApi.getAll();
        setUsers(fetchedUsers);

        // If we have a current user in localStorage, set it in the API
        if (currentUser) {
          setApiUser(currentUser.id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setError(errorMessage);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [currentUser]);

  // Handle user selection
  const handleUserSelect = (user: User | null): void => {
    setCurrentUser(user);
    setApiUser(user ? user.id : null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h1>{t('common.error')}</h1>
        <p>{error}</p>
        <button onClick={() => { window.location.reload(); }}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-header-left">
            <h1 className="app-title">{t('app.title')}</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">
                {t('nav.expenses')}
              </Link>
              <Link to="/dashboard" className="nav-link">
                {t('nav.dashboard')}
              </Link>
            </nav>
          </div>
          <div className="app-header-right">
            <UserSelector
              users={users}
              currentUser={currentUser}
              onUserSelect={handleUserSelect}
            />
          </div>
        </div>
      </header>

      <SettingsBar />

      <main className="app-main">
        {!currentUser && (
          <div className="user-warning">
            <p>{t('user.selectUser')}</p>
          </div>
        )}

        <Routes>
          <Route path="/" element={<ExpenseList />} />
          <Route path="/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id" element={
            currentUser ? (
              <ExpenseDetailWrapper currentUser={currentUser} />
            ) : (
              <div className="user-warning">
                <p>{t('user.selectUser')}</p>
                <Link to="/" className="back-link">{t('detail.backToList')}</Link>
              </div>
            )
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={
            <div className="not-found">
              <h2>{t('common.notFound')}</h2>
              <Link to="/" className="back-link">{t('nav.expenses')}</Link>
            </div>
          } />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} {t('app.title')}</p>
        {currentUser && (
          <p className="footer-user-info">
            {t('user.currentUser')}: <strong>{currentUser.name}</strong> ({currentUser.email}) - {t(`roles.${currentUser.role}`)}
          </p>
        )}
      </footer>
    </div>
  );
};

/**
 * Root App component with Router
 */
const App: React.FC = () => (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );

export default App;
