import {
  users, type User, type InsertUser,
  regions, type Region, type InsertRegion,
  locations, type Location, type InsertLocation,
  gemachApplications, type GemachApplication, type InsertGemachApplication,
  transactions, type Transaction, type InsertTransaction,
  contacts, type Contact, type InsertContact
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Region operations
  getAllRegions(): Promise<Region[]>;
  getRegion(id: number): Promise<Region | undefined>;
  getRegionBySlug(slug: string): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: number, data: Partial<InsertRegion>): Promise<Region>;

  // Location operations
  getAllLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByRegionId(regionId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, data: Partial<InsertLocation>): Promise<Location>;

  // GemachApplication operations
  getAllApplications(): Promise<GemachApplication[]>;
  getApplication(id: number): Promise<GemachApplication | undefined>;
  createApplication(application: InsertGemachApplication): Promise<GemachApplication>;
  updateApplication(id: number, data: Partial<InsertGemachApplication>): Promise<GemachApplication>;

  // Transaction operations
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByLocation(locationId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction>;
  markTransactionReturned(id: number): Promise<Transaction>;

  // Contact operations
  getAllContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  markContactRead(id: number): Promise<Contact>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private regions: Map<number, Region>;
  private locations: Map<number, Location>;
  private applications: Map<number, GemachApplication>;
  private transactions: Map<number, Transaction>;
  private contacts: Map<number, Contact>;

  private userCounter: number;
  private regionCounter: number;
  private locationCounter: number;
  private applicationCounter: number;
  private transactionCounter: number;
  private contactCounter: number;

  constructor() {
    this.users = new Map();
    this.regions = new Map();
    this.locations = new Map();
    this.applications = new Map();
    this.transactions = new Map();
    this.contacts = new Map();

    this.userCounter = 1;
    this.regionCounter = 1;
    this.locationCounter = 1;
    this.applicationCounter = 1;
    this.transactionCounter = 1;
    this.contactCounter = 1;

    // Initialize with default regions
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default regions
    const defaultRegions: InsertRegion[] = [
      { name: "United States", slug: "united-states", displayOrder: 1 },
      { name: "Canada", slug: "canada", displayOrder: 2 },
      { name: "Australia", slug: "australia", displayOrder: 3 },
      { name: "Europe", slug: "europe", displayOrder: 4 },
      { name: "Israel", slug: "israel", displayOrder: 5 }
    ];

    defaultRegions.forEach(region => this.createRegion(region));

    // Add some sample locations
    const sampleLocations: InsertLocation[] = [
      {
        name: "Brooklyn Earmuffs Gemach",
        contactPerson: "Sarah Goldstein",
        address: "1234 Ocean Avenue, Brooklyn, NY",
        phone: "(718) 555-0123",
        email: "brooklyn@earmuffsgemach.com",
        regionId: 1, // United States
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Los Angeles Earmuffs Gemach",
        contactPerson: "Rachel Cohen",
        address: "5678 Wilshire Blvd, Los Angeles, CA",
        phone: "(323) 555-0187",
        email: "la@earmuffsgemach.com",
        regionId: 1, // United States
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Toronto Earmuffs Gemach",
        contactPerson: "Esther Greenbaum",
        address: "456 Bathurst Street, Toronto, ON",
        phone: "(416) 555-0123",
        email: "toronto@earmuffsgemach.com",
        regionId: 2, // Canada
        isActive: true,
        inventoryCount: 6
      }
    ];

    sampleLocations.forEach(location => this.createLocation(location));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Region methods
  async getAllRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async getRegion(id: number): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async getRegionBySlug(slug: string): Promise<Region | undefined> {
    return Array.from(this.regions.values()).find(
      (region) => region.slug === slug
    );
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = this.regionCounter++;
    const region: Region = { ...insertRegion, id };
    this.regions.set(id, region);
    return region;
  }

  async updateRegion(id: number, data: Partial<InsertRegion>): Promise<Region> {
    const region = this.regions.get(id);
    if (!region) {
      throw new Error(`Region with id ${id} not found`);
    }
    
    const updatedRegion = { ...region, ...data };
    this.regions.set(id, updatedRegion);
    return updatedRegion;
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationsByRegionId(regionId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.regionId === regionId
    );
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationCounter++;
    const location: Location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: number, data: Partial<InsertLocation>): Promise<Location> {
    const location = this.locations.get(id);
    if (!location) {
      throw new Error(`Location with id ${id} not found`);
    }
    
    const updatedLocation = { ...location, ...data };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  // GemachApplication methods
  async getAllApplications(): Promise<GemachApplication[]> {
    return Array.from(this.applications.values());
  }

  async getApplication(id: number): Promise<GemachApplication | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertGemachApplication): Promise<GemachApplication> {
    const id = this.applicationCounter++;
    const application: GemachApplication = { 
      ...insertApplication, 
      id, 
      status: "pending",
      submittedAt: new Date().toISOString() 
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: number, data: Partial<InsertGemachApplication>): Promise<GemachApplication> {
    const application = this.applications.get(id);
    if (!application) {
      throw new Error(`Application with id ${id} not found`);
    }
    
    const updatedApplication = { ...application, ...data };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByLocation(locationId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.locationId === locationId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCounter++;
    
    // Convert expectedReturnDate to string if it's a Date
    const expectedReturnDate = insertTransaction.expectedReturnDate instanceof Date 
      ? insertTransaction.expectedReturnDate.toISOString() 
      : insertTransaction.expectedReturnDate;
      
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      isReturned: false,
      borrowDate: new Date().toISOString(),
      actualReturnDate: null,
      expectedReturnDate
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    
    const updatedTransaction = { ...transaction, ...data };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async markTransactionReturned(id: number): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    
    const updatedTransaction: Transaction = { 
      ...transaction, 
      isReturned: true,
      actualReturnDate: new Date().toISOString()
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Contact methods
  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactCounter++;
    const contact: Contact = { 
      ...insertContact, 
      id, 
      submittedAt: new Date().toISOString(),
      isRead: false
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async markContactRead(id: number): Promise<Contact> {
    const contact = this.contacts.get(id);
    if (!contact) {
      throw new Error(`Contact with id ${id} not found`);
    }
    
    const updatedContact: Contact = { ...contact, isRead: true };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }
}

export const storage = new MemStorage();
