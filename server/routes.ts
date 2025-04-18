import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, loginSchema, insertCalculationResultSchema, insertContactSubmissionSchema, 
  updateProfileSchema, insertBudgetCategorySchema, insertExpenseSchema, updateExpenseSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';
import { sendCalculationEmail, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import crypto from "crypto";
import { generateBondRepaymentReport, generateAdditionalPaymentReport } from "./services/pdf/reportController";
import { getPrimeRateHandler } from "./services/primeRate/primeRateController";
import { initPrimeRateService } from "./services/primeRate/primeRateService";

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

  // Initialize prime rate service
  initPrimeRateService().catch(error => {
    console.error("Failed to initialize prime rate service:", error);
  });

  const httpServer = createServer(app);
  return httpServer;
}
