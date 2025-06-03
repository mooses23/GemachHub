import {
  users, type User, type InsertUser,
  regions, type Region, type InsertRegion,
  cityCategories, type CityCategory, type InsertCityCategory,
  locations, type Location, type InsertLocation,
  gemachApplications, type GemachApplication, type InsertGemachApplication,
  transactions, type Transaction, type InsertTransaction,
  contacts, type Contact, type InsertContact,
  payments, type Payment, type InsertPayment,
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  locationPaymentMethods, type LocationPaymentMethod, type InsertLocationPaymentMethod
} from "../shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSystemUser(userData: Omit<InsertUser, 'inviteCode'>): Promise<User>;
  validateInviteCode(code: string): Promise<boolean>;

  // Region operations
  getAllRegions(): Promise<Region[]>;
  getRegion(id: number): Promise<Region | undefined>;
  getRegionBySlug(slug: string): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: number, data: Partial<InsertRegion>): Promise<Region>;

  // City Category operations
  getAllCityCategories(): Promise<CityCategory[]>;
  getCityCategory(id: number): Promise<CityCategory | undefined>;
  getCityCategoriesByRegionId(regionId: number): Promise<CityCategory[]>;
  getPopularCitiesByRegionId(regionId: number): Promise<CityCategory[]>;
  createCityCategory(cityCategory: InsertCityCategory): Promise<CityCategory>;
  updateCityCategory(id: number, data: Partial<InsertCityCategory>): Promise<CityCategory>;
  deleteCityCategory(id: number): Promise<void>;

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

  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByTransaction(transactionId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, paymentData?: any): Promise<Payment>;

  // Payment Method operations
  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;

  // Location Payment Method operations
  getLocationPaymentMethods(locationId: number): Promise<LocationPaymentMethod[]>;
  getAvailablePaymentMethodsForLocation(locationId: number): Promise<PaymentMethod[]>;
  enablePaymentMethodForLocation(locationId: number, paymentMethodId: number, customFee?: number): Promise<LocationPaymentMethod>;
  disablePaymentMethodForLocation(locationId: number, paymentMethodId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private regions: Map<number, Region>;
  private locations: Map<number, Location>;
  private applications: Map<number, GemachApplication>;
  private transactions: Map<number, Transaction>;
  private contacts: Map<number, Contact>;
  private payments: Map<number, Payment>;
  private paymentMethods: Map<number, PaymentMethod>;
  private locationPaymentMethods: Map<number, LocationPaymentMethod>;
  private validInviteCodes: Set<string>;

  private userCounter: number;
  private regionCounter: number;
  private locationCounter: number;
  private applicationCounter: number;
  private transactionCounter: number;
  private contactCounter: number;
  private paymentCounter: number;
  private paymentMethodCounter: number;
  private locationPaymentMethodCounter: number;

  constructor() {
    this.users = new Map();
    this.regions = new Map();
    this.locations = new Map();
    this.applications = new Map();
    this.transactions = new Map();
    this.contacts = new Map();
    this.payments = new Map();
    this.paymentMethods = new Map();
    this.locationPaymentMethods = new Map();
    this.validInviteCodes = new Set();

    this.userCounter = 1;
    this.regionCounter = 1;
    this.locationCounter = 1;
    this.applicationCounter = 1;
    this.transactionCounter = 1;
    this.contactCounter = 1;
    this.paymentCounter = 1;
    this.paymentMethodCounter = 1;
    this.locationPaymentMethodCounter = 1;

    // Initialize with default regions
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add all regions from website
    const defaultRegions: InsertRegion[] = [
      { name: "United States", slug: "united-states", displayOrder: 1 },
      { name: "Canada", slug: "canada", displayOrder: 2 },
      { name: "United Kingdom", slug: "united-kingdom", displayOrder: 3 },
      { name: "Europe", slug: "europe", displayOrder: 4 },
      { name: "Australia", slug: "australia", displayOrder: 5 },
      { name: "Israel", slug: "israel", displayOrder: 6 }
    ];

    defaultRegions.forEach(region => this.createRegion(region));

    // Initialize default invite codes
    this.validInviteCodes.add("GEMACH2024");
    this.validInviteCodes.add("BABYBANZ");
    this.validInviteCodes.add("EARMUFFS");
    this.validInviteCodes.add("WELCOME");

    // Add all locations from earmuffsgemach.com with simple numbering
    const allLocations: InsertLocation[] = [
      // United States - California
      {
        name: "Los Angeles - Pico",
        locationCode: "#1",
        contactPerson: "Location Coordinator",
        address: "Pico Area, Los Angeles, CA",
        zipCode: "90035",
        phone: "310-465-9885",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Los Angeles - La Brea", 
        locationCode: "#2",
        contactPerson: "Location Coordinator",
        address: "La Brea Area, Los Angeles, CA",
        zipCode: "90036",
        phone: "323-428-5925",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Los Angeles - Valley Village", 
        locationCode: "#3",
        contactPerson: "Location Coordinator",
        address: "Valley Village, Los Angeles, CA",
        zipCode: "91607",
        phone: "818-442-4369",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      // United States - Florida
      {
        name: "Miami Beach", 
        locationCode: "#4",
        contactPerson: "Location Coordinator",
        address: "Miami Beach, FL",
        zipCode: "33139",
        phone: "786-436-0060",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 12
      },
      // United States - Illinois
      {
        name: "Chicago", 
        locationCode: "#5",
        contactPerson: "Location Coordinator",
        address: "Chicago, IL",
        zipCode: "60647",
        phone: "773-961-5627",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      // United States - Maryland
      {
        name: "Baltimore - Shellydale Drive", 
        locationCode: "#6",
        contactPerson: "Location Coordinator",
        address: "Shellydale Drive, Baltimore, MD",
        zipCode: "21215",
        phone: "847-804-6654",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Baltimore - Western Run Drive", 
        locationCode: "#7",
        contactPerson: "Location Coordinator",
        address: "Western Run Drive, Baltimore, MD",
        zipCode: "21208",
        phone: "516-439-8099",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      // United States - Michigan
      {
        name: "Detroit", 
        locationCode: "#8",
        contactPerson: "Location Coordinator",
        address: "Detroit, MI",
        zipCode: "48202",
        phone: "248-910-4322",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      // United States - Ohio
      {
        name: "University Heights", 
        locationCode: "#9",
        contactPerson: "Location Coordinator",
        address: "University Heights, OH",
        zipCode: "44118",
        phone: "216-206-7653",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      // United States - Pennsylvania
      {
        name: "Philadelphia", 
        locationCode: "#10",
        contactPerson: "Location Coordinator",
        address: "Philadelphia, PA",
        zipCode: "19131",
        phone: "215-913-3467",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Bala Cynwyd Philadelphia", 
        locationCode: "#11",
        contactPerson: "Location Coordinator",
        address: "Bala Cynwyd Area, Philadelphia, PA",
        zipCode: "19004",
        phone: "973-518-1416",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      // New York - Brooklyn
      {
        name: "Brooklyn - Boro Park (12th Ave & 45th St)",
        locationCode: "#12",
        contactPerson: "Location Coordinator",
        address: "12th Ave & 45th Street, Brooklyn, NY",
        zipCode: "11219",
        phone: "631-318-0739",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Brooklyn - Boro Park (14th Ave & 40th St)",
        locationCode: "#13",
        contactPerson: "Location Coordinator",
        address: "14th Ave & 40th Street, Brooklyn, NY",
        zipCode: "11218",
        phone: "718-854-7574",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Brooklyn - Boro Park (16th Ave & 42nd St)",
        locationCode: "#14",
        contactPerson: "Location Coordinator",
        address: "16th Ave & 42nd Street, Brooklyn, NY",
        zipCode: "11204",
        phone: "718-300-0848",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Brooklyn - Crown Heights",
        locationCode: "#15",
        contactPerson: "Location Coordinator",
        address: "Crown Heights, Brooklyn, NY",
        zipCode: "11213",
        phone: "646-295-3077",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Brooklyn - Flatbush (East 35th & Ave L)",
        locationCode: "#16",
        contactPerson: "Location Coordinator",
        address: "East 35th & Avenue L, Brooklyn, NY",
        zipCode: "11210",
        phone: "917-545-3065",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Brooklyn - Flatbush (East 9th & Ave M)",
        locationCode: "#17",
        contactPerson: "Location Coordinator",
        address: "East 9th & Avenue M, Brooklyn, NY",
        zipCode: "11230",
        phone: "917-301-1150",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Brooklyn - Flatbush (East 24th & Ave P)",
        locationCode: "#18",
        contactPerson: "Location Coordinator",
        address: "East 24th & Avenue P, Brooklyn, NY",
        zipCode: "11229",
        phone: "347-300-6172",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Brooklyn - Kensington (Avenue F)",
        locationCode: "#19",
        contactPerson: "Location Coordinator",
        address: "Avenue F, Kensington, Brooklyn, NY",
        zipCode: "11218",
        phone: "347-409-9479",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Brooklyn - Kensington (East 8th & Ave C)",
        locationCode: "#20",
        contactPerson: "Location Coordinator",
        address: "East 8th & Avenue C, Kensington, Brooklyn, NY",
        zipCode: "11218",
        phone: "347-546-9849",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      // New York - Monsey
      {
        name: "Monsey - Airmont Regina Road",
        locationCode: "#21",
        contactPerson: "Location Coordinator",
        address: "Airmont, Regina Road, Monsey, NY",
        zipCode: "10952",
        phone: "845-558-9370",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Monsey - Butterfield Drive",
        locationCode: "#22",
        contactPerson: "Location Coordinator",
        address: "Butterfield Drive, Monsey, NY",
        zipCode: "10952",
        phone: "845-270-5060",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Monsey - Haverstraw",
        locationCode: "#23",
        contactPerson: "Location Coordinator",
        address: "Haverstraw, NY",
        zipCode: "10927",
        phone: "845-729-2035",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Monsey - Homestead Lane",
        locationCode: "#24",
        contactPerson: "Location Coordinator",
        address: "Homestead Lane off Rt. 306, Monsey, NY",
        zipCode: "10952",
        phone: "973-934-3775",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Monsey - Scotland Hill",
        locationCode: "#25",
        contactPerson: "Location Coordinator",
        address: "Scotland Hill, Monsey, NY",
        zipCode: "10952",
        phone: "347-988-4924",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Monsey - Wesley Hills",
        locationCode: "#26",
        contactPerson: "Location Coordinator",
        address: "Wesley Hills, NY",
        zipCode: "10977",
        phone: "914-393-2537",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      // New York - Other Areas
      {
        name: "New Square",
        locationCode: "#27",
        contactPerson: "Location Coordinator",
        address: "New Square, NY",
        zipCode: "10977",
        phone: "845-354-6548",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Queens - Kew Gardens",
        locationCode: "#28",
        contactPerson: "Location Coordinator",
        address: "Kew Gardens, Queens, NY",
        zipCode: "11415",
        phone: "917-696-8217",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Five Towns & Far Rockaway",
        locationCode: "#29",
        contactPerson: "Location Coordinator",
        address: "Five Towns & Far Rockaway, NY",
        zipCode: "11691",
        phone: "718-309-3218",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Five Towns - Lawrence",
        locationCode: "#30",
        contactPerson: "Location Coordinator",
        address: "Lawrence, Five Towns, NY",
        zipCode: "11559",
        phone: "347-515-0173",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Five Towns - Cedarhurst",
        locationCode: "#31",
        contactPerson: "Location Coordinator",
        address: "Cedarhurst, Five Towns, NY",
        zipCode: "11516",
        phone: "516-582-1985",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Five Towns - Cedarhurst (Second Location)",
        locationCode: "#32",
        contactPerson: "Location Coordinator",
        address: "Cedarhurst, Five Towns, NY",
        zipCode: "11516",
        phone: "917-817-7468",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Five Towns - North Woodmere",
        locationCode: "#33",
        contactPerson: "Location Coordinator",
        address: "North Woodmere, Five Towns, NY",
        zipCode: "11581",
        phone: "718-869-4468",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Five Towns - Woodmere",
        locationCode: "#34",
        contactPerson: "Location Coordinator",
        address: "Woodmere, Five Towns, NY",
        zipCode: "11598",
        phone: "516-592-8980",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Staten Island",
        locationCode: "#35",
        contactPerson: "Location Coordinator",
        address: "Staten Island, NY",
        zipCode: "10314",
        phone: "347-243-2476",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 4
      },
      {
        name: "West Hempstead",
        locationCode: "#36",
        contactPerson: "Location Coordinator",
        address: "West Hempstead, NY",
        zipCode: "11552",
        phone: "917-496-4619",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      // New Jersey
      {
        name: "Highland Park / Edison",
        locationCode: "#37",
        contactPerson: "Location Coordinator",
        address: "Highland Park / Edison, NJ",
        zipCode: "08837",
        phone: "347-203-7906",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jackson",
        locationCode: "#38",
        contactPerson: "Location Coordinator",
        address: "Jackson, NJ",
        zipCode: "08527",
        phone: "516-712-7735",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Lakewood - Near Beis Feiga",
        locationCode: "#39",
        contactPerson: "Location Coordinator",
        address: "Near Beis Feiga, Lakewood, NJ",
        zipCode: "08701",
        phone: "732-370-2609",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Lakewood - East County Line",
        locationCode: "#40",
        contactPerson: "Location Coordinator",
        address: "East County Line, Lakewood, NJ",
        zipCode: "08701",
        phone: "917-861-2101",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Lakewood - West County Line",
        locationCode: "#41",
        contactPerson: "Location Coordinator",
        address: "West County Line, Lakewood, NJ",
        zipCode: "08701",
        phone: "732-833-3132",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Lakewood - Pine Street",
        locationCode: "#42",
        contactPerson: "Location Coordinator",
        address: "Pine Street, Lakewood, NJ",
        zipCode: "08701",
        phone: "732-730-5606",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Lakewood - Prospect Area",
        locationCode: "#43",
        contactPerson: "Location Coordinator",
        address: "Prospect Area, Lakewood, NJ",
        zipCode: "08701",
        phone: "646-647-5148",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Lakewood - Sunset & James",
        locationCode: "#44",
        contactPerson: "Location Coordinator",
        address: "Sunset & James, Lakewood, NJ",
        zipCode: "08701",
        phone: "718-757-8615",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Lakewood - Vine Ave",
        locationCode: "#45",
        contactPerson: "Location Coordinator",
        address: "Vine Ave, Lakewood, NJ",
        zipCode: "08701",
        phone: "347-563-7220",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Lakewood - Westgate",
        locationCode: "#46",
        contactPerson: "Location Coordinator",
        address: "Westgate, Lakewood, NJ",
        zipCode: "08701",
        phone: "718-594-7868",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 13
      },
      {
        name: "Passaic - Amsterdam Avenue",
        locationCode: "#47",
        contactPerson: "Location Coordinator",
        address: "Amsterdam Avenue, Passaic, NJ",
        zipCode: "07055",
        phone: "917-756-8724",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Passaic - Boulevard",
        locationCode: "#48",
        contactPerson: "Location Coordinator",
        address: "Boulevard, Passaic, NJ",
        zipCode: "07055",
        phone: "973-617-7947",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Passaic - Passaic Avenue",
        locationCode: "#49",
        contactPerson: "Location Coordinator",
        address: "Passaic Avenue, Passaic, NJ",
        zipCode: "07055",
        phone: "201-468-1928",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Toms River",
        locationCode: "#50",
        contactPerson: "Location Coordinator",
        address: "Toms River, NJ",
        zipCode: "08753",
        phone: "347-909-1447",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      // Israel - Jerusalem
      {
        name: "Jerusalem - Arzei HaBira",
        locationCode: "#51",
        contactPerson: "Location Coordinator",
        address: "Arzei HaBira, Jerusalem, Israel",
        zipCode: "91000",
        phone: "02-581-6171",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Jerusalem - Baka",
        locationCode: "#52",
        contactPerson: "Location Coordinator",
        address: "Baka, Jerusalem, Israel",
        zipCode: "93000",
        phone: "054-588-5468",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Bayit Vegan",
        locationCode: "#53",
        contactPerson: "Location Coordinator",
        address: "Bayit Vegan, Jerusalem, Israel",
        zipCode: "96000",
        phone: "02-538-0377",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Eli HaKohen",
        locationCode: "#54",
        contactPerson: "Location Coordinator",
        address: "Eli HaKohen, Jerusalem, Israel",
        zipCode: "94000",
        phone: "058-321-9027",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - French Hill",
        locationCode: "#55",
        contactPerson: "Location Coordinator",
        address: "French Hill, Jerusalem, Israel",
        zipCode: "97000",
        phone: "054-485-1569",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Jerusalem - Ganei Geula",
        locationCode: "#56",
        contactPerson: "Location Coordinator",
        address: "Ganei Geula, Jerusalem, Israel",
        zipCode: "95000",
        phone: "058-322-4449",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Jerusalem - Givat Mordechai",
        locationCode: "#57",
        contactPerson: "Location Coordinator",
        address: "Givat Mordechai, Jerusalem, Israel",
        zipCode: "96000",
        phone: "054-653-5095",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Givat Shaul (Pinchas Kehati)",
        locationCode: "#58",
        contactPerson: "Location Coordinator",
        address: "Pinchas Kehati 1, Givat Shaul, Jerusalem, Israel",
        zipCode: "95000",
        phone: "052-769-2966",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Jerusalem - Har Nof",
        locationCode: "#59",
        contactPerson: "Location Coordinator",
        address: "Har Nof, Jerusalem, Israel",
        zipCode: "96000",
        phone: "02-582-6093",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Katamon",
        locationCode: "#60",
        contactPerson: "Location Coordinator",
        address: "Katamon, Jerusalem, Israel",
        zipCode: "93000",
        phone: "054-491-3825",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - Maalot Dafna",
        locationCode: "#61",
        contactPerson: "Location Coordinator",
        address: "Maalot Dafna, Jerusalem, Israel",
        zipCode: "97000",
        phone: "053-974-0653",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Jerusalem - Mem Gimmel",
        locationCode: "#62",
        contactPerson: "Location Coordinator",
        address: "Mem Gimmel, Jerusalem, Israel",
        zipCode: "94000",
        phone: "058-321-3943",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Neve Yaakov",
        locationCode: "#63",
        contactPerson: "Location Coordinator",
        address: "Neve Yaakov, Jerusalem, Israel",
        zipCode: "97000",
        phone: "052-711-7466",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Jerusalem - Pisgat Zeev (Neve HaPisga)",
        locationCode: "#64",
        contactPerson: "Location Coordinator",
        address: "Neve HaPisga, Pisgat Zeev, Jerusalem, Israel",
        zipCode: "97000",
        phone: "052-768-1960",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Pisgat Zeev",
        locationCode: "#65",
        contactPerson: "Location Coordinator",
        address: "Pisgat Zeev, Jerusalem, Israel",
        zipCode: "97000",
        phone: "058-448-7134",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - Ramat Eshkol",
        locationCode: "#66",
        contactPerson: "Location Coordinator",
        address: "Ramat Eshkol, Jerusalem, Israel",
        zipCode: "97000",
        phone: "058-326-1763",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Ramat Eshkol (Second Location)",
        locationCode: "#67",
        contactPerson: "Location Coordinator",
        address: "Ramat Eshkol, Jerusalem, Israel",
        zipCode: "97000",
        phone: "058-325-1273",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Jerusalem - Ramat Shlomo (Rafael Baruch Toledano)",
        locationCode: "#68",
        contactPerson: "Location Coordinator",
        address: "15 Rafael Baruch Toledano, Ramat Shlomo, Jerusalem, Israel",
        zipCode: "97000",
        phone: "054-859-2755",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Ramat Shlomo (Chazon Ish)",
        locationCode: "#69",
        contactPerson: "Location Coordinator",
        address: "Chazon Ish 1/1, Ramat Shlomo, Jerusalem, Israel",
        zipCode: "97000",
        phone: "053-316-8870",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Ramat Shlomo",
        locationCode: "#70",
        contactPerson: "Location Coordinator",
        address: "Ramat Shlomo, Jerusalem, Israel",
        zipCode: "97000",
        phone: "058-320-1963",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - Ramot",
        locationCode: "#71",
        contactPerson: "Location Coordinator",
        address: "Ramot, Jerusalem, Israel",
        zipCode: "97000",
        phone: "02-586-8904",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Jerusalem - Ramot Daled (Rechov Valenstein)",
        locationCode: "#72",
        contactPerson: "Location Coordinator",
        address: "Rechov Valenstein, Ramot Daled, Jerusalem, Israel",
        zipCode: "97000",
        phone: "02-651-8875",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Jerusalem - Rechavia-Nachlaot (Mordechai Narkis)",
        locationCode: "#73",
        contactPerson: "Location Coordinator",
        address: "Rechov Mordechai Narkis, Rechavia-Nachlaot, Jerusalem, Israel",
        zipCode: "94000",
        phone: "054-305-1823",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Romema",
        locationCode: "#74",
        contactPerson: "Location Coordinator",
        address: "Romema, Jerusalem, Israel",
        zipCode: "95000",
        phone: "054-845-4685",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Rova Hayehudi",
        locationCode: "#75",
        contactPerson: "Location Coordinator",
        address: "Rova Hayehudi, Jerusalem, Israel",
        zipCode: "97000",
        phone: "050-592-4415",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Jerusalem - Sanhedria Murchevet",
        locationCode: "#76",
        contactPerson: "Location Coordinator",
        address: "Sanhedria Murchevet, Jerusalem, Israel",
        zipCode: "97000",
        phone: "058-320-3823",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - Sanz/Belz",
        locationCode: "#77",
        contactPerson: "Location Coordinator",
        address: "Sanz/Belz, Jerusalem, Israel",
        zipCode: "95000",
        phone: "058-321-0490",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - Sarei Yisroel",
        locationCode: "#78",
        contactPerson: "Location Coordinator",
        address: "Sarei Yisroel, Jerusalem, Israel",
        zipCode: "95000",
        phone: "054-847-0478",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Jerusalem - Kiryat HaYovel",
        locationCode: "#79",
        contactPerson: "Location Coordinator",
        address: "Kiryat HaYovel, Jerusalem, Israel",
        zipCode: "96000",
        phone: "054-843-3572",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      // Israel - Other Cities
      {
        name: "Lod - Ganei Ayalon (Achisomoch)",
        locationCode: "#80",
        contactPerson: "Location Coordinator",
        address: "Ganei Ayalon - Achisomoch, Lod, Israel",
        zipCode: "71100",
        phone: "050-416-9168",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Lod - Shechunat Chabad",
        locationCode: "#81",
        contactPerson: "Location Coordinator",
        address: "Shechunat Chabad, Lod, Israel",
        zipCode: "71100",
        phone: "052-523-4091",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Afula",
        locationCode: "#82",
        contactPerson: "Location Coordinator",
        address: "Afula, Israel",
        zipCode: "18000",
        phone: "054-844-6642",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Beitar Illit",
        locationCode: "#83",
        contactPerson: "Location Coordinator",
        address: "Beitar Illit, Israel",
        zipCode: "90500",
        phone: "02-650-3688",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Beit Shemesh - Ramat Beit Shemesh",
        locationCode: "#84",
        contactPerson: "Location Coordinator",
        address: "Ramat Beit Shemesh, Beit Shemesh, Israel",
        zipCode: "99000",
        phone: "058-762-4983",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Beit Shemesh - Ramat Beit Shemesh Aleph",
        locationCode: "#85",
        contactPerson: "Location Coordinator",
        address: "Ramat Beit Shemesh Aleph, Beit Shemesh, Israel",
        zipCode: "99000",
        phone: "058-500-9889",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Bnei Brak - Shechunat Or HaChaim",
        locationCode: "#86",
        contactPerson: "Location Coordinator",
        address: "Shechunat Or HaChaim, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "052-768-6415",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Bnei Brak - Shichun Hey",
        locationCode: "#87",
        contactPerson: "Location Coordinator",
        address: "Shichun Hey, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "054-844-9073",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Bnei Brak - Zichron Meir",
        locationCode: "#88",
        contactPerson: "Location Coordinator",
        address: "Zichron Meir, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "03-570-2112",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 13
      },
      {
        name: "Bnei Brak - Rechov Sokolov",
        locationCode: "#89",
        contactPerson: "Location Coordinator",
        address: "Rechov Sokolov, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "050-410-9336",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Bnei Brak - Rechov HaBanim",
        locationCode: "#90",
        contactPerson: "Location Coordinator",
        address: "Rechov HaBanim, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "05-423-0031",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Bnei Brak - Pardes Katz",
        locationCode: "#91",
        contactPerson: "Location Coordinator",
        address: "Pardes Katz, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "055-679-6880",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Bnei Brak - Rechov Amram Gaon 7 (Shikun Vav)",
        locationCode: "#92",
        contactPerson: "Location Coordinator",
        address: "Rechov Amram Gaon 7 (Shikun Vav), Bnei Brak, Israel",
        zipCode: "51100",
        phone: "055-677-1013",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Bnei Brak - Rechov Menachem 6",
        locationCode: "#93",
        contactPerson: "Location Coordinator",
        address: "Rechov Menachem 6, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "053-317-6969",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Bnei Brak - Ramat Elchanan",
        locationCode: "#94",
        contactPerson: "Location Coordinator",
        address: "Ramat Elchanan, Bnei Brak, Israel",
        zipCode: "51100",
        phone: "054-848-2073",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Bnei Re'em",
        locationCode: "#95",
        contactPerson: "Location Coordinator",
        address: "Bnei Re'em, Israel",
        zipCode: "79800",
        phone: "058-490-8084",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Elad",
        locationCode: "#96",
        contactPerson: "Location Coordinator",
        address: "Elad, Israel",
        zipCode: "40800",
        phone: "058-329-9178",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Givat Zeev - 33 Ha'yalot",
        locationCode: "#97",
        contactPerson: "Location Coordinator",
        address: "33 Ha'yalot, Givat Zeev, Israel",
        zipCode: "90900",
        phone: "054-845-2415",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Givat Zeev - 59 Ha'yalot",
        locationCode: "#98",
        contactPerson: "Location Coordinator",
        address: "59 Ha'yalot, Givat Zeev, Israel",
        zipCode: "90900",
        phone: "02-582-1811",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Haifa - Shechunat Hadar",
        locationCode: "#99",
        contactPerson: "Location Coordinator",
        address: "Shechunat Hadar, Haifa, Israel",
        zipCode: "33000",
        phone: "052-767-4800",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Kiryat Tivon",
        locationCode: "#100",
        contactPerson: "Location Coordinator",
        address: "Kiryat Tivon, Israel",
        zipCode: "36000",
        phone: "054-655-4710",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Kochav HaShachar",
        locationCode: "#101",
        contactPerson: "Location Coordinator",
        address: "Kochav HaShachar, Israel",
        zipCode: "90612",
        phone: "054-755-0642",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Maaleh Adumim",
        locationCode: "#102",
        contactPerson: "Location Coordinator",
        address: "Maaleh Adumim, Israel",
        zipCode: "98100",
        phone: "058-400-1438",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Modiin Illit - Netivot Hamishpat",
        locationCode: "#103",
        contactPerson: "Location Coordinator",
        address: "Netivot Hamishpat, Modiin Illit, Israel",
        zipCode: "71900",
        phone: "08-649-3721",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Modiin Illit - Brachfeld",
        locationCode: "#104",
        contactPerson: "Location Coordinator",
        address: "Brachfeld, Modiin Illit, Israel",
        zipCode: "71900",
        phone: "054-841-6213",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Modiin Illit - Gan HaDasim",
        locationCode: "#105",
        contactPerson: "Location Coordinator",
        address: "Gan HaDasim, Modiin Illit, Israel",
        zipCode: "71900",
        phone: "053-312-5453",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Neriya",
        locationCode: "#106",
        contactPerson: "Location Coordinator",
        address: "Neriya, Israel",
        zipCode: "90612",
        phone: "052-860-0786",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 5
      },
      {
        name: "Telzstone/Kiryat Yearim - Ma'alot Kedushei Telz",
        locationCode: "#107",
        contactPerson: "Location Coordinator",
        address: "Ma'alot Kedushei Telz 7/1, Telzstone/Kiryat Yearim, Israel",
        zipCode: "90840",
        phone: "02-534-1425",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Telzstone/Kiryat Yearim - HaRif 16",
        locationCode: "#108",
        contactPerson: "Location Coordinator",
        address: "HaRif 16, Telzstone/Kiryat Yearim, Israel",
        zipCode: "90840",
        phone: "058-462-6211",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Rechovot",
        locationCode: "#109",
        contactPerson: "Location Coordinator",
        address: "Rechovot, Israel",
        zipCode: "76100",
        phone: "052-764-1974",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Ashdod - Rova Gimmel",
        locationCode: "#110",
        contactPerson: "Location Coordinator",
        address: "Rova Gimmel, Ashdod, Israel",
        zipCode: "77100",
        phone: "050-413-2956",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Kfar Chabad",
        locationCode: "#111",
        contactPerson: "Location Coordinator",
        address: "Kfar Chabad, Israel",
        zipCode: "72915",
        phone: "054-596-8966",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Tel Aviv - Ramat Gan",
        locationCode: "#112",
        contactPerson: "Location Coordinator",
        address: "Ramat Gan, Tel Aviv, Israel",
        zipCode: "52000",
        phone: "052-329-9914",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Moshav Yesodot",
        locationCode: "#113",
        contactPerson: "Location Coordinator",
        address: "Moshav Yesodot, Israel",
        zipCode: "76867",
        phone: "054-841-4333",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Petach Tikvah - Kfar Ganim Gimmel",
        locationCode: "#114",
        contactPerson: "Location Coordinator",
        address: "Kfar Ganim Gimmel, Petach Tikvah, Israel",
        zipCode: "49100",
        phone: "050-921-7651",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Shomron - Revava",
        locationCode: "#115",
        contactPerson: "Location Coordinator",
        address: "Revava, Shomron, Israel",
        zipCode: "44820",
        phone: "050-901-9052",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 5
      },
      // Canada
      {
        name: "Toronto - Bathurst & Lawrence",
        locationCode: "#116",
        contactPerson: "Location Coordinator",
        address: "Bathurst & Lawrence, Toronto, ON",
        zipCode: "M6A 2X7",
        phone: "416-785-1234",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Toronto - Forest Hill",
        locationCode: "#117",
        contactPerson: "Location Coordinator",
        address: "Forest Hill, Toronto, ON",
        zipCode: "M5N 2K7",
        phone: "416-482-5678",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Toronto - York Mills",
        locationCode: "#118",
        contactPerson: "Location Coordinator",
        address: "York Mills, Toronto, ON",
        zipCode: "M2P 1W5",
        phone: "416-225-9012",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Montreal - Cote St-Luc",
        locationCode: "#119",
        contactPerson: "Location Coordinator",
        address: "Cote St-Luc, Montreal, QC",
        zipCode: "H4W 2M8",
        phone: "514-485-3456",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Montreal - Hampstead",
        locationCode: "#120",
        contactPerson: "Location Coordinator",
        address: "Hampstead, Montreal, QC",
        zipCode: "H3X 3J4",
        phone: "514-342-7890",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 5
      },
      // England
      {
        name: "London - Golders Green",
        locationCode: "#121",
        contactPerson: "Location Coordinator",
        address: "Golders Green, London, UK",
        zipCode: "NW11 9DJ",
        phone: "+44 20 8455 1234",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "London - Hendon",
        locationCode: "#122",
        contactPerson: "Location Coordinator",
        address: "Hendon, London, UK",
        zipCode: "NW4 4BT",
        phone: "+44 20 8203 5678",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "London - Stamford Hill",
        locationCode: "#123",
        contactPerson: "Location Coordinator",
        address: "Stamford Hill, London, UK",
        zipCode: "N16 6XS",
        phone: "+44 20 8800 9012",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Manchester - Prestwich",
        locationCode: "#124",
        contactPerson: "Location Coordinator",
        address: "Prestwich, Manchester, UK",
        zipCode: "M25 1AJ",
        phone: "+44 161 773 3456",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Manchester - Whitefield",
        locationCode: "#125",
        contactPerson: "Location Coordinator",
        address: "Whitefield, Manchester, UK",
        zipCode: "M45 7TA",
        phone: "+44 161 796 7890",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 7
      },
      // Belgium
      {
        name: "Antwerp - Borgerhout",
        locationCode: "#126",
        contactPerson: "Location Coordinator",
        address: "Borgerhout, Antwerp, Belgium",
        zipCode: "2140",
        phone: "+32 3 271 1234",
        email: "earmuffsgemach@gmail.com",
        regionId: 4,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Antwerp - Berchem",
        locationCode: "#127",
        contactPerson: "Location Coordinator",
        address: "Berchem, Antwerp, Belgium",
        zipCode: "2600",
        phone: "+32 3 230 5678",
        email: "earmuffsgemach@gmail.com",
        regionId: 4,
        isActive: true,
        inventoryCount: 6
      },
      // Australia
      {
        name: "Melbourne - Caulfield",
        locationCode: "#128",
        contactPerson: "Location Coordinator",
        address: "Caulfield, Melbourne, VIC",
        zipCode: "3161",
        phone: "+61 3 9523 1234",
        email: "earmuffsgemach@gmail.com",
        regionId: 5,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Melbourne - St Kilda",
        locationCode: "#129",
        contactPerson: "Location Coordinator",
        address: "St Kilda, Melbourne, VIC",
        zipCode: "3182",
        phone: "+61 3 9534 5678",
        email: "earmuffsgemach@gmail.com",
        regionId: 5,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Sydney - Bondi",
        locationCode: "#130",
        contactPerson: "Location Coordinator",
        address: "Bondi, Sydney, NSW",
        zipCode: "2026",
        phone: "+61 2 9130 9012",
        email: "earmuffsgemach@gmail.com",
        regionId: 5,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Los Angeles - Valley Village",
        locationCode: "LAX-VALLEY",
        contactPerson: "Location Coordinator",
        address: "Valley Village Area, Los Angeles, CA",
        zipCode: "91607",
        phone: "818-442-4369", 
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Miami Beach",
        locationCode: "MIA-BEACH",
        contactPerson: "Location Coordinator",
        address: "Miami Beach, FL",
        zipCode: "33139",
        phone: "786-436-0060",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 15
      },
      {
        name: "Chicago",
        locationCode: "CHI-MAIN",
        contactPerson: "Location Coordinator", 
        address: "Chicago, IL",
        zipCode: "60645",
        phone: "773-961-5627",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Baltimore - Shellydale Drive",
        locationCode: "BAL-SHELLY",
        contactPerson: "Location Coordinator",
        address: "Shellydale Drive Area, Baltimore, MD",
        zipCode: "21208",
        phone: "847-804-6654",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Baltimore - Western Run Drive", 
        locationCode: "BAL-WESTERN",
        contactPerson: "Location Coordinator",
        address: "Western Run Drive Area, Baltimore, MD",
        zipCode: "21117",
        phone: "516-439-8099",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Detroit",
        locationCode: "DET-MAIN",
        contactPerson: "Location Coordinator",
        address: "Detroit, MI", 
        zipCode: "48202",
        phone: "248-910-4322",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "University Heights",
        locationCode: "OH-UNIV",
        contactPerson: "Location Coordinator",
        address: "University Heights, OH",
        zipCode: "44118",
        phone: "216-206-7653",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Philadelphia",
        locationCode: "PHI-MAIN",
        contactPerson: "Location Coordinator",
        address: "Philadelphia, PA",
        zipCode: "19141",
        phone: "215-913-3467", 
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Bala Cynwyd Philadelphia",
        locationCode: "PHI-BALA",
        contactPerson: "Location Coordinator",
        address: "Bala Cynwyd Area, Philadelphia, PA",
        zipCode: "19004",
        phone: "973-518-1416",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Brooklyn",
        locationCode: "NYC-BKN",
        contactPerson: "Location Coordinator",
        address: "Brooklyn, NY",
        zipCode: "11230",
        phone: "718-555-0123",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 15
      },
      {
        name: "Monsey",
        locationCode: "NY-MONSEY",
        contactPerson: "Location Coordinator",
        address: "Monsey, NY",
        zipCode: "10952",
        phone: "845-555-0234",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Lakewood",
        locationCode: "NJ-LKW",
        contactPerson: "Location Coordinator",
        address: "Lakewood, NJ",
        zipCode: "08701",
        phone: "732-555-0345",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 18
      },
      {
        name: "Teaneck",
        locationCode: "NJ-TNK",
        contactPerson: "Location Coordinator",
        address: "Teaneck, NJ",
        zipCode: "07666",
        phone: "201-555-0456",
        email: "earmuffsgemach@gmail.com",
        regionId: 1,
        isActive: true,
        inventoryCount: 10
      },
      // Canada
      {
        name: "Toronto - South",
        locationCode: "TOR-SOUTH",
        contactPerson: "Location Coordinator",
        address: "South Toronto Area, ON",
        zipCode: "M6K 3P6",
        phone: "647-871-8472",
        email: "earmuffsgemach@gmail.com", 
        regionId: 2,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Toronto - Bathurst & Lawrence",
        locationCode: "TOR-BATHLAW",
        contactPerson: "Location Coordinator",
        address: "Bathurst & Lawrence Area, Toronto, ON",
        zipCode: "M6A 3B5",
        phone: "647-204-4601",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Toronto - Bathurst & Clark",
        locationCode: "TOR-BATHCLK",
        contactPerson: "Location Coordinator",
        address: "Bathurst & Clark Area, Toronto, ON",
        zipCode: "M5N 1X9",
        phone: "647-786-7584",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Montreal",
        locationCode: "MTL-MAIN",
        contactPerson: "Location Coordinator",
        address: "Montreal, QC",
        zipCode: "H3W 1R8",
        phone: "514-651-5774",
        email: "earmuffsgemach@gmail.com",
        regionId: 2,
        isActive: true,
        inventoryCount: 10
      },
      // England
      {
        name: "London - Edgeware",
        locationCode: "LON-EDGE",
        contactPerson: "Location Coordinator",
        address: "Edgeware Area, London",
        zipCode: "HA8 7DB",
        phone: "077-08-25-74-20",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "London - NW11",
        locationCode: "LON-NW11",
        contactPerson: "Location Coordinator",
        address: "NW11 Area, London",
        zipCode: "NW11 7HB",
        phone: "079-30-52-09-99",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 6
      },
      {
        name: "Manchester",
        locationCode: "MAN-MAIN",
        contactPerson: "Location Coordinator",
        address: "Manchester",
        zipCode: "M8 4QR",
        phone: "078-46-36-06-51",
        email: "earmuffsgemach@gmail.com",
        regionId: 3,
        isActive: true,
        inventoryCount: 9
      },
      // Belgium
      {
        name: "Antwerp",
        locationCode: "ANT-MAIN",
        contactPerson: "Location Coordinator",
        address: "Antwerp, Belgium",
        zipCode: "2000",
        phone: "03 218 51 72",
        email: "earmuffsgemach@gmail.com",
        regionId: 4,
        isActive: true,
        inventoryCount: 7
      },
      // Australia
      {
        name: "Melbourne",
        locationCode: "MEL-MAIN",
        contactPerson: "Location Coordinator",
        address: "Melbourne, Australia",
        zipCode: "3141",
        phone: "438 501 1195",
        email: "earmuffsgemach@gmail.com",
        regionId: 5,
        isActive: true,
        inventoryCount: 11
      },
      // Israel
      {
        name: "Jerusalem - Arzel HaBira",
        locationCode: "ISR-JER-ARZEL",
        contactPerson: "Location Coordinator",
        address: "Arzel HaBira, Jerusalem, Israel",
        zipCode: "91000",
        phone: "02-581-6771",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 14
      },
      {
        name: "Jerusalem - Baka",
        locationCode: "ISR-JER-BAKA",
        contactPerson: "Location Coordinator",
        address: "Baka, Jerusalem, Israel",
        zipCode: "93000",
        phone: "054-588-5468",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 12
      },
      {
        name: "Jerusalem - Bayit Vegan",
        locationCode: "ISR-JER-BAYIT",
        contactPerson: "Location Coordinator",
        address: "Bayit Vegan, Jerusalem, Israel",
        zipCode: "96000",
        phone: "02-538-0377",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 10
      },
      {
        name: "Jerusalem - Eli HaKohen",
        locationCode: "ISR-JER-ELI",
        contactPerson: "Location Coordinator",
        address: "Eli HaKohen, Jerusalem, Israel",
        zipCode: "94000",
        phone: "058-321-9027",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 8
      },
      {
        name: "Jerusalem - French Hill",
        locationCode: "ISR-JER-FRENCH",
        contactPerson: "Location Coordinator",
        address: "French Hill, Jerusalem, Israel",
        zipCode: "97000",
        phone: "054-485-1569",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 11
      },
      {
        name: "Jerusalem - Ganei Geula",
        locationCode: "ISR-JER-GANEI",
        contactPerson: "Location Coordinator",
        address: "Ganei Geula, Jerusalem, Israel",
        zipCode: "95000",
        phone: "058-332-4449",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 9
      },
      {
        name: "Jerusalem - Givat Mordechai",
        locationCode: "ISR-JER-GIVAT",
        contactPerson: "Location Coordinator",
        address: "Givat Mordechai, Jerusalem, Israel",
        zipCode: "96000",
        phone: "054-653-5035",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 7
      },
      {
        name: "Jerusalem - Givat Shaul",
        locationCode: "ISR-JER-SHAUL",
        contactPerson: "Location Coordinator",
        address: "Givat Shaul, Jerusalem, Israel",
        zipCode: "95000",
        phone: "052-769-2966",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 13
      },
      {
        name: "Jerusalem - Pinchas Kehari",
        locationCode: "ISR-JER-PINCHAS",
        contactPerson: "Location Coordinator",
        address: "Pinchas Kehari, Jerusalem, Israel",
        zipCode: "94000",
        phone: "052-769-2966",
        email: "earmuffsgemach@gmail.com",
        regionId: 6,
        isActive: true,
        inventoryCount: 6
      }
    ];

    allLocations.forEach(location => {
      // Ensure all locations have default values if not specified
      const locationWithDefaults = {
        ...location,
        depositAmount: location.depositAmount || 20,
        paymentMethods: location.paymentMethods || ["cash"],
        processingFeePercent: location.processingFeePercent || 300 // 3.00%
      };
      this.createLocation(locationWithDefaults);
    });

    // Initialize default payment methods
    const defaultPaymentMethods: InsertPaymentMethod[] = [
      {
        name: "cash",
        displayName: "Cash",
        provider: null,
        isActive: true,
        isAvailableToLocations: true,
        processingFeePercent: 0,
        fixedFee: 0,
        requiresApi: false,
        apiKey: null,
        apiSecret: null,
        webhookSecret: null,
        isConfigured: true
      },
      {
        name: "stripe",
        displayName: "Credit/Debit Card",
        provider: "stripe",
        isActive: false,
        isAvailableToLocations: false,
        processingFeePercent: 290, // 2.9%
        fixedFee: 30, // $0.30
        requiresApi: true,
        apiKey: null,
        apiSecret: null,
        webhookSecret: null,
        isConfigured: false
      },
      {
        name: "paypal",
        displayName: "PayPal",
        provider: "paypal",
        isActive: false,
        isAvailableToLocations: false,
        processingFeePercent: 290, // 2.9%
        fixedFee: 30, // $0.30
        requiresApi: true,
        apiKey: null,
        apiSecret: null,
        webhookSecret: null,
        isConfigured: false
      },
      {
        name: "venmo",
        displayName: "Venmo",
        provider: null,
        isActive: true,
        isAvailableToLocations: true,
        processingFeePercent: 0,
        fixedFee: 0,
        requiresApi: false,
        apiKey: null,
        apiSecret: null,
        webhookSecret: null,
        isConfigured: true
      },
      {
        name: "zelle",
        displayName: "Zelle",
        provider: null,
        isActive: true,
        isAvailableToLocations: true,
        processingFeePercent: 0,
        fixedFee: 0,
        requiresApi: false,
        apiKey: null,
        apiSecret: null,
        webhookSecret: null,
        isConfigured: true
      }
    ];

    defaultPaymentMethods.forEach(method => this.createPaymentMethod(method));
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
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "customer",
      isAdmin: insertUser.isAdmin ?? null,
      locationId: insertUser.locationId ?? null
    };
    this.users.set(id, user);
    return user;
  }

  // Internal method for creating system users without invite code validation
  async createSystemUser(userData: Omit<InsertUser, 'inviteCode'>): Promise<User> {
    const id = this.userCounter++;
    const user: User = { 
      ...userData, 
      id,
      role: userData.role || "customer",
      isAdmin: userData.isAdmin ?? null,
      locationId: userData.locationId ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async validateInviteCode(code: string): Promise<boolean> {
    return this.validInviteCodes.has(code);
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
    const region: Region = { 
      ...insertRegion, 
      id,
      displayOrder: insertRegion.displayOrder ?? 0
    };
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
    const location: Location = { 
      ...insertLocation, 
      id,
      zipCode: insertLocation.zipCode ?? null,
      isActive: insertLocation.isActive ?? true,
      inventoryCount: insertLocation.inventoryCount ?? null,
      cashOnly: insertLocation.cashOnly ?? null,
      depositAmount: insertLocation.depositAmount ?? null,
      paymentMethods: insertLocation.paymentMethods ?? null,
      processingFeePercent: insertLocation.processingFeePercent ?? null
    };
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
      submittedAt: new Date(),
      message: insertApplication.message ?? null
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
      borrowDate: new Date(),
      actualReturnDate: null,
      expectedReturnDate: insertTransaction.expectedReturnDate ? new Date(insertTransaction.expectedReturnDate) : null,
      depositAmount: insertTransaction.depositAmount ?? 20,
      borrowerEmail: insertTransaction.borrowerEmail ?? null,
      borrowerPhone: insertTransaction.borrowerPhone ?? null,
      notes: insertTransaction.notes ?? null
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
      actualReturnDate: new Date()
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
      submittedAt: new Date(),
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

  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByTransaction(transactionId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.transactionId === transactionId
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCounter++;
    const payment: Payment = { 
      ...insertPayment, 
      id,
      status: insertPayment.status || "pending",
      paymentProvider: insertPayment.paymentProvider ?? null,
      externalPaymentId: insertPayment.externalPaymentId ?? null,
      processingFee: insertPayment.processingFee ?? null,
      paymentData: insertPayment.paymentData ?? null,
      createdAt: new Date(),
      completedAt: insertPayment.status === "completed" ? new Date() : null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: string, paymentData?: any): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    const updatedPayment: Payment = { 
      ...payment, 
      status,
      paymentData: paymentData ? JSON.stringify(paymentData) : payment.paymentData,
      completedAt: status === "completed" ? new Date() : payment.completedAt
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Payment Method operations
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values());
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    return this.paymentMethods.get(id);
  }

  async createPaymentMethod(insertMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.paymentMethodCounter++;
    const method: PaymentMethod = { 
      ...insertMethod,
      id,
      isActive: insertMethod.isActive ?? true,
      isAvailableToLocations: insertMethod.isAvailableToLocations ?? false,
      processingFeePercent: insertMethod.processingFeePercent ?? 0,
      fixedFee: insertMethod.fixedFee ?? 0,
      requiresApi: insertMethod.requiresApi ?? false,
      provider: insertMethod.provider ?? null,
      apiKey: insertMethod.apiKey ?? null,
      apiSecret: insertMethod.apiSecret ?? null,
      webhookSecret: insertMethod.webhookSecret ?? null,
      isConfigured: insertMethod.isConfigured ?? false,
      createdAt: new Date()
    };
    this.paymentMethods.set(id, method);
    return method;
  }

  async updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const method = this.paymentMethods.get(id);
    if (!method) {
      throw new Error(`Payment method with id ${id} not found`);
    }
    
    const updatedMethod: PaymentMethod = { ...method, ...data };
    this.paymentMethods.set(id, updatedMethod);
    return updatedMethod;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    this.paymentMethods.delete(id);
  }

  // Location Payment Method operations
  async getLocationPaymentMethods(locationId: number): Promise<LocationPaymentMethod[]> {
    return Array.from(this.locationPaymentMethods.values()).filter(
      lpm => lpm.locationId === locationId
    );
  }

  async getAvailablePaymentMethodsForLocation(locationId: number): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values()).filter(
      method => method.isActive && method.isAvailableToLocations
    );
  }

  async enablePaymentMethodForLocation(locationId: number, paymentMethodId: number, customFee?: number): Promise<LocationPaymentMethod> {
    const id = this.locationPaymentMethodCounter++;
    const locationPaymentMethod: LocationPaymentMethod = {
      id,
      locationId,
      paymentMethodId,
      isEnabled: true,
      customProcessingFee: customFee || null,
      createdAt: new Date()
    };
    this.locationPaymentMethods.set(id, locationPaymentMethod);
    return locationPaymentMethod;
  }

  async disablePaymentMethodForLocation(locationId: number, paymentMethodId: number): Promise<void> {
    const lpm = Array.from(this.locationPaymentMethods.values()).find(
      item => item.locationId === locationId && item.paymentMethodId === paymentMethodId
    );
    if (lpm) {
      this.locationPaymentMethods.delete(lpm.id);
    }
  }
}

export const storage = new MemStorage();
