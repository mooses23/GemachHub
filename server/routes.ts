import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PaymentSyncService } from "./payment-sync";
import { DepositSyncService } from "./deposit-sync";
import { z } from "zod";
import { 
  insertLocationSchema,
  insertGemachApplicationSchema,
  insertContactSchema,
  insertTransactionSchema,
  insertPaymentSchema,
  insertPaymentMethodSchema,
  insertLocationPaymentMethodSchema
} from "@shared/schema";
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
