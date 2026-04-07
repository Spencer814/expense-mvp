import { useEffect, useState } from 'react';

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: 'submitter' | 'approver' | 'finance';
}

interface UseCurrentUserReturn {
  readonly currentUser: User | null;
  readonly setCurrentUser: (user: User | null) => void;
  readonly clearUser: () => void;
}

const STORAGE_KEY = 'expense_mvp_current_user';

/**
 * Custom hook for managing current user state with localStorage persistence
 *
 * @returns Object containing currentUser, setCurrentUser, and clearUser functions
 */
export const useCurrentUser = (): UseCurrentUserReturn => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    // Initialize from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as User : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  });

  // Sync to localStorage whenever currentUser changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  }, [currentUser]);

  const setCurrentUser = (user: User | null): void => {
    setCurrentUserState(user);
  };

  const clearUser = (): void => {
    setCurrentUserState(null);
  };

  return {
    currentUser,
    setCurrentUser,
    clearUser,
  };
};
