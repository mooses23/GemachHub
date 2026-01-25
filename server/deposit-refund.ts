/**
 * Deposit Refund Processing Service
 * Handles comprehensive refund workflow when items are returned
 */

import { storage } from "./storage.js";
import { DepositSyncService } from "./deposit-sync.js";
import type { UserRole } from "./depositService.js";
import { withRetry, logRetryFailure } from "./helpers/retryHandler.js";
import { 
  canProcessRefund, 
  isAuthorizedForLocation, 
  canPerformBulkOperations,
  requireAuthorization,
  getAuthorizationErrorMessage,
  type AuthorizationContext
} from "./helpers/rbacUtils.js";
import {
  canProcessRefund as validateRefund,
  calculateRefundAmount,
  isValidRefundAmount,
  validateRefundWorkflow
} from "./helpers/stateTransitions.js";

export class DepositRefundService {
  /**
   * Processes complete deposit refund when item is returned
   */
  static async processItemReturn(
    transactionId: number,
    returnData: {
      actualReturnDate: Date;
      returnNotes?: string;
      condition?: 'good' | 'damaged' | 'missing';
      refundAmount?: number;
    },
    userRole: UserRole,
    userId: number,
    operatorLocationId?: number
  ): Promise<{ transaction: any; refundStatus: string; refundAmount: number }> {
    // RBAC Check - centralized authorization
    const authContext: AuthorizationContext = {
      userRole,
      userId,
      userLocationId: operatorLocationId,
      isAdmin: userRole === 'admin'
    };
    
    requireAuthorization(
      canProcessRefund(authContext),
      getAuthorizationErrorMessage('refund', userRole)
    );

    const result = await withRetry(
      async () => {
        const transaction = await storage.getTransaction(transactionId);
        if (!transaction) {
          throw new Error(`Transaction ${transactionId} not found`);
        }

        // Location authorization check
        if (userRole === 'operator') {
          const locationAuth = isAuthorizedForLocation({
            ...authContext,
            targetLocationId: transaction.locationId
          });
          requireAuthorization(
            locationAuth,
            `Operator not authorized for location ${transaction.locationId}`
          );
        }

        // Get payments for validation
        const payments = await storage.getPaymentsByTransaction(transactionId);

        // State validation - ensure transaction can be refunded
        const validationResult = validateRefund(transaction, payments);
        if (!validationResult.valid) {
          throw new Error(validationResult.reason || 'Cannot process refund');
        }

        // Validate complete workflow
        const workflowValidation = validateRefundWorkflow(transaction, payments);
        if (!workflowValidation.valid) {
          throw new Error(`Refund workflow validation failed: ${workflowValidation.errors.join(', ')}`);
        }

        // Calculate refund amount based on condition using helper
        const calculatedAmount = calculateRefundAmount(
          transaction.depositAmount,
          returnData.condition
        );
        const refundAmount = returnData.refundAmount !== undefined 
          ? returnData.refundAmount 
          : calculatedAmount;

        // Validate refund amount
        const amountValidation = isValidRefundAmount(refundAmount, transaction.depositAmount);
        if (!amountValidation.valid) {
          throw new Error(amountValidation.reason || 'Invalid refund amount');
        }

        // Mark transaction as returned
        const updatedTransaction = await storage.markTransactionReturned(transactionId);

        // Process refund payment
        const completedPayment = payments.find(p => p.status === 'completed');

        let refundStatus = 'pending';
        if (completedPayment) {
          // Create refund payment record
          await storage.createPayment({
            transactionId,
            paymentMethod: completedPayment.paymentMethod,
            paymentProvider: completedPayment.paymentProvider,
            depositAmount: refundAmount,
            totalAmount: refundAmount,
            status: 'refund_pending',
            externalPaymentId: `refund_${completedPayment.externalPaymentId}`,
            paymentData: JSON.stringify({
              condition: returnData.condition,
              notes: returnData.returnNotes,
              processedBy: userId,
              processedAt: new Date().toISOString()
            })
          });
          
          refundStatus = 'refund_initiated';
        }

        // Sync refund across system (including stock updates)
        await DepositSyncService.processDepositRefund(transactionId, returnData.condition);

        return {
          transaction: updatedTransaction,
          refundStatus,
          refundAmount
        };
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Retry attempt ${attempt} for processItemReturn (transaction ${transactionId}):`, error.message);
        }
      }
    );

    if (!result.success) {
      // Log failure persistently for later retry
      await logRetryFailure(
        'processItemReturn',
        {
          transactionId,
          returnData,
          userRole,
          userId,
          operatorLocationId
        },
        result.error!
      );
      throw new Error(`Failed to process item return after ${result.attempts} attempts: ${result.error?.message}`);
    }

    return result.data!;
  }

  /**
   * Generates refund reconciliation report
   */
  static async generateRefundReport(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const transactions = await storage.getAllTransactions();
      const payments = await storage.getAllPayments();

      const refundTransactions = transactions.filter(tx => 
        tx.isReturned && 
        (!dateRange || (
          tx.actualReturnDate && 
          tx.actualReturnDate >= dateRange.start && 
          tx.actualReturnDate <= dateRange.end
        ))
      );

      const refundPayments = payments.filter(p => 
        p.status.includes('refund') &&
        refundTransactions.some(tx => tx.id === p.transactionId)
      );

      const totalRefunded = refundPayments
        .filter(p => p.status === 'refund_completed')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const pendingRefunds = refundPayments
        .filter(p => p.status === 'refund_pending')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      return {
        totalReturns: refundTransactions.length,
        totalRefunded,
        pendingRefunds,
        refundTransactions: refundTransactions.map(tx => ({
          id: tx.id,
          borrowerName: tx.borrowerName,
          depositAmount: tx.depositAmount,
          returnDate: tx.actualReturnDate,
          refundStatus: refundPayments.find(p => p.transactionId === tx.id)?.status || 'no_refund'
        }))
      };
    } catch (error) {
      console.error('Refund report generation error:', error);
      throw error;
    }
  }

  /**
   * Processes bulk refunds for multiple returns (admin only)
   */
  static async processBulkRefunds(
    transactionIds: number[],
    userRole: UserRole,
    userId: number
  ): Promise<{
    successful: number;
    failed: number;
    details: Array<{ transactionId: number; status: string; error?: string }>
  }> {
    // Use centralized RBAC check
    const authContext: AuthorizationContext = {
      userRole,
      userId,
      isAdmin: userRole === 'admin'
    };

    if (!canPerformBulkOperations(authContext)) {
      const errorMsg = getAuthorizationErrorMessage('bulk_operation', userRole);
      return { 
        successful: 0, 
        failed: transactionIds.length, 
        details: transactionIds.map(id => ({ 
          transactionId: id, 
          status: 'failed', 
          error: errorMsg 
        })) 
      };
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const transactionId of transactionIds) {
      try {
        await this.processItemReturn(transactionId, {
          actualReturnDate: new Date(),
          returnNotes: 'Bulk return processing'
        }, userRole, userId);
        results.push({ transactionId, status: 'success' });
        successful++;
      } catch (error: any) {
        results.push({ 
          transactionId, 
          status: 'failed', 
          error: error.message 
        });
        failed++;
      }
    }

    return { successful, failed, details: results };
  }
}