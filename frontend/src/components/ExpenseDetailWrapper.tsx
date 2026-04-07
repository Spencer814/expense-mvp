import React from 'react';
import ExpenseDetail from './ExpenseDetail';
import type { User } from '../hooks/useCurrentUser';

/**
 * Props for the ExpenseDetailWrapper component
 *
 * @interface ExpenseDetailWrapperProps
 * @property {User} currentUser - User object from the useCurrentUser hook
 */
interface ExpenseDetailWrapperProps {
  readonly currentUser: User;
}

/**
 * ExpenseDetailWrapper Component
 *
 * Adapter component that bridges the gap between different user role naming conventions.
 * The useCurrentUser hook uses 'submitter' | 'approver' | 'finance' roles,
 * while ExpenseDetail expects 'employee' | 'manager' | 'finance' roles.
 *
 * This wrapper performs the role mapping to maintain compatibility without
 * modifying the core ExpenseDetail component.
 *
 * Role mappings:
 * - submitter → employee (can submit drafts)
 * - approver → manager (can approve/reject)
 * - finance → finance (can mark as paid)
 *
 * @component
 * @example
 * ```tsx
 * <ExpenseDetailWrapper currentUser={currentUser} />
 * ```
 *
 * @param {ExpenseDetailWrapperProps} props - Component props
 * @param {User} props.currentUser - Current user from useCurrentUser hook
 * @returns {JSX.Element} ExpenseDetail component with adapted user object
 */
const ExpenseDetailWrapper: React.FC<ExpenseDetailWrapperProps> = ({ currentUser }) => {
  /**
   * Maps user roles from hook convention to ExpenseDetail convention
   *
   * @param {User['role']} role - Role from useCurrentUser hook
   * @returns {'employee' | 'manager' | 'finance'} Mapped role for ExpenseDetail
   */
  const mapRole = (role: User['role']): 'employee' | 'manager' | 'finance' => {
    switch (role) {
      case 'submitter':
        return 'employee';
      case 'approver':
        return 'manager';
      case 'finance':
        return 'finance';
      default:
        return 'employee';
    }
  };

  // Create adapted user object with mapped role
  const adaptedUser = {
    id: currentUser.id,
    username: currentUser.name,
    role: mapRole(currentUser.role),
  };

  return <ExpenseDetail currentUser={adaptedUser} />;
};

export default ExpenseDetailWrapper;
