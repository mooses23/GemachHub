import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginSchema, insertUserSchema } from "../shared/schema";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Create a function to manually create test users
export async function createTestUsers() {
  try {
    const { storage } = await import('./storage');
    
    // Check if admin user already exists
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      // Create admin user
      await storage.createSystemUser({
        username: "admin",
        password: await hashPassword("admin123"),
        email: "admin@earmuffsgemach.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isAdmin: true,
        locationId: null
      });
      console.log('Created admin user: username=admin, password=admin123');
    }
    
    // Create operator user for Brooklyn gemach
    const brooklynUser = await storage.getUserByUsername('brooklyn');
    if (!brooklynUser) {
      await storage.createSystemUser({
        username: "brooklyn",
        password: await hashPassword("gemach123"),
        email: "brooklyn@earmuffsgemach.com",
        firstName: "Sarah",
        lastName: "Goldstein",
        role: "operator",
        isAdmin: false,
        locationId: 1
      });
      console.log('Created operator user: username=brooklyn, password=gemach123');
    }
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);
  
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "gemach-dev-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body using schema
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Validate invite code
      const isValidInviteCode = await storage.validateInviteCode(req.body.inviteCode);
      if (!isValidInviteCode) {
        return res.status(400).json({ message: "Invalid invite code" });
      }

      // Only location-specific invite codes are valid - no generic user registration
      const inviteCodeData = await storage.getInviteCodeByCode(req.body.inviteCode);
      
      if (!inviteCodeData || !inviteCodeData.locationId) {
        return res.status(400).json({ message: "Invalid invite code. Only location-specific operator codes are accepted." });
      }
      
      // Remove invite code from user data before creating user
      const { inviteCode, ...userDataWithoutInviteCode } = req.body;

      // Create user as operator for the linked location
      const userData = {
        ...userDataWithoutInviteCode,
        password: await hashPassword(req.body.password),
        role: "operator",
        locationId: inviteCodeData.locationId,
      };

      const user = await storage.createSystemUser(userData);

      // Mark the invite code as used if it's a location-specific code
      if (inviteCodeData) {
        await storage.useInviteCode(req.body.inviteCode, user.id);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Validate login data
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          // Don't send password to client
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login validation failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}

// Create a middleware for role-based access control
export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden" });
    }
    
    next();
  };
}

// For operator actions specific to their location
export function requireOperatorForLocation(locationId: number) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user;
    // Admin can access any location
    if (user.isAdmin) {
      return next();
    }
    
    // Operator can only access their assigned location
    if (user.role === "operator" && user.locationId === locationId) {
      return next();
    }
    
    return res.status(403).json({ message: "Access forbidden" });
  };
}