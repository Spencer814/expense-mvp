import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCurrentUser } from './useCurrentUser';

describe('useCurrentUser Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with null when localStorage is empty', () => {
      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.currentUser).toBeNull();
    });

    it('should initialize from localStorage if data exists', () => {
      const mockUser = {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'submitter' as const,
      };

      localStorage.setItem('expense_mvp_current_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should handle invalid JSON in localStorage', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('expense_mvp_current_user', 'invalid-json');

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.currentUser).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading user from localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.getItem to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.currentUser).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original
      Storage.prototype.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('setCurrentUser', () => {
    it('should set user and persist to localStorage', () => {
      const { result } = renderHook(() => useCurrentUser());

      const newUser = {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        role: 'approver' as const,
      };

      act(() => {
        result.current.setCurrentUser(newUser);
      });

      expect(result.current.currentUser).toEqual(newUser);
      expect(localStorage.getItem('expense_mvp_current_user')).toBe(JSON.stringify(newUser));
    });

    it('should update user when called multiple times', () => {
      const { result } = renderHook(() => useCurrentUser());

      const user1 = {
        id: 3,
        name: 'Charlie',
        email: 'charlie@example.com',
        role: 'finance' as const,
      };

      const user2 = {
        id: 4,
        name: 'Diana',
        email: 'diana@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(user1);
      });

      expect(result.current.currentUser).toEqual(user1);

      act(() => {
        result.current.setCurrentUser(user2);
      });

      expect(result.current.currentUser).toEqual(user2);
      expect(localStorage.getItem('expense_mvp_current_user')).toBe(JSON.stringify(user2));
    });

    it('should clear user when set to null', () => {
      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 5,
        name: 'Eve',
        email: 'eve@example.com',
        role: 'finance' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      expect(result.current.currentUser).toEqual(user);

      act(() => {
        result.current.setCurrentUser(null);
      });

      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('expense_mvp_current_user')).toBeNull();
    });

    it('should handle localStorage write errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 6,
        name: 'Frank',
        email: 'frank@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      // User should still be set in state even if localStorage fails
      expect(result.current.currentUser).toEqual(user);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving user to localStorage:',
        expect.any(Error)
      );

      // Restore original
      Storage.prototype.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearUser', () => {
    it('should clear user and remove from localStorage', () => {
      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 7,
        name: 'Grace',
        email: 'grace@example.com',
        role: 'approver' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      expect(result.current.currentUser).toEqual(user);
      expect(localStorage.getItem('expense_mvp_current_user')).not.toBeNull();

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('expense_mvp_current_user')).toBeNull();
    });

    it('should be idempotent when called multiple times', () => {
      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 8,
        name: 'Henry',
        email: 'henry@example.com',
        role: 'finance' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.currentUser).toBeNull();

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('expense_mvp_current_user')).toBeNull();
    });
  });

  describe('Persistence Behavior', () => {
    it('should sync changes to localStorage automatically', async () => {
      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 9,
        name: 'Ivy',
        email: 'ivy@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      await waitFor(() => {
        expect(localStorage.getItem('expense_mvp_current_user')).toBe(JSON.stringify(user));
      });
    });

    it('should persist across hook re-renders', () => {
      const user = {
        id: 10,
        name: 'Jack',
        email: 'jack@example.com',
        role: 'approver' as const,
      };

      const { result, rerender } = renderHook(() => useCurrentUser());

      act(() => {
        result.current.setCurrentUser(user);
      });

      expect(result.current.currentUser).toEqual(user);

      rerender();

      expect(result.current.currentUser).toEqual(user);
    });

    it('should maintain state between unmount and remount', () => {
      const user = {
        id: 11,
        name: 'Kate',
        email: 'kate@example.com',
        role: 'finance' as const,
      };

      const { result, unmount } = renderHook(() => useCurrentUser());

      act(() => {
        result.current.setCurrentUser(user);
      });

      unmount();

      // Remount the hook
      const { result: result2 } = renderHook(() => useCurrentUser());

      expect(result2.current.currentUser).toEqual(user);
    });
  });

  describe('User Role Types', () => {
    it('should handle submitter role', () => {
      const { result } = renderHook(() => useCurrentUser());

      const submitter = {
        id: 12,
        name: 'Leo',
        email: 'leo@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(submitter);
      });

      expect(result.current.currentUser?.role).toBe('submitter');
    });

    it('should handle approver role', () => {
      const { result } = renderHook(() => useCurrentUser());

      const approver = {
        id: 13,
        name: 'Mia',
        email: 'mia@example.com',
        role: 'approver' as const,
      };

      act(() => {
        result.current.setCurrentUser(approver);
      });

      expect(result.current.currentUser?.role).toBe('approver');
    });

    it('should handle finance role', () => {
      const { result } = renderHook(() => useCurrentUser());

      const finance = {
        id: 14,
        name: 'Noah',
        email: 'noah@example.com',
        role: 'finance' as const,
      };

      act(() => {
        result.current.setCurrentUser(finance);
      });

      expect(result.current.currentUser?.role).toBe('finance');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with minimal data', () => {
      const { result } = renderHook(() => useCurrentUser());

      const minimalUser = {
        id: 15,
        name: 'Olivia',
        email: 'olivia@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(minimalUser);
      });

      expect(result.current.currentUser).toEqual(minimalUser);
    });

    it('should handle user ID of 0', () => {
      const { result } = renderHook(() => useCurrentUser());

      const userWithZeroId = {
        id: 0,
        name: 'Paul',
        email: 'paul@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(userWithZeroId);
      });

      expect(result.current.currentUser?.id).toBe(0);
    });

    it('should handle special characters in user data', () => {
      const { result } = renderHook(() => useCurrentUser());

      const userWithSpecialChars = {
        id: 16,
        name: "O'Brien-Smith",
        email: 'o.brien+test@example.com',
        role: 'approver' as const,
      };

      act(() => {
        result.current.setCurrentUser(userWithSpecialChars);
      });

      expect(result.current.currentUser).toEqual(userWithSpecialChars);
      expect(localStorage.getItem('expense_mvp_current_user')).toBe(
        JSON.stringify(userWithSpecialChars)
      );
    });
  });

  describe('Storage Key', () => {
    it('should use correct localStorage key', () => {
      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 17,
        name: 'Quinn',
        email: 'quinn@example.com',
        role: 'finance' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      const storedValue = localStorage.getItem('expense_mvp_current_user');
      expect(storedValue).not.toBeNull();
      if (storedValue) {
        expect(JSON.parse(storedValue) as typeof user).toEqual(user);
      }
    });

    it('should not interfere with other localStorage keys', () => {
      localStorage.setItem('other_key', 'other_value');

      const { result } = renderHook(() => useCurrentUser());

      const user = {
        id: 18,
        name: 'Rachel',
        email: 'rachel@example.com',
        role: 'submitter' as const,
      };

      act(() => {
        result.current.setCurrentUser(user);
      });

      expect(localStorage.getItem('other_key')).toBe('other_value');
      expect(localStorage.getItem('expense_mvp_current_user')).toBe(JSON.stringify(user));
    });
  });
});
