// Re-export types and schemas from shared schema for client use
export type { 
  User,
  Region, 
  Location, 
  GemachApplication, 
  Transaction, 
  Contact,
  Payment,
  PaymentMethod,
  LocationPaymentMethod,
  InsertGemachApplication,
  InsertContact,
  InsertTransaction
} from "@shared/schema";

export { 
  insertGemachApplicationSchema,
  insertContactSchema,
  insertTransactionSchema
} from "@shared/schema";