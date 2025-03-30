import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { insertUserSchema, loginSchema, insertCalculationResultSchema, insertContactSubmissionSchema, updateProfileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';
import { sendCalculationEmail, sendVerificationEmail } from "./email";
import { generateBondRepaymentReport } from "./services/pdf/reportController";

// Extend the session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up sessions
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "homebondsa-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Check if user is authenticated
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
      
      // Send the verification email
      const emailResult = await sendVerificationEmail({
        firstName: user.firstName,
        email: user.email,
        verificationCode: otp
      });
      
      // Log OTP for debugging in development
      console.log(`[DEV ONLY] OTP for user ${user.id}: ${otp}`);
      
      if (!emailResult.success) {
        console.warn(`Failed to send verification email to ${user.email}:`, emailResult.error);
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.verifyUser(loginData.username, loginData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { userId, otp } = req.body;
      
      if (!userId || !otp) {
        return res.status(400).json({ message: "User ID and OTP are required" });
      }
      
      const isValid = await storage.verifyOTP(userId, otp);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      res.json({ message: "OTP verified successfully" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to verify OTP" });
      }
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { userId, email } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ message: "User ID and email are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate and store a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // OTP expires in 30 minutes
      
      await storage.storeOTP(userId, otp, expiresAt);
      
      // Send the verification email
      const emailResult = await sendVerificationEmail({
        firstName: user.firstName,
        email: user.email,
        verificationCode: otp
      });
      
      // Log OTP for debugging in development
      console.log(`[DEV ONLY] New OTP for user ${userId}: ${otp}`);
      
      if (!emailResult.success) {
        console.warn(`Failed to send verification email to ${user.email}:`, emailResult.error);
      }
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to send OTP" });
      }
    }
  });
  
  // User profile routes
  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...profile } = user;
      res.json(profile);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to get profile" });
      }
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedUser = await storage.updateUser(req.session.userId!, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...profile } = updatedUser;
      res.json(profile);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  // Calculation results routes
  app.post("/api/calculations", isAuthenticated, async (req, res) => {
    try {
      const calculationData = insertCalculationResultSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const result = await storage.saveCalculationResult(calculationData);
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
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to get calculations" });
    }
  });

  // Contact submission route
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(contactData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Email calculation results route
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
      
      await storage.createContactSubmission(contactData);
      
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
  
  // Generate PDF reports
  app.post("/api/reports/bond-repayment", generateBondRepaymentReport);

  const httpServer = createServer(app);
  return httpServer;
}
