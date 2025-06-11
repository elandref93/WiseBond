import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, loginSchema, insertCalculationResultSchema, insertContactSubmissionSchema, 
  updateProfileSchema, insertBudgetCategorySchema, insertExpenseSchema, updateExpenseSchema,
  insertAgencySchema, insertAgentSchema, insertApplicationSchema, insertApplicationDocumentSchema,
  insertApplicationMilestoneSchema, insertApplicationCommentSchema, insertNotificationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';
import { sendCalculationEmail, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import crypto from "crypto";
import { generateBondRepaymentReport, generateAdditionalPaymentReport } from "./services/pdf/reportController";
import { getPrimeRateHandler } from "./services/primeRate/primeRateController";
import { initPrimeRateService } from "./services/primeRate/primeRateService";
import { getServerSession, generateAuthUrl, exchangeCodeForToken, getUserInfo, createOrUpdateOAuthUser } from "./auth";

// Extend the session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    oauth_redirect?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up sessions
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "homebondsa-secret",
      resave: true, // Changed to true to ensure session is saved
      saveUninitialized: true, // Changed to true to ensure new sessions are saved
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Only use secure in production
      },
    })
  );
  
  // Log all session operations for debugging
  app.use((req, res, next) => {
    const originalSave = req.session.save;
    req.session.save = function(callback) {
      console.log('Session being saved, session data:', req.session);
      return originalSave.call(req.session, callback);
    };
    next();
  });

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
      
      // Set session and explicitly save it
      req.session.userId = user.id;
      console.log("Session set on registration with userId:", user.id);
      console.log("Registration session data before save:", req.session);
      
      // Explicitly save the session to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Error saving registration session:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        console.log("Registration session saved successfully, returning user data");
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        res.status(201).json({ user: userWithoutPassword });
      });
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
      console.log("Login attempt with body:", JSON.stringify(req.body));
      const loginData = loginSchema.parse(req.body);
      console.log("Login data after validation:", JSON.stringify(loginData));
      
      const user = await storage.verifyUser(loginData.username, loginData.password);
      
      if (!user) {
        console.log("Authentication failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      console.log("Authentication successful for user ID:", user.id);
      
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
        
        console.log("Session saved successfully, returning user data");
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        res.status(200).json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.log("Validation error:", validationError.message);
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

  app.get("/api/auth/me", async (req, res) => {
    console.log("GET /api/auth/me - Session data:", req.session);
    console.log("Session ID:", req.sessionID);
    
    if (!req.session.userId) {
      console.log("No userId in session, returning 401");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log("Fetching user with ID:", req.session.userId);
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log("User not found in storage for ID:", req.session.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User found, returning data for ID:", user.id);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error fetching user:", error);
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
      
      // Get user data for welcome email
      const user = await storage.getUser(userId);
      if (user) {
        // Send welcome email
        try {
          const emailResult = await sendWelcomeEmail({
            firstName: user.firstName,
            email: user.email
          });
          
          if (!emailResult.success) {
            console.warn(`Failed to send welcome email to ${user.email}:`, emailResult.error);
          } else {
            console.log(`Welcome email sent to ${user.email} successfully`);
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail the verification just because the welcome email failed
        }
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
  
  // Login a verified user after OTP verification
  app.post("/api/auth/login-verified-user", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the user data
      const user = await storage.getUser(userId);
      
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

  // Password reset - request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if the user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        return res.status(200).json({ 
          message: "If your email exists in our system, you will receive a password reset link shortly."
        });
      }
      
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set token expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Store the token
      const userId = await storage.storePasswordResetToken(email, token, expiresAt);
      
      if (!userId) {
        return res.status(500).json({ message: "Failed to process password reset request" });
      }
      
      // Construct reset URL
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      
      // Send password reset email
      const emailResult = await sendPasswordResetEmail({
        firstName: user.firstName,
        email: user.email,
        resetToken: token,
        resetUrl: resetUrl
      });
      
      // Log token for debugging in development
      console.log(`[DEV ONLY] Password reset token for ${user.email}: ${token}`);
      console.log(`[DEV ONLY] Reset URL: ${resetUrl}`);
      
      if (!emailResult.success) {
        console.warn(`Failed to send password reset email to ${user.email}:`, emailResult.error);
      }
      
      res.status(200).json({ 
        message: "If your email exists in our system, you will receive a password reset link shortly."
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset - verify token and reset password
  // API endpoint to validate a reset token (without consuming it)
  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Get the token data without consuming it
      const tokenData = await storage.checkPasswordResetToken(token);
      
      if (!tokenData) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });
  
  // Automatically resend password reset email when token has expired
  app.post("/api/auth/resend-reset-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Original token is required" });
      }
      
      // Get the user from the expired token
      // This is a special case where we'll try to extract user info from an expired token
      const tokenInfo = await storage.getInfoFromExpiredToken(token);
      
      if (!tokenInfo || !tokenInfo.email) {
        return res.status(400).json({ 
          message: "Could not retrieve information from expired token" 
        });
      }
      
      // Get the user by email
      const user = await storage.getUserByEmail(tokenInfo.email);
      
      if (!user) {
        // For security, don't reveal that the user doesn't exist
        return res.status(200).json({ 
          message: "If your email exists in our system, you will receive a new password reset link shortly." 
        });
      }
      
      // Generate a new token
      const newToken = crypto.randomBytes(32).toString('hex');
      
      // Set token expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Store the new token
      await storage.storePasswordResetToken(user.email, newToken, expiresAt);
      
      // Construct reset URL
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${newToken}`;
      
      // Send password reset email
      const emailResult = await sendPasswordResetEmail({
        firstName: user.firstName,
        email: user.email,
        resetToken: newToken,
        resetUrl: resetUrl
      });
      
      // Log token for debugging in development
      console.log(`[DEV ONLY] New password reset token for ${user.email}: ${newToken}`);
      console.log(`[DEV ONLY] New reset URL: ${resetUrl}`);
      
      if (!emailResult.success) {
        console.warn(`Failed to send password reset email to ${user.email}:`, emailResult.error);
      }
      
      res.status(200).json({ 
        message: "A new password reset link has been sent to your email" 
      });
    } catch (error) {
      console.error("Error resending reset token:", error);
      res.status(500).json({ message: "Failed to resend password reset link" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Password complexity validation
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter" });
      }
      
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one lowercase letter" });
      }
      
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one number" });
      }
      
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one special character" });
      }
      
      // Common password check
      const commonPasswords = [
        "password", "123456", "12345678", "qwerty", "abc123",
        "welcome", "admin", "password123", "letmein", "monkey"
      ];
      
      if (commonPasswords.some(common => 
        newPassword.toLowerCase().includes(common.toLowerCase()))) {
        return res.status(400).json({ 
          message: "This password is too common and easy to guess" 
        });
      }
      
      // Validate the token
      const userId = await storage.validatePasswordResetToken(token);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired password reset token" });
      }
      
      // Get user to check if new password contains personal info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if password contains personal info
      const personalInfo = [user.firstName, user.lastName, user.email.split('@')[0]];
      if (personalInfo.some(info => 
        info && info.length > 2 && newPassword.toLowerCase().includes(info.toLowerCase()))) {
        return res.status(400).json({ 
          message: "Password should not contain your name or email address" 
        });
      }
      
      // Check if the user has a previous password and it matches the new one
      if (user.password) {
        const isSamePassword = await storage.comparePasswords(userId, newPassword);
        if (isSamePassword) {
          return res.status(400).json({ 
            message: "New password must be different from your current password" 
          });
        }
      }
      
      // Update the user's password
      const success = await storage.updateUserPassword(userId, newPassword);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.status(200).json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
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
  app.post("/api/reports/bond-repayment", isAuthenticated, generateBondRepaymentReport);
  app.post("/api/reports/additional-payment", isAuthenticated, generateAdditionalPaymentReport);

  // Budget Management Routes
  // Budget Categories
  app.get("/api/budget/categories", async (req, res) => {
    try {
      const categories = await storage.getBudgetCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get budget categories" });
    }
  });

  app.get("/api/budget/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getBudgetCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Budget category not found" });
      }
      
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to get budget category" });
    }
  });

  app.post("/api/budget/categories", isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create budget category" });
    }
  });

  // User Expenses
  app.get("/api/budget/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getUserExpenses(req.session.userId!);
      res.status(200).json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses" });
    }
  });

  app.get("/api/budget/expenses/category/:categoryId", isAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const expenses = await storage.getUserExpensesByCategory(req.session.userId!, categoryId);
      res.status(200).json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses for category" });
    }
  });

  app.get("/api/budget/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }
      
      const expense = await storage.getExpense(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Verify that the expense belongs to the user
      if (expense.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this expense" });
      }
      
      res.status(200).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expense" });
    }
  });

  app.post("/api/budget/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch("/api/budget/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }
      
      const updates = updateExpenseSchema.parse(req.body);
      const updatedExpense = await storage.updateExpense(expenseId, req.session.userId!, updates);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found or not authorized" });
      }
      
      res.status(200).json(updatedExpense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/budget/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }
      
      const deleted = await storage.deleteExpense(expenseId, req.session.userId!);
      
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found or not authorized" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Prime Rate API
  app.get("/api/prime-rate", getPrimeRateHandler);

  // Agent routes
  // Get current user agent profile
  app.get("/api/agent/profile", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.session.userId!);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      res.status(200).json({ agent });
    } catch (error) {
      console.error("Error getting agent profile:", error);
      res.status(500).json({ message: "Failed to get agent profile" });
    }
  });
  
  // Create agent profile for current user
  app.post("/api/agent/profile", isAuthenticated, async (req, res) => {
    try {
      // Check if user already has an agent profile
      const existingAgent = await storage.getAgentByUserId(req.session.userId!);
      if (existingAgent) {
        return res.status(400).json({ message: "Agent profile already exists" });
      }
      
      const agentData = insertAgentSchema.parse({ 
        ...req.body,
        userId: req.session.userId! 
      });
      
      const agent = await storage.createAgent(agentData);
      res.status(201).json({ agent });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating agent profile:", error);
      res.status(500).json({ message: "Failed to create agent profile" });
    }
  });
  
  // Update agent profile
  app.patch("/api/agent/profile", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.session.userId!);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      const updatedAgent = await storage.updateAgent(agent.id, req.body);
      res.status(200).json({ agent: updatedAgent });
    } catch (error) {
      console.error("Error updating agent profile:", error);
      res.status(500).json({ message: "Failed to update agent profile" });
    }
  });
  
  // Get all agencies
  app.get("/api/agencies", async (req, res) => {
    try {
      const agencies = await storage.getAgencies();
      res.status(200).json({ agencies });
    } catch (error) {
      console.error("Error getting agencies:", error);
      res.status(500).json({ message: "Failed to get agencies" });
    }
  });
  
  // Get specific agency
  app.get("/api/agencies/:id", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      const agency = await storage.getAgency(agencyId);
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      res.status(200).json({ agency });
    } catch (error) {
      console.error("Error getting agency:", error);
      res.status(500).json({ message: "Failed to get agency" });
    }
  });
  
  // Create new agency - Admin only
  app.post("/api/agencies", isAuthenticated, async (req, res) => {
    try {
      // TODO: Check admin role when implementing role-based auth
      const agencyData = insertAgencySchema.parse(req.body);
      const agency = await storage.createAgency(agencyData);
      res.status(201).json({ agency });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating agency:", error);
      res.status(500).json({ message: "Failed to create agency" });
    }
  });
  
  // Agent application management routes
  
  // Get all applications for current agent
  app.get("/api/agent/applications", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.session.userId!);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      const applications = await storage.getApplicationsByAgent(agent.id);
      res.status(200).json({ applications });
    } catch (error) {
      console.error("Error getting agent applications:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });
  
  // Get application by ID (with documents, milestones and comments)
  app.get("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Also fetch related documents, milestones and comments
      const documents = await storage.getApplicationDocuments(applicationId);
      const milestones = await storage.getApplicationMilestones(applicationId);
      const comments = await storage.getApplicationComments(applicationId);
      
      // Get client info
      const client = await storage.getUser(application.clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const { password, ...clientWithoutPassword } = client;
      
      res.status(200).json({ 
        application,
        client: clientWithoutPassword,
        documents,
        milestones,
        comments
      });
    } catch (error) {
      console.error("Error getting application details:", error);
      res.status(500).json({ message: "Failed to get application details" });
    }
  });
  
  // Create application for a client
  app.post("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.session.userId!);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        agentId: agent.id
      });
      
      const application = await storage.createApplication(applicationData);
      
      // Create default milestones
      const defaultMilestones = [
        { milestoneName: "pre_qualify", expectedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
        { milestoneName: "submit", expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        { milestoneName: "under_review", expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        { milestoneName: "decision", expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        { milestoneName: "funding", expectedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) }
      ];
      
      const milestones = await Promise.all(
        defaultMilestones.map(milestone => 
          storage.createApplicationMilestone({
            applicationId: application.id,
            milestoneName: milestone.milestoneName,
            expectedDate: milestone.expectedDate
          })
        )
      );
      
      // Notify client
      const client = await storage.getUser(application.clientId);
      
      if (client) {
        await storage.createNotification({
          userId: client.id,
          type: "application_created",
          title: "New Home Loan Application",
          message: "A new home loan application has been created for you.",
          relatedId: application.id,
          relatedType: "application"
        });
      }
      
      res.status(201).json({ application, milestones });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });
  
  // Update application
  app.patch("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify the agent owns this application
      const agent = await storage.getAgentByUserId(req.session.userId!);
      if (!agent || application.agentId !== agent.id) {
        return res.status(403).json({ message: "Not authorized to update this application" });
      }
      
      // Check if status is being updated
      const oldStatus = application.status;
      const newStatus = req.body.status;
      
      const updatedApplication = await storage.updateApplication(applicationId, req.body);
      
      // If status changed, update relevant milestone
      if (newStatus && oldStatus !== newStatus) {
        const milestoneMap: { [key: string]: string } = {
          'new_lead': 'pre_qualify',
          'in_progress': 'submit',
          'submitted': 'submit',
          'under_review': 'under_review',
          'approved': 'decision',
          'funded': 'funding',
          'declined': 'decision'
        };
        
        const milestoneName = milestoneMap[newStatus];
        
        if (milestoneName) {
          const milestones = await storage.getApplicationMilestones(applicationId);
          const milestone = milestones.find(m => m.milestoneName === milestoneName);
          
          if (milestone) {
            await storage.updateApplicationMilestone(milestone.id, {
              completed: ['approved', 'funded', 'declined'].includes(newStatus) || 
                         (milestoneName !== 'decision' && milestoneName !== 'funding'),
              completedDate: new Date()
            });
          }
        }
        
        // Create notification for client
        const client = await storage.getUser(application.clientId);
        if (client) {
          let title = '';
          let message = '';
          
          switch (newStatus) {
            case 'submitted':
              title = 'Application Submitted';
              message = 'Your home loan application has been submitted to the lender.';
              break;
            case 'under_review':
              title = 'Application Under Review';
              message = 'Your home loan application is now under review by the lender.';
              break;
            case 'approved':
              title = 'Application Approved!';
              message = 'Congratulations! Your home loan application has been approved.';
              break;
            case 'funded':
              title = 'Loan Funded';
              message = 'Great news! Your home loan has been funded.';
              break;
            case 'declined':
              title = 'Application Decision';
              message = 'There has been a decision on your home loan application. Please contact your agent.';
              break;
          }
          
          if (title && message) {
            await storage.createNotification({
              userId: client.id,
              type: `application_${newStatus}`,
              title,
              message,
              relatedId: application.id,
              relatedType: 'application'
            });
          }
        }
      }
      
      res.status(200).json({ application: updatedApplication });
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });
  
  // Add comment to application
  app.post("/api/applications/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const comment = await storage.createApplicationComment({
        applicationId,
        userId: req.session.userId!,
        comment: req.body.comment,
        mentions: req.body.mentions
      });
      
      // Notify mentioned users
      if (req.body.mentions) {
        const mentions = JSON.parse(req.body.mentions);
        const user = await storage.getUser(req.session.userId!);
        
        if (user && Array.isArray(mentions)) {
          mentions.forEach(async (userId: number) => {
            await storage.createNotification({
              userId,
              type: "comment_mention",
              title: "You were mentioned in a comment",
              message: `${user.firstName} ${user.lastName} mentioned you in a comment.`,
              relatedId: applicationId,
              relatedType: "application"
            });
          });
        }
      }
      
      res.status(201).json({ comment });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  // Get unread notifications for current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserUnreadNotifications(req.session.userId!);
      res.status(200).json({ notifications });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  
  // Mark notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.markAllNotificationsRead(req.session.userId!);
      res.status(200).json({ success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // OAuth Authentication Routes
  app.get('/api/auth/signin/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      
      if (!['google', 'facebook'].includes(provider)) {
        return res.status(400).json({ error: 'Unsupported provider' });
      }

      // Generate OAuth authorization URL with correct callback path
      let redirectUri;
      if (provider === 'google') {
        redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
      } else {
        redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
      }
      
      const authUrl = generateAuthUrl(provider, redirectUri);
      
      res.json({ url: authUrl });
    } catch (error) {
      console.error(`OAuth ${req.params.provider} signin error:`, error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Google-specific callback route to match Google Cloud Console configuration
  app.get('/auth/google/callback', async (req: Request, res: Response) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.error(`OAuth Google callback error:`, error);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=oauth_error`);
      }

      if (!code) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=no_code`);
      }

      // Exchange code for token
      const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
      const tokenData = await exchangeCodeForToken('google', code as string, redirectUri);
      
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      // Get user info from provider
      const userProfile = await getUserInfo('google', tokenData.access_token);
      
      // Create or update user in database
      const user = await createOrUpdateOAuthUser('google', userProfile);
      
      // Set up session
      req.session.userId = user.id;
      
      // Redirect to success page or original location
      const redirectUrl = req.session.oauth_redirect || '/';
      delete req.session.oauth_redirect;
      
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}${redirectUrl}`);
    } catch (error) {
      console.error(`OAuth Google callback error:`, error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=callback_failed`);
    }
  });

  app.get('/api/auth/callback/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { code, error } = req.query;

      if (error) {
        console.error(`OAuth ${provider} callback error:`, error);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=oauth_error`);
      }

      if (!code) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=no_code`);
      }

      // Exchange code for token
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
      const tokenData = await exchangeCodeForToken(provider, code as string, redirectUri);
      
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      // Get user info from provider
      const userProfile = await getUserInfo(provider, tokenData.access_token);
      
      // Create or update user in database
      const user = await createOrUpdateOAuthUser(provider, userProfile);
      
      // Set up session
      req.session.userId = user.id;
      
      // Redirect to success page or original location
      const redirectUrl = req.session.oauth_redirect || '/';
      delete req.session.oauth_redirect;
      
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}${redirectUrl}`);
    } catch (error) {
      console.error(`OAuth ${req.params.provider} callback error:`, error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/error?error=callback_failed`);
    }
  });

  app.get('/api/auth/providers', (req: Request, res: Response) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const providers = {
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: `${baseUrl}/api/auth/signin/google`,
        callbackUrl: `${baseUrl}/auth/google/callback`
      },
      facebook: {
        id: 'facebook',
        name: 'Facebook',
        type: 'oauth',
        signinUrl: `${baseUrl}/api/auth/signin/facebook`,
        callbackUrl: `${baseUrl}/api/auth/callback/facebook`
      }
    };

    res.json({ providers });
  });

  app.post('/api/auth/signout', (req: Request, res: Response) => {
    const { callbackUrl = '/' } = req.body;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Sign out failed' });
      }
      
      res.json({ url: callbackUrl });
    });
  });

  // Initialize prime rate service
  initPrimeRateService().catch(error => {
    console.error("Failed to initialize prime rate service:", error);
  });

  const httpServer = createServer(app);
  return httpServer;
}
