/**
 * Deposit Refund Processing Service
 * Handles comprehensive refund workflow when items are returned
 */

import { storage } from "./storage";
import { DepositSyncService } from "./deposit-sync";

export class DepositRefundService {
  /**
   * Processes complete deposit refund when item is returned
   */
  static async processItemReturn(transactionId: number, returnData: {
    actualReturnDate: Date;
    returnNotes?: string;
    condition?: 'good' | 'damaged' | 'missing';
    refundAmount?: number;
  }): Promise<{ transaction: any; refundStatus: string; refundAmount: number }> {
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      if (transaction.isReturned) {
        throw new Error(`Transaction ${transactionId} already marked as returned`);
      }

      // Calculate refund amount based on condition
      let refundAmount = returnData.refundAmount || transaction.depositAmount;
      
      if (returnData.condition === 'damaged') {
        refundAmount = transaction.depositAmount * 0.5; // 50% for damaged items
      } else if (returnData.condition === 'missing') {
        refundAmount = 0; // No refund for missing items
      }

      // Mark transaction as returned
      const updatedTransaction = await storage.markTransactionReturned(transactionId);

      // Process refund payment
      const payments = await storage.getPaymentsByTransaction(transactionId);
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
          externalPaymentId: `refund_${completedPayment.externalPaymentId}`
        });
        
        refundStatus = 'refund_initiated';
      }

      // Sync refund across system
      await DepositSyncService.processDepositRefund(transactionId);

      return {
        transaction: updatedTransaction,
        refundStatus,
        refundAmount
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
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
   * Processes bulk refunds for multiple returns
   */
  static async processBulkRefunds(transactionIds: number[]): Promise<{
    successful: number;
    failed: number;
    details: Array<{ transactionId: number; status: string; error?: string }>
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const transactionId of transactionIds) {
      try {
        await this.processItemReturn(transactionId, {
          actualReturnDate: new Date(),
          returnNotes: 'Bulk return processing'
        });
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