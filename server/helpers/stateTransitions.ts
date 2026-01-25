/**
 * State Transition Validation Utilities
 * Ensures valid state transitions for transactions and payments
 */

// Type definitions for state management
// These types document the possible states in the system
export type TransactionState = 'active' | 'returned' | 'cancelled';
export type PaymentState = 'pending' | 'confirming' | 'completed' | 'failed' | 'refund_pending' | 'refunded';
export type RefundState = 'not_refunded' | 'refund_initiated' | 'refund_pending' | 'refund_completed' | 'refund_failed';

export interface Transaction {
  id: number;
  isReturned: boolean;
  depositAmount: number;
  locationId: number;
}

export interface Payment {
  id: number;
  status: string;
  transactionId: number;
  externalPaymentId?: string;
}

/**
 * Validates if a refund can be processed for a transaction
 */
export function canProcessRefund(
  transaction: Transaction,
  payments: Payment[]
): { valid: boolean; reason?: string } {
  // Check if transaction is already returned
  if (transaction.isReturned) {
    return {
      valid: false,
      reason: `Transaction ${transaction.id} is already marked as returned`
    };
  }

  // Check if there's a completed payment
  const completedPayment = payments.find(p => p.status === 'completed');
  if (!completedPayment) {
    return {
      valid: false,
      reason: `Transaction ${transaction.id} has no completed payment to refund`
    };
  }

  // Check if refund is already in progress
  const existingRefund = payments.find(p => 
    p.status.includes('refund') && p.status !== 'refund_failed'
  );
  if (existingRefund) {
    return {
      valid: false,
      reason: `Transaction ${transaction.id} already has a refund in progress (status: ${existingRefund.status})`
    };
  }

  return { valid: true };
}

/**
 * Validates payment state transition
 */
export function isValidPaymentStateTransition(
  currentState: string,
  newState: string
): { valid: boolean; reason?: string } {
  const validTransitions: Record<string, string[]> = {
    'pending': ['confirming', 'completed', 'failed'],
    'confirming': ['completed', 'failed'],
    'completed': ['refund_pending', 'refunded'],
    'failed': ['pending'], // Allow retry
    'refund_pending': ['refunded', 'refund_failed'],
    'refunded': [], // Final state
    'refund_failed': ['refund_pending'] // Allow retry
  };

  if (!validTransitions[currentState]) {
    return {
      valid: false,
      reason: `Unknown current payment state: ${currentState}`
    };
  }

  if (!validTransitions[currentState].includes(newState)) {
    return {
      valid: false,
      reason: `Invalid payment state transition: ${currentState} -> ${newState}`
    };
  }

  return { valid: true };
}

/**
 * Validates transaction state transition
 */
export function isValidTransactionStateTransition(
  isReturned: boolean,
  markingAsReturned: boolean
): { valid: boolean; reason?: string } {
  // Can't mark as returned if already returned
  if (isReturned && markingAsReturned) {
    return {
      valid: false,
      reason: 'Transaction is already marked as returned'
    };
  }

  // Can't un-return a transaction
  if (isReturned && !markingAsReturned) {
    return {
      valid: false,
      reason: 'Cannot change returned status back to active'
    };
  }

  return { valid: true };
}

/**
 * Validates refund amount
 */
export function isValidRefundAmount(
  refundAmount: number,
  depositAmount: number
): { valid: boolean; reason?: string } {
  if (refundAmount < 0) {
    return {
      valid: false,
      reason: 'Refund amount cannot be negative'
    };
  }

  if (refundAmount > depositAmount) {
    return {
      valid: false,
      reason: `Refund amount ($${refundAmount}) cannot exceed deposit amount ($${depositAmount})`
    };
  }

  return { valid: true };
}

/**
 * Determines refund amount based on item condition
 */
export function calculateRefundAmount(
  depositAmount: number,
  condition?: 'good' | 'damaged' | 'missing'
): number {
  if (!condition || condition === 'good') {
    return depositAmount; // Full refund
  }

  if (condition === 'damaged') {
    return depositAmount * 0.5; // 50% for damaged items
  }

  if (condition === 'missing') {
    return 0; // No refund for missing items
  }

  return depositAmount; // Default to full refund
}

/**
 * Validates complete refund workflow state
 */
export function validateRefundWorkflow(
  transaction: Transaction,
  payments: Payment[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check transaction state
  const refundCheck = canProcessRefund(transaction, payments);
  if (!refundCheck.valid && refundCheck.reason) {
    errors.push(refundCheck.reason);
  }

  // Check for valid deposit amount
  if (transaction.depositAmount <= 0) {
    errors.push(`Invalid deposit amount: $${transaction.depositAmount}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
