import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PaymentSyncService } from "./payment-sync";
import { DepositSyncService } from "./deposit-sync";
import { DepositRefundService } from "./deposit-refund";
import { EmailNotificationService } from "./email-notifications";
import { AuditTrailService } from "./audit-trail";
import { PaymentAnalyticsEngine } from "./analytics-engine";
import { DepositDetectionService } from "./deposit-detection";
import { z } from "zod";

// Utility function to detect card brand
function detectCardBrand(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const firstDigit = cleanNumber.charAt(0);
  const firstTwo = cleanNumber.substring(0, 2);
  const firstFour = cleanNumber.substring(0, 4);
  
  if (firstDigit === '4') return 'Visa';
  if (firstTwo >= '51' && firstTwo <= '55') return 'Mastercard';
  if (['34', '37'].includes(firstTwo)) return 'American Express';
  if (firstFour === '6011' || firstTwo === '65') return 'Discover';
  return 'Unknown';
}
import { 
  insertLocationSchema,
  insertGemachApplicationSchema,
  insertContactSchema,
  insertTransactionSchema,
  insertPaymentSchema,
  insertPaymentMethodSchema,
  insertLocationPaymentMethodSchema
} from "../shared/schema";
import { setupAuth, requireRole, requireOperatorForLocation, createTestUsers } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Create test users for demonstration
  await createTestUsers();
  // REGIONS ROUTES
  app.get("/api/regions", async (req, res) => {
    try {
      const regions = await storage.getAllRegions();
      res.json(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ message: "Failed to fetch regions" });
    }
  });

  app.post("/api/regions", async (req, res) => {
    try {
      const regionData = req.body;
      const region = await storage.createRegion(regionData);
      res.status(201).json(region);
    } catch (error) {
      console.error("Error creating region:", error);
      res.status(500).json({ message: "Failed to create region" });
    }
  });

  // LOCATIONS ROUTES
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get("/api/regions/:slug/locations", async (req, res) => {
    try {
      const { slug } = req.params;
      const region = await storage.getRegionBySlug(slug);
      
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }
      
      const locations = await storage.getLocationsByRegionId(region.id);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations by region:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.errors });
      }
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.patch("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const updatedLocation = await storage.updateLocation(id, req.body);
      res.json(updatedLocation);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // APPLICATIONS ROUTES
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const applicationData = insertGemachApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const application = await storage.getApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const updatedApplication = await storage.updateApplication(id, req.body);
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // TRANSACTIONS ROUTES
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      // Handle expectedReturnDate conversion if needed
      if (req.body.expectedReturnDate && typeof req.body.expectedReturnDate === 'string') {
        req.body.expectedReturnDate = new Date(req.body.expectedReturnDate);
      }
      
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const updatedTransaction = await storage.updateTransaction(id, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Require authentication for returning transactions
  app.patch("/api/transactions/:id/return", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is authenticated and has permission for this transaction's location
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required to process returns" });
      }
      
      const user = req.user as Express.User;
      
      // Admin can return any transaction
      if (!user.isAdmin) {
        // Operator can only process returns for their location
        if (user.role !== "operator" || user.locationId !== transaction.locationId) {
          return res.status(403).json({ 
            message: "You don't have permission to process returns for this location" 
          });
        }
      }
      
      const updatedTransaction = await storage.markTransactionReturned(id);
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error marking transaction as returned:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Operator-specific routes
  app.get("/api/operator/transactions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.user as Express.User;
      
      if (user.role !== "operator" && !user.isAdmin) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      // If admin, get all transactions; if operator, get only their location's transactions
      let transactions;
      if (user.isAdmin) {
        transactions = await storage.getAllTransactions();
      } else {
        if (!user.locationId) {
          return res.status(400).json({ message: "Operator not associated with a location" });
        }
        transactions = await storage.getTransactionsByLocation(user.locationId);
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching operator transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Get operator's location info
  app.get("/api/operator/location", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.user as Express.User;
      
      if (user.role !== "operator" && !user.isAdmin) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      // For admins, return a summary location for mass management
      if (user.isAdmin) {
        const allLocations = await storage.getAllLocations();
        const totalInventory = allLocations.reduce((sum, loc) => sum + (loc.inventoryCount || 0), 0);
        
        const adminLocation = {
          id: 0,
          name: "Admin - All Locations",
          locationCode: "ADMIN",
          contactPerson: "System Administrator",
          address: "All Locations",
          zipCode: "00000",
          phone: "System",
          email: user.email,
          regionId: 0,
          isActive: true,
          inventoryCount: totalInventory,
          cashOnly: false
        };
        
        return res.json(adminLocation);
      }
      
      if (!user.locationId) {
        return res.status(400).json({ message: "User not associated with a location" });
      }
      
      const location = await storage.getLocation(user.locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching operator location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });
  
  // CONTACT ROUTES
  app.get("/api/contact", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/contact/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const updatedContact = await storage.markContactRead(id);
      res.json(updatedContact);
    } catch (error) {
      console.error("Error marking contact as read:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // PAYMENT ROUTES
  app.get("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/transaction/:transactionId", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId, 10);
      const payments = await storage.getPaymentsByTransaction(transactionId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments for transaction:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, paymentData } = req.body;
      
      const payment = await storage.updatePaymentStatus(id, status, paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Payment confirmation routes
  app.post("/api/payments/:id/confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const paymentId = parseInt(req.params.id);
      const { confirmationCode, notes, confirmed } = req.body;
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status !== "confirming" && payment.status !== "pending") {
        return res.status(400).json({ message: "Payment cannot be confirmed in current status" });
      }

      const paymentData = payment.paymentData ? JSON.parse(payment.paymentData) : {};
      const updatedPaymentData = {
        ...paymentData,
        confirmationCode,
        confirmationNotes: notes,
        confirmedAt: new Date().toISOString(),
        confirmedBy: req.user?.username || "system"
      };

      const updatedPayment = await storage.updatePaymentStatus(
        paymentId,
        confirmed ? "completed" : "failed",
        updatedPaymentData
      );

      // Sync deposit confirmation across the system
      await DepositSyncService.syncDepositConfirmation(
        paymentId, 
        confirmed ? "completed" : "failed", 
        updatedPaymentData
      );

      // Log audit trail
      await AuditTrailService.logDepositConfirmation(
        req.user.id,
        req.user.username,
        paymentId,
        "confirming",
        confirmed ? "completed" : "failed",
        updatedPaymentData,
        { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      );

      // Send email notifications
      if (confirmed) {
        const transaction = await storage.getTransaction(payment.transactionId);
        await EmailNotificationService.notifyDepositConfirmed(updatedPayment, transaction);
      } else {
        const transaction = await storage.getTransaction(payment.transactionId);
        await EmailNotificationService.notifyFailedDeposit(updatedPayment, transaction);
      }

      res.json(updatedPayment);
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ message: "Error confirming payment" });
    }
  });

  app.post("/api/payments/:id/reject", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const paymentId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const paymentData = payment.paymentData ? JSON.parse(payment.paymentData) : {};
      const updatedPaymentData = {
        ...paymentData,
        rejectionNotes: notes,
        rejectedAt: new Date().toISOString(),
        rejectedBy: req.user?.username || "system"
      };

      const updatedPayment = await storage.updatePaymentStatus(
        paymentId,
        "failed",
        updatedPaymentData
      );

      res.json(updatedPayment);
    } catch (error) {
      console.error("Payment rejection error:", error);
      res.status(500).json({ message: "Error rejecting payment" });
    }
  });

  // Bulk deposit operations for operators
  app.post("/api/deposits/bulk-confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { paymentIds } = req.body;
      if (!Array.isArray(paymentIds)) {
        return res.status(400).json({ message: "paymentIds must be an array" });
      }

      const result = await DepositSyncService.bulkConfirmDeposits(
        paymentIds, 
        req.user.id
      );

      res.json({
        success: result.success,
        failed: result.failed,
        total: paymentIds.length,
        message: `Successfully confirmed ${result.success} deposits${result.failed > 0 ? `, ${result.failed} failed` : ''}`
      });
    } catch (error) {
      console.error("Bulk confirmation error:", error);
      res.status(500).json({ message: "Error processing bulk confirmation" });
    }
  });

  // Deposit analytics endpoint
  app.get("/api/deposits/analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      const analytics = await DepositSyncService.generateDepositAnalytics(locationId);

      res.json(analytics);
    } catch (error) {
      console.error("Analytics generation error:", error);
      res.status(500).json({ message: "Error generating analytics" });
    }
  });

  // Item return and refund processing
  app.post("/api/transactions/:id/return", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const transactionId = parseInt(req.params.id);
      const { condition, returnNotes, refundAmount } = req.body;

      const result = await DepositRefundService.processItemReturn(transactionId, {
        actualReturnDate: new Date(),
        returnNotes,
        condition,
        refundAmount
      });

      // Log refund in audit trail
      await AuditTrailService.logRefundProcessing(
        req.user.id,
        req.user.username,
        transactionId,
        result.refundAmount,
        condition || 'good',
        { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      );

      // Send refund notification
      if (result.refundAmount > 0) {
        await EmailNotificationService.notifyRefundProcessed(
          result.refundAmount,
          result.transaction
        );
      }

      res.json(result);
    } catch (error) {
      console.error("Return processing error:", error);
      res.status(500).json({ message: "Error processing return" });
    }
  });

  // Payment method analytics
  app.get("/api/analytics/payment-methods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

      const analytics = await PaymentAnalyticsEngine.generatePaymentMethodAnalytics(
        locationId,
        dateRange
      );

      res.json(analytics);
    } catch (error) {
      console.error("Payment analytics error:", error);
      res.status(500).json({ message: "Error generating payment analytics" });
    }
  });

  // Deposit reconciliation report
  app.get("/api/reports/reconciliation", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

      const report = await PaymentAnalyticsEngine.generateDepositReconciliation(
        locationId,
        dateRange
      );

      res.json(report);
    } catch (error) {
      console.error("Reconciliation report error:", error);
      res.status(500).json({ message: "Error generating reconciliation report" });
    }
  });

  // Audit trail access
  app.get("/api/audit-trail", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const entries = await AuditTrailService.getRecentAuditEntries(limit);

      res.json(entries);
    } catch (error) {
      console.error("Audit trail error:", error);
      res.status(500).json({ message: "Error retrieving audit trail" });
    }
  });

  // WEBHOOK ENDPOINTS FOR REAL-TIME PAYMENT STATUS DETECTION
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const { id, object, type, data } = req.body;
      
      if (type === 'payment_intent.succeeded') {
        await DepositDetectionService.processPaymentStatusUpdate(
          data.object.id,
          'accepted',
          {
            stripe_payment_intent_id: data.object.id,
            amount_received: data.object.amount_received,
            currency: data.object.currency,
            payment_method: data.object.payment_method
          },
          'stripe_webhook'
        );
      } else if (type === 'payment_intent.payment_failed') {
        await DepositDetectionService.processPaymentStatusUpdate(
          data.object.id,
          'declined',
          {
            stripe_payment_intent_id: data.object.id,
            failure_code: data.object.last_payment_error?.code,
            failure_message: data.object.last_payment_error?.message
          },
          'stripe_webhook'
        );
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const { event_type, resource } = req.body;
      
      if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        await DepositDetectionService.processPaymentStatusUpdate(
          resource.id,
          'accepted',
          {
            paypal_capture_id: resource.id,
            amount: resource.amount,
            status: resource.status
          },
          'paypal_webhook'
        );
      } else if (event_type === 'PAYMENT.CAPTURE.DENIED') {
        await DepositDetectionService.processPaymentStatusUpdate(
          resource.id,
          'declined',
          {
            paypal_capture_id: resource.id,
            reason_code: resource.reason_code
          },
          'paypal_webhook'
        );
      }

      res.json({ received: true });
    } catch (error) {
      console.error("PayPal webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // MANUAL PAYMENT STATUS CHECKING
  app.get("/api/payments/status-check", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await DepositDetectionService.monitorPendingPayments();
      res.json({ message: "Payment status monitoring completed" });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ message: "Error checking payment status" });
    }
  });

  // DEPOSIT DETECTION ANALYTICS
  app.get("/api/analytics/deposit-detection", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

      const analytics = await DepositDetectionService.generateDetectionAnalytics(dateRange);
      res.json(analytics);
    } catch (error) {
      console.error("Detection analytics error:", error);
      res.status(500).json({ message: "Error generating detection analytics" });
    }
  });

  // REAL-TIME STATUS ENDPOINT FOR DASHBOARD
  app.get("/api/realtime-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const payments = await storage.getAllPayments();
      const transactions = await storage.getAllTransactions();

      // Get recent payments (last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentPayments = payments
        .filter(p => p.createdAt && new Date(p.createdAt) > twoHoursAgo)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10)
        .map(payment => {
          const transaction = transactions.find(t => t.id === payment.transactionId);
          return {
            id: payment.id,
            amount: payment.totalAmount,
            status: payment.status,
            method: payment.paymentMethod,
            timestamp: payment.createdAt || new Date().toISOString(),
            borrowerName: transaction?.borrowerName || 'Unknown'
          };
        });

      const pendingCount = payments.filter(p => ['pending', 'confirming'].includes(p.status)).length;
      const completedCount = payments.filter(p => p.status === 'completed').length;
      const successRate = payments.length > 0 ? (completedCount / payments.length) * 100 : 0;

      res.json({
        recentPayments,
        pendingCount,
        successRate,
        lastUpdateTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Real-time status error:", error);
      res.status(500).json({ message: "Error fetching real-time status" });
    }
  });

  // STRIPE PAYMENT PROCESSING
  app.post("/api/stripe-payment", async (req, res) => {
    try {
      const { transactionId, paymentMethod, paymentProvider, depositAmount, totalAmount, cardDetails } = req.body;

      // Create payment record with confirming status
      const payment = await storage.createPayment({
        transactionId,
        paymentMethod,
        paymentProvider,
        depositAmount,
        totalAmount,
        status: "confirming",
        externalPaymentId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // In a real implementation, you would process the card payment here
      // For now, we'll simulate successful processing
      const processedPayment = await storage.updatePaymentStatus(
        payment.id,
        "completed",
        {
          cardLast4: cardDetails.number.slice(-4),
          cardBrand: detectCardBrand(cardDetails.number),
          processedAt: new Date().toISOString()
        }
      );

      res.json(processedPayment);
    } catch (error) {
      console.error("Stripe payment error:", error);
      res.status(500).json({ message: "Error processing credit card payment" });
    }
  });

  // PAYPAL PAYMENT PROCESSING
  app.post("/api/paypal-payment", async (req, res) => {
    try {
      const { transactionId, paymentMethod, paymentProvider, depositAmount, totalAmount, paypalEmail } = req.body;

      // Create payment record with confirming status
      const payment = await storage.createPayment({
        transactionId,
        paymentMethod,
        paymentProvider,
        depositAmount,
        totalAmount,
        status: "confirming",
        externalPaymentId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // In a real implementation, you would process PayPal payment here
      // For now, we'll simulate successful processing
      const processedPayment = await storage.updatePaymentStatus(
        payment.id,
        "completed",
        {
          paypalEmail,
          processedAt: new Date().toISOString()
        }
      );

      res.json(processedPayment);
    } catch (error) {
      console.error("PayPal payment error:", error);
      res.status(500).json({ message: "Error processing PayPal payment" });
    }
  });

  // CASH PAYMENT PROCESSING
  app.post("/api/cash-payment", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { transactionId, locationId } = req.body;
      
      // Get location to determine deposit amount
      const location = await storage.getLocation(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const depositAmount = location.depositAmount || 20;
      
      // Create cash payment record - requires confirmation
      const payment = await storage.createPayment({
        transactionId,
        paymentMethod: "cash",
        depositAmount: depositAmount * 100,
        processingFee: 0, // No processing fee for cash
        totalAmount: depositAmount * 100,
        status: "confirming" // Requires manual confirmation even for cash
      });
      
      res.json({
        paymentId: payment.id,
        status: "confirming",
        amount: depositAmount * 100,
        message: "Payment created - requires confirmation"
      });
    } catch (error) {
      console.error("Error processing cash payment:", error);
      res.status(500).json({ message: "Failed to process cash payment" });
    }
  });

  // PAYMENT METHOD MANAGEMENT ROUTES (Admin only)
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const paymentMethods = await storage.getAllPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/payment-methods", requireRole(["admin"]), async (req, res) => {
    try {
      const methodData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(methodData);
      
      // Sync changes across all locations
      await PaymentSyncService.syncPaymentMethodChanges(method);
      
      res.status(201).json(method);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment method data", errors: error.errors });
      }
      console.error("Error creating payment method:", error);
      res.status(500).json({ message: "Failed to create payment method" });
    }
  });

  app.patch("/api/payment-methods/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updateData = req.body;
      const method = await storage.updatePaymentMethod(id, updateData);
      
      // Sync changes across all locations when admin updates payment methods
      await PaymentSyncService.syncPaymentMethodChanges(method);
      
      res.json(method);
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Failed to update payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deletePaymentMethod(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  // Configure API credentials for payment methods
  app.post("/api/payment-methods/:id/configure", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { apiKey, apiSecret, webhookSecret } = req.body;
      
      // Validate and activate payment method with API credentials
      const success = await PaymentSyncService.validateAndActivatePaymentMethod(id, {
        apiKey,
        apiSecret,
        webhookSecret
      });
      
      if (success) {
        const updatedMethod = await storage.getPaymentMethod(id);
        res.json({ 
          message: "Payment method configured and activated successfully",
          method: updatedMethod,
          synchronized: true
        });
      } else {
        res.status(400).json({ message: "Failed to configure payment method" });
      }
    } catch (error) {
      console.error("Error configuring payment method:", error);
      res.status(500).json({ message: "Failed to configure payment method" });
    }
  });

  // LOCATION PAYMENT METHOD ROUTES
  app.get("/api/locations/:locationId/payment-methods", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId, 10);
      const availableMethods = await storage.getAvailablePaymentMethodsForLocation(locationId);
      const enabledMethods = await storage.getLocationPaymentMethods(locationId);
      
      res.json({
        available: availableMethods,
        enabled: enabledMethods
      });
    } catch (error) {
      console.error("Error fetching location payment methods:", error);
      res.status(500).json({ message: "Failed to fetch location payment methods" });
    }
  });

  app.post("/api/locations/:locationId/payment-methods/:methodId", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId, 10);
      const methodId = parseInt(req.params.methodId, 10);
      const { customFee } = req.body;
      
      const locationMethod = await storage.enablePaymentMethodForLocation(locationId, methodId, customFee);
      res.status(201).json(locationMethod);
    } catch (error) {
      console.error("Error enabling payment method for location:", error);
      res.status(500).json({ message: "Failed to enable payment method" });
    }
  });

  app.delete("/api/locations/:locationId/payment-methods/:methodId", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId, 10);
      const methodId = parseInt(req.params.methodId, 10);
      
      await storage.disablePaymentMethodForLocation(locationId, methodId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error disabling payment method for location:", error);
      res.status(500).json({ message: "Failed to disable payment method" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
