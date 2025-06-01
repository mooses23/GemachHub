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
});

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Region schema (for grouping locations)
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
  isActive: boolean("is_active").default(true),
  inventoryCount: integer("inventory_count").default(0),
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
  isActive: true,
  inventoryCount: true,
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

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
