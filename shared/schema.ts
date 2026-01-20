import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"), // "operator", "admin"
  isAdmin: boolean("is_admin").default(false),
  locationId: integer("location_id"), // Associated gemach location (for operators)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isAdmin: true,
  locationId: true,
}).extend({
  inviteCode: z.string().min(1, "Invite code is required"),
});

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Region schema (for grouping locations by continent)
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertRegionSchema = createInsertSchema(regions).pick({
  name: true,
  slug: true,
  displayOrder: true,
});

// City Category schema (for grouping locations within regions)
export const cityCategories = pgTable("city_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "New York", "Los Angeles", "London"
  slug: text("slug").notNull(), // e.g., "new-york", "los-angeles", "london"
  regionId: integer("region_id").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isPopular: boolean("is_popular").default(false), // Admin can mark as popular city
  description: text("description"), // Optional description for the city category
});

export const insertCityCategorySchema = createInsertSchema(cityCategories).pick({
  name: true,
  slug: true,
  regionId: true,
  displayOrder: true,
  isPopular: true,
  description: true,
});

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationCode: text("location_code").notNull().unique(),
  contactPerson: text("contact_person").notNull(),
  address: text("address").notNull(),
  zipCode: text("zip_code"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  regionId: integer("region_id").notNull(),
  cityCategoryId: integer("city_category_id"), // Optional city category assignment
  isActive: boolean("is_active").default(true),
  inventoryCount: integer("inventory_count").default(0),
  cashOnly: boolean("cash_only").default(false),
  depositAmount: integer("deposit_amount").default(20),
  paymentMethods: text("payment_methods").array().default(["cash"]),
  processingFeePercent: integer("processing_fee_percent").default(300), // 3.00% stored as 300 basis points
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  locationCode: true,
  contactPerson: true,
  address: true,
  zipCode: true,
  phone: true,
  email: true,
  regionId: true,
  cityCategoryId: true,
  isActive: true,
  inventoryCount: true,
  cashOnly: true,
  depositAmount: true,
  paymentMethods: true,
  processingFeePercent: true,
});

// GemachApplication schema
export const gemachApplications = pgTable("gemach_applications", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertGemachApplicationSchema = createInsertSchema(gemachApplications).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  location: true,
  message: true,
});

// Invite Codes schema (for operator registration)
export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  locationId: integer("location_id").notNull(),
  applicationId: integer("application_id"),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
  usedByUserId: integer("used_by_user_id"),
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).pick({
  code: true,
  locationId: true,
  applicationId: true,
});

// Transaction schema (for deposit tracking)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  borrowerName: text("borrower_name").notNull(),
  borrowerEmail: text("borrower_email"),
  borrowerPhone: text("borrower_phone"),
  depositAmount: doublePrecision("deposit_amount").notNull().default(20), // Default $20
  isReturned: boolean("is_returned").default(false),
  borrowDate: timestamp("borrow_date").notNull().defaultNow(),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  notes: text("notes"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  locationId: true,
  borrowerName: true,
  borrowerEmail: true,
  borrowerPhone: true,
  depositAmount: true,
  expectedReturnDate: true,
  notes: true,
}).extend({
  expectedReturnDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str)),
  ]).optional(),
});

// Contact schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  subject: true,
  message: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type GemachApplication = typeof gemachApplications.$inferSelect;
export type InsertGemachApplication = z.infer<typeof insertGemachApplicationSchema>;

export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Global Settings schema
export const globalSettings = pgTable("global_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  isEnabled: boolean("is_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGlobalSettingSchema = createInsertSchema(globalSettings).pick({
  key: true,
  value: true,
  isEnabled: true,
});

export type GlobalSetting = typeof globalSettings.$inferSelect;
export type InsertGlobalSetting = z.infer<typeof insertGlobalSettingSchema>;

// Payment Methods Configuration
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "stripe", "paypal", "square", "cash", "venmo", "zelle"
  displayName: text("display_name").notNull(), // "Credit/Debit Card", "PayPal", etc.
  provider: text("provider"), // "stripe", "paypal", "square" - null for cash/manual methods
  isActive: boolean("is_active").default(true),
  isAvailableToLocations: boolean("is_available_to_locations").default(false),
  processingFeePercent: integer("processing_fee_percent").default(0), // stored as basis points (290 = 2.9%)
  fixedFee: integer("fixed_fee").default(0), // in cents
  requiresApi: boolean("requires_api").default(false),
  apiKey: text("api_key"), // encrypted API key
  apiSecret: text("api_secret"), // encrypted API secret  
  webhookSecret: text("webhook_secret"), // encrypted webhook secret
  isConfigured: boolean("is_configured").default(false), // true when API credentials are provided
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  name: true,
  displayName: true,
  provider: true,
  isActive: true,
  isAvailableToLocations: true,
  processingFeePercent: true,
  fixedFee: true,
  requiresApi: true,
  apiKey: true,
  apiSecret: true,
  webhookSecret: true,
  isConfigured: true,
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// City category type definitions
export type CityCategory = typeof cityCategories.$inferSelect;
export type InsertCityCategory = z.infer<typeof insertCityCategorySchema>;

// Location Payment Methods (which methods each location accepts)
export const locationPaymentMethods = pgTable("location_payment_methods", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  paymentMethodId: integer("payment_method_id").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  customProcessingFee: integer("custom_processing_fee"), // override global fee if set
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLocationPaymentMethodSchema = createInsertSchema(locationPaymentMethods).pick({
  locationId: true,
  paymentMethodId: true,
  isEnabled: true,
  customProcessingFee: true,
});

export type LocationPaymentMethod = typeof locationPaymentMethods.$inferSelect;
export type InsertLocationPaymentMethod = z.infer<typeof insertLocationPaymentMethodSchema>;

// Payment schema for tracking payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  paymentMethod: text("payment_method").notNull(), // "cash", "stripe", "paypal", "square"
  paymentProvider: text("payment_provider"), // "stripe", "paypal", "square" 
  externalPaymentId: text("external_payment_id"), // Provider's payment ID
  depositAmount: integer("deposit_amount").notNull(),
  processingFee: integer("processing_fee").default(0),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirming", "completed", "failed", "refunded"
  paymentData: text("payment_data"), // JSON string of provider response
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  transactionId: true,
  paymentMethod: true,
  paymentProvider: true,
  externalPaymentId: true,
  depositAmount: true,
  processingFee: true,
  totalAmount: true,
  status: true,
  paymentData: true,
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
