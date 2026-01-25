/**
 * Role-Based Access Control (RBAC) Utilities
 * Centralizes authorization checks across the application
 */

import type { UserRole } from "../depositService.js";

export interface AuthorizationContext {
  userRole: UserRole;
  userId: number;
  userLocationId?: number | null;
  targetLocationId?: number;
  isAdmin?: boolean;
}

/**
 * Validates if a location ID is assigned and valid
 * Common utility to check for null/undefined location IDs
 */
export function isLocationIdValid(locationId?: number | null): locationId is number {
  return locationId !== undefined && locationId !== null;
}

/**
 * Checks if a user is authorized to access a specific location
 */
export function isAuthorizedForLocation(context: AuthorizationContext): boolean {
  const { userRole, userLocationId, targetLocationId, isAdmin } = context;

  // Admins can access any location
  if (isAdmin || userRole === 'admin') {
    return true;
  }

  // Operators can only access their assigned location
  if (userRole === 'operator') {
    if (!isLocationIdValid(userLocationId)) {
      return false; // Operator without location assignment
    }
    if (targetLocationId === undefined) {
      return true; // No specific location restriction
    }
    return userLocationId === targetLocationId;
  }

  // Borrowers cannot access administrative functions
  if (userRole === 'borrower') {
    return false;
  }

  return false;
}

/**
 * Checks if a user can perform refund operations
 */
export function canProcessRefund(context: AuthorizationContext): boolean {
  const { userRole } = context;

  // Only admins and operators can process refunds
  if (userRole === 'admin' || userRole === 'operator') {
    return true;
  }

  return false;
}

/**
 * Checks if a user can perform bulk operations
 */
export function canPerformBulkOperations(context: AuthorizationContext): boolean {
  const { userRole, isAdmin } = context;

  // Only admins can perform bulk operations
  return isAdmin === true || userRole === 'admin';
}

/**
 * Validates transaction ownership for the given user context
 */
export function canAccessTransaction(
  transaction: { locationId: number },
  context: AuthorizationContext
): boolean {
  const { userRole, userLocationId, isAdmin } = context;

  // Admins can access any transaction
  if (isAdmin || userRole === 'admin') {
    return true;
  }

  // Operators can only access transactions from their location
  if (userRole === 'operator') {
    if (!isLocationIdValid(userLocationId)) {
      return false;
    }
    return transaction.locationId === userLocationId;
  }

  // Borrowers cannot access transaction management
  return false;
}

/**
 * Throws an error if the user is not authorized
 */
export function requireAuthorization(
  authorized: boolean,
  message: string = 'Not authorized to perform this action'
): void {
  if (!authorized) {
    throw new Error(message);
  }
}

/**
 * Gets a human-readable authorization error message
 */
export function getAuthorizationErrorMessage(
  operation: string,
  userRole: UserRole
): string {
  switch (operation) {
    case 'refund':
      return `${userRole}s are not authorized to process refunds`;
    case 'bulk_operation':
      return `${userRole}s are not authorized to perform bulk operations`;
    case 'location_access':
      return `${userRole}s are not authorized to access this location`;
    default:
      return `${userRole}s are not authorized to perform this operation`;
  }
}
