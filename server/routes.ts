import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, loginSchema, insertCalculationResultSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';
import { randomBytes } from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.js";

const MemStore = MemoryStore(session);

interface SessionData {
  userId?: number;
  oauth_redirect?: string;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    oauth_redirect?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const port = parseInt(process.env.PORT || "5000", 10);

  // CORS middleware for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Session middleware
  app.use(session({
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    }
  }));

  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  };

  // API Routes
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const storage = await getStorage();
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // OTP expires in 30 minutes
      
      await storage.storeOTP(user.id, otp, expiresAt);
      
      // Send verification email
      const emailResult = await sendVerificationEmail({
        firstName: user.firstName,
        email: user.email,
        verificationCode: otp
      });
      
      console.log(`OTP for ${user.email}: ${otp}`); // Development only
      
      if (!emailResult.success) {
        console.warn(`Failed to send verification email to ${user.email}:`, emailResult.error);
        // Still allow registration but inform user
        return res.status(201).json({ 
          message: "User registered successfully, but email could not be sent. Please contact support.", 
          userId: user.id,
          emailError: true
        });
      }
      
      res.status(201).json({ 
        message: "User registered successfully. Please check your email for the verification code.", 
        userId: user.id 
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { userId, otp } = req.body;
      const storage = await getStorage();
      
      const isValid = await storage.verifyOTP(userId, otp);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      // Update user as verified
      await storage.updateUser(userId, { otpVerified: true });
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const storage = await getStorage();
      
      const user = await storage.getUserByEmail(loginData.username);
      
      if (!user || !(await storage.verifyPassword(loginData.username, loginData.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      res.json({ 
        message: "Login successful", 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const storage = await getStorage();
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        otpVerified: user.otpVerified,
        profileComplete: user.profileComplete
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  app.post("/api/auth/signout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const storage = await getStorage();
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If the email exists, a password reset link has been sent." });
      }
      
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
      
      // Store reset token (you'll need to add this method to storage)
      await storage.storeResetToken(user.id, resetToken, expiresAt);
      
      // Send password reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      const emailResult = await sendPasswordResetEmail({
        firstName: user.firstName,
        email: user.email,
        resetToken,
        resetUrl
      });
      
      if (!emailResult.success) {
        console.warn(`Failed to send password reset email to ${user.email}:`, emailResult.error);
        return res.status(500).json({ message: "Failed to send password reset email. Please try again." });
      }
      
      res.json({ message: "If the email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const storage = await getStorage();
      
      // Verify reset token
      const isValid = await storage.verifyResetToken(token);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Get user by token and update password
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset token" });
      }
      
      // Update password
      await storage.updateUser(user.id, { password: newPassword });
      
      // Clear the reset token
      await storage.clearResetToken(token);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      const storage = await getStorage();
      
      const isValid = await storage.verifyResetToken(token as string);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      res.json({ message: "Token is valid" });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Properties routes
  app.get('/api/properties', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const properties = await storage.getUserProperties(req.session.userId!);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  app.post('/api/properties', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const property = await storage.createProperty({
        ...req.body,
        userId: req.session.userId!
      });
      res.status(201).json(property);
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json({ message: 'Failed to create property' });
    }
  });

  app.get('/api/properties/:propertyId/scenarios', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const scenarios = await storage.getPropertyLoanScenarios(parseInt(req.params.propertyId));
      res.json(scenarios);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      res.status(500).json({ message: 'Failed to fetch scenarios' });
    }
  });

  app.post('/api/properties/:propertyId/scenarios', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const scenario = await storage.createLoanScenario({
        ...req.body,
        propertyId: parseInt(req.params.propertyId)
      });
      res.status(201).json(scenario);
    } catch (error) {
      console.error('Error creating scenario:', error);
      res.status(500).json({ message: 'Failed to create scenario' });
    }
  });

  // Health check endpoint for debugging
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 5000,
      database: 'in-memory-storage',
      vite: 'enabled'
    });
  });

  const httpServer = createServer(app);
  
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  return httpServer;
}