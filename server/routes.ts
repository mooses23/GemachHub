import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertLocationSchema,
  insertGemachApplicationSchema,
  insertContactSchema,
  insertTransactionSchema
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

  const httpServer = createServer(app);

  return httpServer;
}
