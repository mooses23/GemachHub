/**
 * Deposit Detection and Status Processing Service
 * Monitors payment status changes and handles declined/accepted processing
 */

import { storage } from "./storage";
import { DepositSyncService } from "./deposit-sync";
import { EmailNotificationService } from "./email-notifications";
import { AuditTrailService } from "./audit-trail";

export class DepositDetectionService {
  /**
   * Processes payment status detection from external providers
   */
  static async processPaymentStatusUpdate(
    externalPaymentId: string,
    newStatus: 'accepted' | 'declined' | 'pending' | 'failed',
    providerData: any,
    webhookSource?: string
  ): Promise<void> {
    try {
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.externalPaymentId === externalPaymentId);
      
      if (!payment) {
        console.error(`Payment not found for external ID: ${externalPaymentId}`);
        return;
      }

      const transaction = await storage.getTransaction(payment.transactionId);
      if (!transaction) {
        console.error(`Transaction not found for payment: ${payment.id}`);
        return;
      }

      // Map external status to internal status
      const internalStatus = this.mapExternalStatusToInternal(newStatus);
      
      // Update payment with new status and provider data
      const updatedPayment = await storage.updatePaymentStatus(
        payment.id,
        internalStatus,
        {
          ...providerData,
          statusUpdatedAt: new Date().toISOString(),
          webhookSource,
          lastStatusCheck: new Date().toISOString()
        }
      );

      // Process based on status
      if (newStatus === 'accepted') {
        await this.handleAcceptedPayment(updatedPayment, transaction, providerData);
      } else if (newStatus === 'declined' || newStatus === 'failed') {
        await this.handleDeclinedPayment(updatedPayment, transaction, providerData);
      }

      // Sync across system
      await DepositSyncService.syncDepositConfirmation(
        payment.id,
        internalStatus,
        providerData
      );

    } catch (error) {
      console.error('Payment status processing error:', error);
      throw error;
    }
  }

  /**
   * Handles successfully accepted payments
   */
  private static async handleAcceptedPayment(
    payment: any,
    transaction: any,
    providerData: any
  ): Promise<void> {
    try {
      // Log successful payment
      await AuditTrailService.logDepositConfirmation(
        0, // System user
        'system',
        payment.id,
        payment.status,
        'completed',
        providerData
      );

      // Send confirmation email
      await EmailNotificationService.notifyDepositConfirmed(payment, transaction);

      // Update location inventory if applicable
      const location = await storage.getLocation(transaction.locationId);
      if (location && location.inventoryCount > 0) {
        await storage.updateLocation(transaction.locationId, {
          inventoryCount: location.inventoryCount - 1
        });
      }

      console.log(`Payment ${payment.id} successfully accepted and processed`);
    } catch (error) {
      console.error('Error handling accepted payment:', error);
    }
  }

  /**
   * Handles declined or failed payments
   */
  private static async handleDeclinedPayment(
    payment: any,
    transaction: any,
    providerData: any
  ): Promise<void> {
    try {
      // Log failed payment
      await AuditTrailService.logDepositConfirmation(
        0, // System user
        'system',
        payment.id,
        payment.status,
        'failed',
        providerData
      );

      // Send failure notification
      await EmailNotificationService.notifyFailedDeposit(payment, transaction);

      // Check if retry is possible
      const retryAttempts = payment.retryAttempts || 0;
      if (retryAttempts < 3 && this.isRetryableFailure(providerData)) {
        await this.schedulePaymentRetry(payment, retryAttempts + 1);
      } else {
        // Mark transaction as requiring manual intervention
        await storage.updateTransaction(transaction.id, {
          notes: `${transaction.notes || ''}\nPayment failed: ${providerData.reason || 'Unknown error'}`
        });
      }

      console.log(`Payment ${payment.id} declined/failed: ${providerData.reason || 'Unknown'}`);
    } catch (error) {
      console.error('Error handling declined payment:', error);
    }
  }

  /**
   * Schedules automatic payment retry for retryable failures
   */
  private static async schedulePaymentRetry(payment: any, attemptNumber: number): Promise<void> {
    try {
      // Update payment with retry information
      await storage.updatePaymentStatus(
        payment.id,
        'pending_retry',
        {
          retryAttempts: attemptNumber,
          nextRetryAt: new Date(Date.now() + (attemptNumber * 30 * 60 * 1000)).toISOString(), // Exponential backoff
          lastRetryReason: 'Automatic retry scheduled'
        }
      );

      // In a real system, you would schedule this with a job queue
      setTimeout(async () => {
        await this.retryPaymentProcessing(payment.id);
      }, attemptNumber * 30 * 60 * 1000); // 30 min, 1 hour, 1.5 hours

      console.log(`Payment ${payment.id} scheduled for retry ${attemptNumber} in ${attemptNumber * 30} minutes`);
    } catch (error) {
      console.error('Error scheduling payment retry:', error);
    }
  }

  /**
   * Retries payment processing
   */
  private static async retryPaymentProcessing(paymentId: number): Promise<void> {
    try {
      const payment = await storage.getPayment(paymentId);
      if (!payment || payment.status !== 'pending_retry') {
        return;
      }

      // Update status to pending and attempt reprocessing
      await storage.updatePaymentStatus(paymentId, 'pending', {
        retryProcessedAt: new Date().toISOString()
      });

      // In a real system, you would resubmit to payment processor
      console.log(`Retrying payment processing for payment ${paymentId}`);
    } catch (error) {
      console.error('Error retrying payment:', error);
    }
  }

  /**
   * Maps external payment status to internal status
   */
  private static mapExternalStatusToInternal(externalStatus: string): string {
    switch (externalStatus.toLowerCase()) {
      case 'accepted':
      case 'succeeded':
      case 'completed':
        return 'completed';
      case 'declined':
      case 'failed':
      case 'rejected':
        return 'failed';
      case 'pending':
      case 'processing':
        return 'confirming';
      default:
        return 'pending';
    }
  }

  /**
   * Determines if a payment failure is retryable
   */
  private static isRetryableFailure(providerData: any): boolean {
    const retryableReasons = [
      'insufficient_funds',
      'temporary_failure',
      'network_error',
      'timeout',
      'processing_error'
    ];

    const reason = providerData.reason || providerData.error_code || '';
    return retryableReasons.some(retryable => 
      reason.toLowerCase().includes(retryable)
    );
  }

  /**
   * Monitors pending payments for status updates
   */
  static async monitorPendingPayments(): Promise<void> {
    try {
      const payments = await storage.getAllPayments();
      const pendingPayments = payments.filter(p => 
        ['pending', 'confirming'].includes(p.status) &&
        p.externalPaymentId
      );

      for (const payment of pendingPayments) {
        // Check if payment is older than 10 minutes without update
        const createdAt = new Date(payment.createdAt || Date.now());
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        if (createdAt < tenMinutesAgo) {
          await this.checkPaymentStatus(payment);
        }
      }
    } catch (error) {
      console.error('Error monitoring pending payments:', error);
    }
  }

  /**
   * Checks individual payment status with external provider
   */
  private static async checkPaymentStatus(payment: any): Promise<void> {
    try {
      // In a real system, you would query the payment provider's API
      // For simulation, we'll randomly assign status based on payment method
      const simulatedStatus = this.simulatePaymentStatusCheck(payment);
      
      if (simulatedStatus !== payment.status) {
        await this.processPaymentStatusUpdate(
          payment.externalPaymentId,
          simulatedStatus,
          {
            reason: 'Status check update',
            checkTime: new Date().toISOString()
          },
          'status_check'
        );
      }
    } catch (error) {
      console.error(`Error checking status for payment ${payment.id}:`, error);
    }
  }

  /**
   * Simulates payment status checking (for development)
   */
  private static simulatePaymentStatusCheck(payment: any): 'accepted' | 'declined' | 'pending' {
    // Simulate different success rates for different payment methods
    const random = Math.random();
    
    if (payment.paymentMethod === 'cash') {
      return 'accepted'; // Cash always succeeds once confirmed
    } else if (payment.paymentMethod === 'stripe') {
      return random > 0.05 ? 'accepted' : 'declined'; // 95% success rate
    } else if (payment.paymentMethod === 'paypal') {
      return random > 0.03 ? 'accepted' : 'declined'; // 97% success rate
    }
    
    return random > 0.1 ? 'accepted' : 'declined'; // 90% default success rate
  }

  /**
   * Generates payment detection analytics
   */
  static async generateDetectionAnalytics(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const payments = await storage.getAllPayments();
      let filteredPayments = payments;

      if (dateRange) {
        // Would need createdAt field for proper filtering
        filteredPayments = payments; // For now, return all
      }

      const statusCounts = filteredPayments.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const methodSuccess = ['stripe', 'paypal', 'cash'].map(method => {
        const methodPayments = filteredPayments.filter(p => p.paymentMethod === method);
        const successful = methodPayments.filter(p => p.status === 'completed').length;
        
        return {
          method,
          total: methodPayments.length,
          successful,
          failed: methodPayments.filter(p => p.status === 'failed').length,
          successRate: methodPayments.length > 0 ? (successful / methodPayments.length) * 100 : 0
        };
      });

      return {
        totalPayments: filteredPayments.length,
        statusBreakdown: statusCounts,
        methodPerformance: methodSuccess,
        pendingPayments: filteredPayments.filter(p => ['pending', 'confirming'].includes(p.status)).length,
        retryableFailures: filteredPayments.filter(p => 
          p.status === 'failed' && (p.retryAttempts || 0) < 3
        ).length
      };
    } catch (error) {
      console.error('Error generating detection analytics:', error);
      return null;
    }
  }
}