/**
 * Payment Method Performance Analytics Engine
 * Analyzes payment method effectiveness and generates insights
 */

import { storage } from "./storage";

export class PaymentAnalyticsEngine {
  /**
   * Generates comprehensive payment method performance report
   */
  static async generatePaymentMethodAnalytics(
    locationId?: number,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    try {
      const payments = await storage.getAllPayments();
      const transactions = await storage.getAllTransactions();
      const paymentMethods = await storage.getAllPaymentMethods();

      // Filter by location and date if specified
      let filteredTransactions = transactions;
      if (locationId) {
        filteredTransactions = transactions.filter(tx => tx.locationId === locationId);
      }

      const transactionIds = new Set(filteredTransactions.map(tx => tx.id));
      let filteredPayments = payments.filter(p => transactionIds.has(p.transactionId));

      if (dateRange) {
        // Would need createdAt field on payments for proper date filtering
        filteredPayments = filteredPayments.filter(p => {
          // Using transaction's borrowDate as proxy for payment date
          const transaction = filteredTransactions.find(tx => tx.id === p.transactionId);
          return transaction && 
                 transaction.borrowDate >= dateRange.start && 
                 transaction.borrowDate <= dateRange.end;
        });
      }

      // Calculate performance metrics by payment method
      const methodPerformance = paymentMethods.map(method => {
        const methodPayments = filteredPayments.filter(p => p.paymentMethod === method.name);
        
        const totalAttempts = methodPayments.length;
        const successfulPayments = methodPayments.filter(p => p.status === 'completed');
        const failedPayments = methodPayments.filter(p => p.status === 'failed');
        const pendingPayments = methodPayments.filter(p => p.status === 'confirming');

        const successRate = totalAttempts > 0 ? (successfulPayments.length / totalAttempts) * 100 : 0;
        const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.totalAmount, 0);
        const averageAmount = successfulPayments.length > 0 ? 
          totalRevenue / successfulPayments.length : 0;

        return {
          methodName: method.name,
          methodId: method.id,
          isActive: method.isActive,
          processingFeePercent: method.processingFeePercent || 0,
          totalAttempts,
          successfulPayments: successfulPayments.length,
          failedPayments: failedPayments.length,
          pendingPayments: pendingPayments.length,
          successRate: Math.round(successRate * 100) / 100,
          totalRevenue,
          averageAmount: Math.round(averageAmount * 100) / 100,
          netRevenue: totalRevenue - (totalRevenue * ((method.processingFeePercent || 0) / 10000))
        };
      });

      // Overall analytics
      const totalPayments = filteredPayments.length;
      const totalRevenue = filteredPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const statusBreakdown = {
        completed: filteredPayments.filter(p => p.status === 'completed').length,
        failed: filteredPayments.filter(p => p.status === 'failed').length,
        confirming: filteredPayments.filter(p => p.status === 'confirming').length,
        pending: filteredPayments.filter(p => p.status === 'pending').length
      };

      // Top performing methods
      const topMethods = methodPerformance
        .filter(m => m.totalAttempts > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3);

      // Problem methods needing attention
      const problemMethods = methodPerformance
        .filter(m => m.totalAttempts > 5 && m.successRate < 50)
        .sort((a, b) => a.successRate - b.successRate);

      return {
        summary: {
          totalPayments,
          totalRevenue,
          averageSuccessRate: methodPerformance.length > 0 ? 
            methodPerformance.reduce((sum, m) => sum + m.successRate, 0) / methodPerformance.length : 0,
          statusBreakdown
        },
        methodPerformance,
        insights: {
          topPerforming: topMethods,
          needingAttention: problemMethods,
          recommendations: this.generateRecommendations(methodPerformance)
        },
        dateRange,
        locationId
      };
    } catch (error) {
      console.error('Payment analytics generation error:', error);
      throw error;
    }
  }

  /**
   * Generates actionable recommendations based on payment method performance
   */
  private static generateRecommendations(methodPerformance: any[]): string[] {
    const recommendations: string[] = [];

    // Check for methods with low success rates
    const lowPerformers = methodPerformance.filter(m => 
      m.totalAttempts > 10 && m.successRate < 70
    );

    if (lowPerformers.length > 0) {
      recommendations.push(
        `Consider reviewing ${lowPerformers.map(m => m.methodName).join(', ')} - success rates below 70%`
      );
    }

    // Check for unused methods
    const unusedMethods = methodPerformance.filter(m => 
      m.isActive && m.totalAttempts === 0
    );

    if (unusedMethods.length > 0) {
      recommendations.push(
        `Consider promoting or reviewing configuration for unused methods: ${unusedMethods.map(m => m.methodName).join(', ')}`
      );
    }

    // Check for high-fee methods with alternatives
    const highFeeMethods = methodPerformance.filter(m => 
      m.processingFeePercent > 500 && m.totalAttempts > 0
    );

    if (highFeeMethods.length > 0) {
      recommendations.push(
        `High processing fees detected for ${highFeeMethods.map(m => m.methodName).join(', ')} - consider promoting lower-fee alternatives`
      );
    }

    // Revenue optimization suggestions
    const totalRevenue = methodPerformance.reduce((sum, m) => sum + m.totalRevenue, 0);
    if (totalRevenue > 0) {
      const topRevenueMethod = methodPerformance
        .filter(m => m.totalRevenue > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

      if (topRevenueMethod && topRevenueMethod.successRate > 80) {
        recommendations.push(
          `${topRevenueMethod.methodName} is your top revenue generator with high success rate - consider featuring it prominently`
        );
      }
    }

    return recommendations;
  }

  /**
   * Generates deposit reconciliation report
   */
  static async generateDepositReconciliation(
    locationId?: number,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    try {
      const transactions = await storage.getAllTransactions();
      const payments = await storage.getAllPayments();

      let filteredTransactions = transactions;
      if (locationId) {
        filteredTransactions = transactions.filter(tx => tx.locationId === locationId);
      }

      if (dateRange) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.borrowDate >= dateRange.start && tx.borrowDate <= dateRange.end
        );
      }

      const transactionIds = new Set(filteredTransactions.map(tx => tx.id));
      const relatedPayments = payments.filter(p => transactionIds.has(p.transactionId));

      // Reconciliation analysis
      const expectedDeposits = filteredTransactions.reduce((sum, tx) => sum + tx.depositAmount, 0);
      const actualDeposits = relatedPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalAmount, 0);
      
      const pendingDeposits = relatedPayments
        .filter(p => p.status === 'confirming' || p.status === 'pending')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const refundedDeposits = relatedPayments
        .filter(p => p.status.includes('refund'))
        .reduce((sum, p) => sum + p.totalAmount, 0);

      return {
        summary: {
          totalTransactions: filteredTransactions.length,
          expectedDeposits,
          actualDeposits,
          pendingDeposits,
          refundedDeposits,
          variance: actualDeposits - expectedDeposits,
          reconciliationRate: expectedDeposits > 0 ? (actualDeposits / expectedDeposits) * 100 : 0
        },
        details: {
          completedTransactions: filteredTransactions.filter(tx => {
            const payment = relatedPayments.find(p => 
              p.transactionId === tx.id && p.status === 'completed'
            );
            return payment !== undefined;
          }).length,
          pendingTransactions: filteredTransactions.filter(tx => {
            const payment = relatedPayments.find(p => 
              p.transactionId === tx.id && (p.status === 'confirming' || p.status === 'pending')
            );
            return payment !== undefined;
          }).length,
          returnedItems: filteredTransactions.filter(tx => tx.isReturned).length
        },
        dateRange,
        locationId
      };
    } catch (error) {
      console.error('Reconciliation report error:', error);
      throw error;
    }
  }
}