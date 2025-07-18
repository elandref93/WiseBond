import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import {
  insertUserSchema, loginSchema, insertCalculationResultSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';
import { randomBytes } from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail, sendCalculationEmail } from "./email.js";
import { getPrimeRateHandler } from "./services/primeRate/primeRateController.js";
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

  // PostgreSQL session store - no memory storage
  const pgSession = connectPgSimple(session);

  app.use(session({
      store: new pgSession({
        conString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true
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
  
  app.post("/api/calculations/email", async (req, res) => {
    try {
      // Validate request body
      const { firstName, lastName, email, calculationType, calculationData } = req.body;
      
      if (!firstName || !lastName || !email || !calculationType || !calculationData) {
        return res.status(400).json({ 
          message: "Missing required fields: firstName, lastName, email, calculationType, calculationData" 
        });
      }

      // Store as a lead in the database
      const contactData = {
        name: `${firstName} ${lastName}`,
        email,
        message: `Requested ${calculationType} calculator results to be emailed`,
      };
// await storage.createContactSubmission(contactData);
      
      // Send the email
      const emailResult = await sendCalculationEmail({
        firstName,
        lastName,
        email,
        calculationType,
        calculationData
      });
      
      if (emailResult.success) {
        // Email sent successfully
        res.status(200).json({ 
          success: true, 
          message: "Calculation sent successfully" 
        });
      } else if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
        // Email service not configured - still return success in development
        console.log(`[Dev mode] Email would be sent to ${email} with ${calculationType} results`);
        res.status(200).json({ 
          success: true, 
          message: "Email would be sent in production. Email service not fully configured in development." 
        });
      } else if (emailResult.isSandboxAuthError) {
        // Sandbox domain authorization error
        console.warn(`Sandbox authorization error sending email to ${email}`);
        res.status(400).json({ 
          success: false, 
          message: "Your email address is not authorized to receive emails from our test environment. The calculation has been saved, but we couldn't send the email. Please contact support to authorize your email or try a different email address.",
          errorType: "sandboxAuth"
        });
      } else {
        // Email service configured but sending failed
        console.error(`Failed to send email to ${email}: ${emailResult.error}`);
        res.status(500).json({ 
          success: false, 
          message: "The calculation has been saved, but there was a problem sending the email. Please try again later.",
          error: emailResult.error
        });
      }
    } catch (error) {
      console.error("Error sending calculation email:", error);
      res.status(500).json({ success: false, message: "Failed to send calculation email" });
    }
  });
    app.post("/api/calculations", isAuthenticated, async (req, res) => {
      try {
        // const calculationData = insertCalculationResultSchema.parse({
        //   ...req.body,
        //   userId: req.session.userId
        // });
        const calculationData = insertCalculationResultSchema.parse({
          calculationType: req.body.calculationType,
          inputData: JSON.stringify(req.body.inputData),      // ✅ Stringify here
          resultData: JSON.stringify(req.body.resultData),    // ✅ Stringify here
          userId: req.session.userId,
        });
        
        const result = await storage.createCalculationResult(calculationData);
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        res.status(500).json({ message: "Failed to save calculation" });
      }
    });
  
    app.get("/api/calculations", isAuthenticated, async (req, res) => {
      try {
        const results = await storage.getUserCalculationResults(req.session.userId!);
        res.status(200).json({ user: results });
      } catch (error) {
        res.status(500).json({ message: "Failed to get calculations" });
      }
    });
  
   app.get("/api/prime-rate", getPrimeRateHandler);
   app.post("/api/auth/logout", (req, res) => {
       req.session.destroy((err) => {
         if (err) {
           return res.status(500).json({ message: "Failed to logout" });
         }
         res.clearCookie("connect.sid");
         console.log("User logged out successfully");
         res.status(200).json({ message: "Logged out successfully" });
       });
     });
  // API Routes
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      //const storage = await getStorage();

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
      console.log(`Email send result:`, emailResult);

      if (!emailResult.success) {
        console.warn(`Failed to send verification email to ${user.email}:`, emailResult.error);
        // In development, show the OTP in the response for testing
        if (process.env.NODE_ENV === 'development') {
          return res.status(201).json({
            message: "User registered successfully. Email delivery failed - using development mode.", 
            userId: user.id,
            emailError: true,
            developmentOtp: otp // Only in development
          });
        }
        return res.status(201).json({
          message: "User registered successfully, but email could not be sent. Please contact support.", 
          userId: user.id,
          emailError: true
        });
      }

      res.status(201).json({
        message: "User registered successfully. Please check your email (including spam folder) for the verification code.", 
        userId: user.id,
        emailSent: true
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

  // Login a verified user after OTP verification
  app.post("/api/auth/login-verified-user", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the user data
      const user = await storage.getUserById(userId);
      
      if (!user) {
        console.log("User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.otpVerified) {
        console.log("User not verified:", userId);
        return res.status(403).json({ message: "User not verified" });
      }
      
      console.log("Auto-login for verified user:", userId);
      
      // Set session and explicitly save it
      req.session.userId = user.id;
      console.log("Session set with userId:", user.id);
      console.log("Session data before save:", req.session);
      
      // Explicitly save the session to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        console.log("Session saved successfully after verification, returning user data");
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        res.status(200).json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Auto-login error:", error);
      res.status(500).json({ message: "Failed to login after verification" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      //const storage = await getStorage();

      const user = await storage.getUserByEmail(loginData.username);

      if (!user || !(await storage.verifyPassword(loginData.username, loginData.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
      });
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

      //const storage = await getStorage();
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

  // Resend OTP route
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { userId, email } = req.body;
      //const storage = await getStorage();

      if (!userId || !email) {
        return res.status(400).json({ message: "User ID and email are required" });
      }

      const user = await storage.getUserById(userId);
      if (!user || user.email !== email) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      await storage.storeOTP(user.id, otp, expiresAt);

      // Send verification email
      const emailResult = await sendVerificationEmail({
        firstName: user.firstName,
        email: user.email,
        verificationCode: otp
      });

      console.log(`Resend OTP for ${user.email}: ${otp}`);
      console.log(`Resend email result:`, emailResult);

      if (!emailResult.success) {
        console.warn(`Failed to resend verification email to ${user.email}:`, emailResult.error);
        if (process.env.NODE_ENV === 'development') {
          return res.json({
            message: "OTP resent (development mode - email delivery failed)",
            emailError: true,
            developmentOtp: otp
          });
        }
        return res.status(500).json({ message: "Failed to resend verification email" });
      }

      res.json({
        message: "Verification code resent. Please check your email and spam folder.",
        emailSent: true
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      // const storage = await getStorage();

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
      // const storage = await getStorage();

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
      // const storage = await getStorage();

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
        //const storage = await getStorage();
        const properties = await storage.getUserProperties(req.session.userId!);
        res.json(properties);
      } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  app.post('/api/properties', isAuthenticated, async (req: Request, res: Response) => {
      try {
        // const storage = await getStorage();
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
        //const storage = await getStorage();
      const scenarios = await storage.getPropertyLoanScenarios(parseInt(req.params.propertyId));
        res.json(scenarios);
      } catch (error) {
      console.error('Error fetching scenarios:', error);
      res.status(500).json({ message: 'Failed to fetch scenarios' });
    }
  });

  app.post('/api/properties/:propertyId/scenarios', isAuthenticated, async (req: Request, res: Response) => {
      try {
        //const storage = await getStorage();
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

  // Email debug endpoint for development
  app.post('/api/debug/test-email', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Debug endpoint only available in development' });
    }

    try {
      const { email, type = 'otp' } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      let result;
      if (type === 'otp') {
        result = await sendVerificationEmail({
          firstName: 'Debug Test',
          email,
          verificationCode: '123456'
        });
      } else if (type === 'reset') {
        result = await sendPasswordResetEmail({
          firstName: 'Debug Test',
          email,
          resetToken: 'debug-token-123',
          resetUrl: `http://localhost:5000/reset-password?token=debug-token-123`
        });
      } else {
        return res.status(400).json({ message: 'Invalid email type' });
      }

      res.json({
        success: result.success,
        error: result.error,
        isSandboxAuthError: result.isSandboxAuthError,
        timestamp: new Date().toISOString(),
        emailType: type,
        recipient: email
      });
    } catch (error) {
      console.error('Debug email test error:', error);
      res.status(500).json({
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  // Don't start listening here - let the main server setup handle it
  // This allows Vite middleware to be configured before server starts
  return httpServer;
}