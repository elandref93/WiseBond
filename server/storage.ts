import { eq, and, desc, sql } from "drizzle-orm";
import { db, pool } from "./db";
import connectPg from "connect-pg-simple";
import session from "express-session";
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import memorystore from 'memorystore';
import { 
  users, type User, type InsertUser, type CalculationResult, type InsertCalculationResult, 
  type ContactSubmission, type InsertContactSubmission, type BudgetCategory, type InsertBudgetCategory,
  type Expense, type InsertExpense, type UpdateExpense, budgetCategories, expenses,
  calculationResults, contactSubmissions
} from "@shared/schema";

// Create session store factory once at module level
const MemoryStore = memorystore(session);
const PgSessionStore = connectPg(session);

// Storage interface defining all the data operations needed by the application
export interface IStorage {
  // Session store for persistent sessions
  sessionStore: session.Store;
  
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  
  // Calculation results
  saveCalculationResult(result: InsertCalculationResult): Promise<CalculationResult>;
  getUserCalculationResults(userId: number): Promise<CalculationResult[]>;
  
  // Contact form
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  
  // OTP verification
  storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void>;
  verifyOTP(userId: number, otp: string): Promise<boolean>;
  
  // Password reset
  storePasswordResetToken(email: string, token: string, expiresAt: Date): Promise<number | undefined>; // Returns user ID if successful
  validatePasswordResetToken(token: string): Promise<number | undefined>; // Returns user ID if valid
  checkPasswordResetToken(token: string): Promise<number | undefined>; // Returns user ID if valid without consuming the token
  getInfoFromExpiredToken(token: string): Promise<{ email: string } | undefined>; // Retrieve email from an expired token
  comparePasswords(userId: number, password: string): Promise<boolean>; // Compare if supplied password matches stored password
  
  // Budget management
  getBudgetCategories(): Promise<BudgetCategory[]>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  
  // Expense management
  getUserExpenses(userId: number): Promise<Expense[]>;
  getUserExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, userId: number, updates: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: number): Promise<boolean>;
}
export class MemStorage implements IStorage {
  // In-memory storage using Maps
  private users: Map<number, User>;
  private calculationResults: Map<number, CalculationResult>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private budgetCategories: Map<number, BudgetCategory>;
  private expenses: Map<number, Expense>;
  private userIdCounter: number;
  private calculationIdCounter: number;
  private contactIdCounter: number;
  private budgetCategoryIdCounter: number;
  private expenseIdCounter: number;
  private otpStore: Map<number, { otp: string, expiresAt: Date }>;
  private passwordResetTokens: Map<string, { userId: number, expiresAt: Date }>;
  sessionStore: session.Store;

  constructor() {
    // Initialize in-memory storage
    this.users = new Map();
    this.calculationResults = new Map();
    this.contactSubmissions = new Map();
    this.budgetCategories = new Map();
    this.expenses = new Map();
    this.userIdCounter = 1;
    this.calculationIdCounter = 1;
    this.contactIdCounter = 1;
    this.budgetCategoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.otpStore = new Map();
    this.passwordResetTokens = new Map();
    
    // Create a memory store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Initialize default budget categories
    this.initDefaultBudgetCategories();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Create user with required fields
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      phone: insertUser.phone ?? null,
      idNumber: insertUser.idNumber ?? null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      age: insertUser.age ?? null,
      address: insertUser.address ?? null,
      city: insertUser.city ?? null,
      postalCode: insertUser.postalCode ?? null,
      province: insertUser.province ?? null,
      employmentStatus: insertUser.employmentStatus ?? null,
      employerName: insertUser.employerName ?? null,
      employmentSector: insertUser.employmentSector ?? null,
      jobTitle: insertUser.jobTitle ?? null,
      employmentDuration: insertUser.employmentDuration ?? null,
      monthlyIncome: insertUser.monthlyIncome ?? null,
      otpVerified: insertUser.otpVerified ?? false,
      profileComplete: insertUser.profileComplete ?? false,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, user);
    return user;
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    // Since we're using email as username now, we'll look up by email instead
    const user = await this.getUserByEmail(username);
    if (!user) return undefined;
    
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : undefined;
  }

  async saveCalculationResult(insertResult: InsertCalculationResult): Promise<CalculationResult> {
    const id = this.calculationIdCounter++;
    const result: CalculationResult = {
      id,
      userId: insertResult.userId || null,
      calculationType: insertResult.calculationType,
      inputData: insertResult.inputData,
      resultData: insertResult.resultData,
      createdAt: new Date()
    };
    
    this.calculationResults.set(id, result);
    return result;
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    return Array.from(this.calculationResults.values()).filter(
      (result) => result.userId === userId
    );
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = this.contactIdCounter++;
    const submission: ContactSubmission = {
      id,
      name: insertSubmission.name,
      email: insertSubmission.email,
      phone: insertSubmission.phone || null,
      message: insertSubmission.message,
      createdAt: new Date()
    };
    
    this.contactSubmissions.set(id, submission);
    return submission;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatesWithNulls = { ...updates };
      
    // If monthlyIncome is 0, set it to null in the database
    if (updates.monthlyIncome === 0) {
      updatesWithNulls.monthlyIncome = null;
    }
    
    const updatedUser = {
      ...user,
      ...updatesWithNulls,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otpStore.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const storedOTP = this.otpStore.get(userId);
    
    if (!storedOTP) {
      return false;
    }
    
    // Check if OTP has expired
    if (new Date() > storedOTP.expiresAt) {
      this.otpStore.delete(userId); // Clean up expired OTP
      return false;
    }
    
    // Check if OTP matches
    if (storedOTP.otp !== otp) {
      return false;
    }
    
    // OTP is valid, mark user as verified
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, { otpVerified: true });
    }
    
    // Clean up used OTP
    this.otpStore.delete(userId);
    
    return true;
  }

  // Budget Categories Methods
  
  /**
   * Initialize default budget categories based on South African home loan application requirements
   */
  private initDefaultBudgetCategories() {
    const defaultCategories = [
      {
        name: "Housing",
        description: "Rent, current bond payments, rates, taxes, and levies",
        isDefault: true,
        sortOrder: 1
      },
      {
        name: "Utilities",
        description: "Water, electricity, and other utilities (refuse removal)",
        isDefault: true,
        sortOrder: 2
      },
      {
        name: "Insurance",
        description: "Medical aid, life insurance, and short-term insurance",
        isDefault: true,
        sortOrder: 3
      },
      {
        name: "Food & Groceries",
        description: "Monthly supermarket and grocery bills",
        isDefault: true,
        sortOrder: 4
      },
      {
        name: "Transportation",
        description: "Vehicle finance, fuel, maintenance, and public transport",
        isDefault: true,
        sortOrder: 5
      },
      {
        name: "Debt Obligations",
        description: "Credit cards, personal loans, store accounts, and student loans",
        isDefault: true,
        sortOrder: 6
      },
      {
        name: "Communication & Technology",
        description: "Cell phone, landline, internet, and TV subscriptions",
        isDefault: true,
        sortOrder: 7
      },
      {
        name: "Childcare & Education",
        description: "School fees, aftercare, extracurricular activities, and child maintenance",
        isDefault: true,
        sortOrder: 8
      },
      {
        name: "Personal & Household",
        description: "Clothing, toiletries, household maintenance, and domestic help",
        isDefault: true,
        sortOrder: 9
      },
      {
        name: "Entertainment & Leisure",
        description: "Dining out, social events, gym memberships, and hobbies",
        isDefault: true,
        sortOrder: 10
      },
      {
        name: "Savings & Investments",
        description: "Savings accounts, emergency funds, retirement annuities, and investments",
        isDefault: true,
        sortOrder: 11
      },
      {
        name: "Other Obligations",
        description: "Policy premiums, alimony, loan guarantees, and other regular commitments",
        isDefault: true,
        sortOrder: 12
      }
    ];

    defaultCategories.forEach(category => {
      const id = this.budgetCategoryIdCounter++;
      const budgetCategory: BudgetCategory = {
        id,
        name: category.name,
        description: category.description,
        isDefault: category.isDefault,
        sortOrder: category.sortOrder,
        createdAt: new Date()
      };
      this.budgetCategories.set(id, budgetCategory);
    });
  }

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    return this.budgetCategories.get(id);
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = this.budgetCategoryIdCounter++;
    const category: BudgetCategory = {
      id,
      name: insertCategory.name,
      description: insertCategory.description ?? null,
      isDefault: insertCategory.isDefault ?? false,
      sortOrder: insertCategory.sortOrder ?? 0,
      createdAt: new Date()
    };
    
    this.budgetCategories.set(id, category);
    return category;
  }

  // Expense Methods
  
  async getUserExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId);
  }

  async getUserExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId && expense.categoryId === categoryId);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const now = new Date();
    const expense: Expense = {
      id,
      userId: insertExpense.userId,
      categoryId: insertExpense.categoryId,
      subcategoryId: insertExpense.subcategoryId || null,
      name: insertExpense.name,
      amount: insertExpense.amount,
      description: insertExpense.description ?? null,
      isRecurring: insertExpense.isRecurring ?? true,
      frequency: insertExpense.frequency ?? 'monthly',
      isCustom: insertExpense.isCustom ?? false,
      createdAt: now,
      updatedAt: now
    };
    
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, userId: number, updates: UpdateExpense): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    
    // Ensure the expense exists and belongs to the user
    if (!expense || expense.userId !== userId) {
      return undefined;
    }
    
    const updatedExpense: Expense = {
      ...expense,
      ...updates,
      updatedAt: new Date()
    };
    
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number, userId: number): Promise<boolean> {
    const expense = this.expenses.get(id);
    
    // Ensure the expense exists and belongs to the user
    if (!expense || expense.userId !== userId) {
      return false;
    }
    
    return this.expenses.delete(id);
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      await this.updateUser(id, { password: hashedPassword });
      return true;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
  }
  
  async storePasswordResetToken(email: string, token: string, expiresAt: Date): Promise<number | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    this.passwordResetTokens.set(token, { userId: user.id, expiresAt });
    return user.id;
  }
  
  async validatePasswordResetToken(token: string): Promise<number | undefined> {
    const tokenData = this.passwordResetTokens.get(token);
    
    if (!tokenData) {
      return undefined;
    }
    
    // Check if token has expired
    if (new Date() > tokenData.expiresAt) {
      this.passwordResetTokens.delete(token); // Clean up expired token
      return undefined;
    }
    
    // Token is valid, return the user ID
    const userId = tokenData.userId;
    
    // Clean up used token
    this.passwordResetTokens.delete(token);
    
    return userId;
  }
  
  async checkPasswordResetToken(token: string): Promise<number | undefined> {
    const tokenData = this.passwordResetTokens.get(token);
    
    if (!tokenData) {
      return undefined;
    }
    
    // Check if token has expired
    if (new Date() > tokenData.expiresAt) {
      this.passwordResetTokens.delete(token); // Clean up expired token
      return undefined;
    }
    
    // Token is valid, return the user ID without deleting it
    return tokenData.userId;
  }
  
  async getInfoFromExpiredToken(token: string): Promise<{ email: string } | undefined> {
    // First check if token exists
    const tokenData = this.passwordResetTokens.get(token);
    
    if (!tokenData) {
      // Token doesn't exist at all
      return undefined;
    }
    
    // Even if token is expired, we'll try to get the user info
    const user = await this.getUser(tokenData.userId);
    if (!user) {
      return undefined;
    }
    
    return { email: user.email };
  }
  
  async comparePasswords(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch;
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  }
}
/**
 * PostgreSQL Database Storage Implementation
 * This class implements the IStorage interface using PostgreSQL.
 */
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use the pool from db.ts to ensure consistent connection settings
    // including SSL configurations
    
    // Create a PostgreSQL session store with the same pool used by drizzle
    this.sessionStore = new PgSessionStore({ 
      pool: pool, 
      createTableIfMissing: true,
      tableName: 'sessions'
    });
    
    // Initialize default budget categories if they don't exist
    this.initDefaultBudgetCategories().catch(err => {
      console.error("Failed to initialize default budget categories:", err);
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Database error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
      
      const [user] = await db.insert(users).values({
        ...insertUser,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return user;
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw new Error("Failed to create user");
    }
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    try {
      // Since we're using email as username, we'll look up by email
      const user = await this.getUserByEmail(username);
      if (!user) return undefined;
      
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch ? user : undefined;
    } catch (error) {
      console.error("Database error in verifyUser:", error);
      return undefined;
    }
  }

  async saveCalculationResult(insertResult: InsertCalculationResult): Promise<CalculationResult> {
    try {
      const [result] = await db.insert(calculationResults).values({
        ...insertResult,
        createdAt: new Date()
      }).returning();
      
      return result;
    } catch (error) {
      console.error("Database error in saveCalculationResult:", error);
      throw new Error("Failed to save calculation result");
    }
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    try {
      const results = await db.select()
        .from(calculationResults)
        .where(eq(calculationResults.userId, userId))
        .orderBy(desc(calculationResults.createdAt));
      
      return results;
    } catch (error) {
      console.error("Database error in getUserCalculationResults:", error);
      return [];
    }
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    try {
      const [submission] = await db.insert(contactSubmissions).values({
        ...insertSubmission,
        createdAt: new Date()
      }).returning();
      
      return submission;
    } catch (error) {
      console.error("Database error in createContactSubmission:", error);
      throw new Error("Failed to create contact submission");
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      // Handle monthly income explicitly to allow null values
      const updatesWithNulls = { ...updates };
      
      // If monthlyIncome is 0, set it to null in the database
      if (updates.monthlyIncome === 0) {
        updatesWithNulls.monthlyIncome = null;
      }
      
      const [updatedUser] = await db.update(users)
        .set({
          ...updatesWithNulls,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUser:", error);
      return undefined;
    }
  }

  // We'll use a separate table for OTPs in production, but for now
  // we'll keep using the in-memory approach since OTPs are temporary
  private otpStore = new Map<number, { otp: string, expiresAt: Date }>();
  
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otpStore.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const storedOTP = this.otpStore.get(userId);
    
    if (!storedOTP) {
      return false;
    }
    
    // Check if OTP has expired
    if (new Date() > storedOTP.expiresAt) {
      this.otpStore.delete(userId); // Clean up expired OTP
      return false;
    }
    
    // Check if OTP matches
    if (storedOTP.otp !== otp) {
      return false;
    }
    
    // OTP is valid, mark user as verified
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, { otpVerified: true });
    }
    
    // Clean up used OTP
    this.otpStore.delete(userId);
    
    return true;
  }

  /**
   * Initialize default budget categories if they don't exist in the database
   */
  private async initDefaultBudgetCategories() {
    try {
      // Check if budget categories already exist
      const existingCategories = await db.select().from(budgetCategories).where(eq(budgetCategories.isDefault, true));
      
      if (existingCategories.length > 0) {
        console.log(`Found ${existingCategories.length} existing default budget categories`);
        return; // Default categories already exist, no need to create them again
      }
      
      console.log("Creating default budget categories...");
      
      const defaultCategories = [
        {
          name: "Housing",
          description: "Rent, current bond payments, rates, taxes, and levies",
          isDefault: true,
          sortOrder: 1
        },
        {
          name: "Utilities",
          description: "Water, electricity, and other utilities (refuse removal)",
          isDefault: true,
          sortOrder: 2
        },
        {
          name: "Insurance",
          description: "Medical aid, life insurance, and short-term insurance",
          isDefault: true,
          sortOrder: 3
        },
        {
          name: "Food & Groceries",
          description: "Monthly supermarket and grocery bills",
          isDefault: true,
          sortOrder: 4
        },
        {
          name: "Transportation",
          description: "Vehicle finance, fuel, maintenance, and public transport",
          isDefault: true,
          sortOrder: 5
        },
        {
          name: "Debt Obligations",
          description: "Credit cards, personal loans, store accounts, and student loans",
          isDefault: true,
          sortOrder: 6
        },
        {
          name: "Communication & Technology",
          description: "Cell phone, landline, internet, and TV subscriptions",
          isDefault: true,
          sortOrder: 7
        },
        {
          name: "Childcare & Education",
          description: "School fees, aftercare, extracurricular activities, and child maintenance",
          isDefault: true,
          sortOrder: 8
        },
        {
          name: "Personal & Household",
          description: "Clothing, toiletries, household maintenance, and domestic help",
          isDefault: true,
          sortOrder: 9
        },
        {
          name: "Entertainment & Leisure",
          description: "Dining out, social events, gym memberships, and hobbies",
          isDefault: true,
          sortOrder: 10
        },
        {
          name: "Savings & Investments",
          description: "Savings accounts, emergency funds, retirement annuities, and investments",
          isDefault: true,
          sortOrder: 11
        },
        {
          name: "Other Obligations",
          description: "Policy premiums, alimony, loan guarantees, and other regular commitments",
          isDefault: true,
          sortOrder: 12
        }
      ];
      
      // Insert all default categories at once
      await db.insert(budgetCategories).values(
        defaultCategories.map(category => ({
          ...category,
          createdAt: new Date()
        }))
      );
      
      console.log(`Created ${defaultCategories.length} default budget categories`);
    } catch (error) {
      console.error("Error initializing default budget categories:", error);
      throw error;
    }
  }

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      const categories = await db.select()
        .from(budgetCategories)
        .orderBy(budgetCategories.sortOrder);
      
      return categories;
    } catch (error) {
      console.error("Database error in getBudgetCategories:", error);
      return [];
    }
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    try {
      const [category] = await db.select()
        .from(budgetCategories)
        .where(eq(budgetCategories.id, id));
      
      return category;
    } catch (error) {
      console.error("Database error in getBudgetCategory:", error);
      return undefined;
    }
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    try {
      const [category] = await db.insert(budgetCategories).values({
        ...insertCategory,
        createdAt: new Date()
      }).returning();
      
      return category;
    } catch (error) {
      console.error("Database error in createBudgetCategory:", error);
      throw new Error("Failed to create budget category");
    }
  }

  async getUserExpenses(userId: number): Promise<Expense[]> {
    try {
      const userExpenses = await db.select()
        .from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.createdAt));
      
      return userExpenses;
    } catch (error) {
      console.error("Database error in getUserExpenses:", error);
      return [];
    }
  }

  async getUserExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    try {
      const categoryExpenses = await db.select()
        .from(expenses)
        .where(
          and(
            eq(expenses.userId, userId),
            eq(expenses.categoryId, categoryId)
          )
        )
        .orderBy(desc(expenses.createdAt));
      
      return categoryExpenses;
    } catch (error) {
      console.error("Database error in getUserExpensesByCategory:", error);
      return [];
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db.select()
        .from(expenses)
        .where(eq(expenses.id, id));
      
      return expense;
    } catch (error) {
      console.error("Database error in getExpense:", error);
      return undefined;
    }
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    try {
      const now = new Date();
      const [expense] = await db.insert(expenses).values({
        ...insertExpense,
        createdAt: now,
        updatedAt: now
      }).returning();
      
      return expense;
    } catch (error) {
      console.error("Database error in createExpense:", error);
      throw new Error("Failed to create expense");
    }
  }

  async updateExpense(id: number, userId: number, updates: UpdateExpense): Promise<Expense | undefined> {
    try {
      const [updatedExpense] = await db.update(expenses)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        )
        .returning();
      
      return updatedExpense;
    } catch (error) {
      console.error("Database error in updateExpense:", error);
      return undefined;
    }
  }

  async deleteExpense(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db.delete(expenses)
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        );
      
      // If no errors occurred during deletion, consider it successful
      return true;
    } catch (error) {
      console.error("Database error in deleteExpense:", error);
      return false;
    }
  }
  
  // Password reset functionality

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const result = await db.update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error("Database error in updateUserPassword:", error);
      return false;
    }
  }
  
  // We'll use an in-memory approach for password reset tokens
  // In a production environment, these should be stored in the database
  private passwordResetTokens = new Map<string, { userId: number, expiresAt: Date }>();
  
  async storePasswordResetToken(email: string, token: string, expiresAt: Date): Promise<number | undefined> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return undefined;
      
      this.passwordResetTokens.set(token, { userId: user.id, expiresAt });
      return user.id;
    } catch (error) {
      console.error("Error storing password reset token:", error);
      return undefined;
    }
  }
  
  async validatePasswordResetToken(token: string): Promise<number | undefined> {
    try {
      const tokenData = this.passwordResetTokens.get(token);
      
      if (!tokenData) {
        return undefined;
      }
      
      // Check if token has expired
      if (new Date() > tokenData.expiresAt) {
        this.passwordResetTokens.delete(token); // Clean up expired token
        return undefined;
      }
      
      // Token is valid, return the user ID
      const userId = tokenData.userId;
      
      // Clean up used token
      this.passwordResetTokens.delete(token);
      
      return userId;
    } catch (error) {
      console.error("Error validating password reset token:", error);
      return undefined;
    }
  }
  
  async checkPasswordResetToken(token: string): Promise<number | undefined> {
    try {
      const tokenData = this.passwordResetTokens.get(token);
      
      if (!tokenData) {
        return undefined;
      }
      
      // Check if token has expired
      if (new Date() > tokenData.expiresAt) {
        this.passwordResetTokens.delete(token); // Clean up expired token
        return undefined;
      }
      
      // Token is valid, return the user ID without consuming it
      return tokenData.userId;
    } catch (error) {
      console.error("Error checking password reset token:", error);
      return undefined;
    }
  }
  
  async getInfoFromExpiredToken(token: string): Promise<{ email: string } | undefined> {
    try {
      // First check if token exists
      const tokenData = this.passwordResetTokens.get(token);
      
      if (!tokenData) {
        // Token doesn't exist at all
        return undefined;
      }
      
      // Even if token is expired, we'll try to get the user info
      const user = await this.getUser(tokenData.userId);
      if (!user) {
        return undefined;
      }
      
      return { email: user.email };
    } catch (error) {
      console.error("Error getting info from expired token:", error);
      return undefined;
    }
  }
  
  async comparePasswords(userId: number, password: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;
      
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch;
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  }
}

// Exporting the appropriate storage implementation
// Determine if we're using Azure database
const isAzureDb = process.env.DATABASE_URL?.includes('azure.com') || false;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create memory storage right away as a backup option
const memStorage = new MemStorage();

// Choose the appropriate storage implementation
let storageImplementation: IStorage;

// Always use in-memory storage for now to get the app running
storageImplementation = memStorage;
console.log('Using in-memory storage (data will not persist between restarts)');

// This is a modified approach that will work with both local dev and production
export const storage = storageImplementation;
