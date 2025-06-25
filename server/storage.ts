// Fixed DatabaseStorage implementation with proper database connectivity
import { eq, sql, inArray, and, asc, desc } from 'drizzle-orm';
import { users, calculationResults, contactSubmissions, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, ContactSubmission, InsertContactSubmission, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import bcrypt from 'bcrypt';
import { getDatabase, withRetry } from './db-robust';

// Storage interface
export interface IStorage {
  createUser(insertUser: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  verifyPassword(email: string, password: string): Promise<boolean>;

  createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult>;
  getCalculationResult(id: number): Promise<CalculationResult | undefined>;
  getUserCalculationResults(userId: number): Promise<CalculationResult[]>;
  updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined>;
  deleteCalculationResult(id: number): Promise<boolean>;

  // Property methods
  getUserProperties(userId: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(insertProperty: InsertProperty): Promise<Property>;
  updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Loan scenario methods
  getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]>;
  getLoanScenario(id: number): Promise<LoanScenario | undefined>;
  createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario>;
  updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined>;
  deleteLoanScenario(id: number): Promise<boolean>;

  createBudgetCategory(insertBudgetCategory: InsertBudgetCategory): Promise<BudgetCategory>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  getUserBudgetCategories(userId: number): Promise<BudgetCategory[]>;
  updateBudgetCategory(id: number, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: number): Promise<boolean>;

  createExpense(insertExpense: InsertExpense): Promise<Expense>;
  getExpense(id: number): Promise<Expense | undefined>;
  getUserExpenses(userId: number): Promise<Expense[]>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  createApplication(insertApplication: InsertApplication): Promise<Application>;
  getApplication(id: number): Promise<Application | undefined>;
  getUserApplications(userId: number): Promise<Application[]>;
  updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
}

// Main DatabaseStorage class with proper error handling and database connectivity
export class DatabaseStorage implements IStorage {
  // User management methods
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const db = await getDatabase();
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
      
      const userResult = await withRetry(async () => {
        return db.execute(sql`
          INSERT INTO users (
            username, password, first_name, last_name, email, phone, 
            id_number, date_of_birth, age, address, city, postal_code, 
            province, employment_status, employer_name, employment_sector, 
            employment_duration, monthly_income, otp_verified, profile_complete
          ) VALUES (
            ${insertUser.username}, ${hashedPassword}, ${insertUser.firstName}, ${insertUser.lastName}, 
            ${insertUser.email}, ${insertUser.phone}, ${insertUser.idNumber}, ${insertUser.dateOfBirth}, 
            ${insertUser.age}, ${insertUser.address}, ${insertUser.city}, ${insertUser.postalCode}, 
            ${insertUser.province}, ${insertUser.employmentStatus}, ${insertUser.employerName}, 
            ${insertUser.employmentSector}, ${insertUser.employmentDuration}, ${insertUser.monthlyIncome}, 
            ${insertUser.otpVerified || false}, ${insertUser.profileComplete || false}
          ) RETURNING *
        `);
      });

      if (userResult.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      const userData = userResult.rows[0];
      return {
        id: userData.id,
        username: userData.username,
        password: userData.password,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: userData.phone || null,
        idNumber: userData.id_number || null,
        dateOfBirth: userData.date_of_birth || null,
        age: userData.age || null,
        address: userData.address || null,
        city: userData.city || null,
        postalCode: userData.postal_code || null,
        province: userData.province || null,
        employmentStatus: userData.employment_status || null,
        employerName: userData.employer_name || null,
        employmentSector: userData.employment_sector || null,
        employmentDuration: userData.employment_duration || null,
        monthlyIncome: userData.monthly_income || null,
        otpVerified: userData.otp_verified || false,
        profileComplete: userData.profile_complete || false,
        createdAt: userData.created_at ? new Date(userData.created_at) : null,
        updatedAt: userData.updated_at ? new Date(userData.updated_at) : null
      };
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw new Error('Failed to create user in database: ' + (error as Error).message);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      const userResult = await withRetry(async () => {
        return db.execute(sql`
          SELECT id, username, password, first_name as "firstName", last_name as "lastName", 
          email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
          address, city, postal_code as "postalCode", province, 
          employment_status as "employmentStatus", employer_name as "employerName", 
          employment_sector as "employmentSector", 
          employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
          otp_verified as "otpVerified", profile_complete as "profileComplete", 
          created_at as "createdAt", updated_at as "updatedAt"
          FROM users 
          WHERE email = ${email}
          LIMIT 1
        `);
      });
      
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];
        return {
          id: userData.id,
          username: userData.username,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          idNumber: userData.idNumber,
          dateOfBirth: userData.dateOfBirth,
          age: userData.age,
          address: userData.address,
          city: userData.city,
          postalCode: userData.postalCode,
          province: userData.province,
          employmentStatus: userData.employmentStatus,
          employerName: userData.employerName,
          employmentSector: userData.employmentSector,
          employmentDuration: userData.employmentDuration,
          monthlyIncome: userData.monthlyIncome,
          otpVerified: userData.otpVerified,
          profileComplete: userData.profileComplete,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : null,
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : null
        };
      }
      
      return undefined;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return undefined;
    }
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      const userResult = await withRetry(async () => {
        return db.select().from(users).where(eq(users.id, id));
      });
      
      return userResult[0] || undefined;
    } catch (error) {
      console.error('Database error in getUserById:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      
      if (updates.password) {
        const saltRounds = 10;
        updates.password = await bcrypt.hash(updates.password, saltRounds);
      }

      const userResult = await withRetry(async () => {
        return db.update(users).set(updates).where(eq(users.id, id)).returning();
      });
      
      return userResult[0] || undefined;
    } catch (error) {
      console.error('Database error in updateUser:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(users).where(eq(users.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteUser:', error);
      return false;
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const db = await getDatabase();
      const userResult = await withRetry(async () => {
        return db.select().from(users);
      });
      
      return userResult;
    } catch (error) {
      console.error('Database error in listUsers:', error);
      return [];
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.password) {
        return false;
      }
      
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Database error in verifyPassword:', error);
      return false;
    }
  }

  // Calculation methods
  async createCalculation(insertCalculation: InsertCalculation): Promise<Calculation> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(calculations).values(insertCalculation).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createCalculation:', error);
      throw error;
    }
  }

  async getCalculation(id: number): Promise<Calculation | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(calculations).where(eq(calculations.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getCalculation:', error);
      return undefined;
    }
  }

  async getUserCalculations(userId: number): Promise<Calculation[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(calculations).where(eq(calculations.userId, userId));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserCalculations:', error);
      return [];
    }
  }

  async updateCalculation(id: number, updates: Partial<InsertCalculation>): Promise<Calculation | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(calculations).set(updates).where(eq(calculations.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateCalculation:', error);
      return undefined;
    }
  }

  async deleteCalculation(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(calculations).where(eq(calculations.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteCalculation:', error);
      return false;
    }
  }

  // Property management methods
  async getUserProperties(userId: number): Promise<Property[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(properties).where(eq(properties.userId, userId)).orderBy(asc(properties.createdAt));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserProperties:', error);
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(properties).where(eq(properties.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getProperty:', error);
      return undefined;
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(properties).values(insertProperty).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createProperty:', error);
      throw error;
    }
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(properties).set(updates).where(eq(properties.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateProperty:', error);
      return undefined;
    }
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(properties).where(eq(properties.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteProperty:', error);
      return false;
    }
  }

  // Loan scenario methods
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(loanScenarios).where(eq(loanScenarios.propertyId, propertyId)).orderBy(asc(loanScenarios.createdAt));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getPropertyLoanScenarios:', error);
      return [];
    }
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(loanScenarios).where(eq(loanScenarios.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getLoanScenario:', error);
      return undefined;
    }
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(loanScenarios).values(insertLoanScenario).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createLoanScenario:', error);
      throw error;
    }
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(loanScenarios).set(updates).where(eq(loanScenarios.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateLoanScenario:', error);
      return undefined;
    }
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(loanScenarios).where(eq(loanScenarios.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteLoanScenario:', error);
      return false;
    }
  }

  // Budget category methods
  async createBudgetCategory(insertBudgetCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(budgetCategories).values(insertBudgetCategory).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createBudgetCategory:', error);
      throw error;
    }
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(budgetCategories).where(eq(budgetCategories.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getBudgetCategory:', error);
      return undefined;
    }
  }

  async getUserBudgetCategories(userId: number): Promise<BudgetCategory[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(budgetCategories).where(eq(budgetCategories.userId, userId));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserBudgetCategories:', error);
      return [];
    }
  }

  async updateBudgetCategory(id: number, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(budgetCategories).set(updates).where(eq(budgetCategories.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateBudgetCategory:', error);
      return undefined;
    }
  }

  async deleteBudgetCategory(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(budgetCategories).where(eq(budgetCategories.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteBudgetCategory:', error);
      return false;
    }
  }

  // Expense methods
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(expenses).values(insertExpense).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createExpense:', error);
      throw error;
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(expenses).where(eq(expenses.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getExpense:', error);
      return undefined;
    }
  }

  async getUserExpenses(userId: number): Promise<Expense[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(expenses).where(eq(expenses.userId, userId));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserExpenses:', error);
      return [];
    }
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateExpense:', error);
      return undefined;
    }
  }

  async deleteExpense(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(expenses).where(eq(expenses.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteExpense:', error);
      return false;
    }
  }

  // Application methods
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(applications).values(insertApplication).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createApplication:', error);
      throw error;
    }
  }

  async getApplication(id: number): Promise<Application | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(applications).where(eq(applications.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getApplication:', error);
      return undefined;
    }
  }

  async getUserApplications(userId: number): Promise<Application[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(applications).where(eq(applications.userId, userId));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserApplications:', error);
      return [];
    }
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(applications).set(updates).where(eq(applications.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateApplication:', error);
      return undefined;
    }
  }

  async deleteApplication(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(applications).where(eq(applications.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteApplication:', error);
      return false;
    }
  }
}

// Memory storage fallback for development/testing
export class MemStorage implements IStorage {
  users: Map<number, User> = new Map();
  calculations: Map<number, Calculation> = new Map();
  budgetCategories: Map<number, BudgetCategory> = new Map();
  expenses: Map<number, Expense> = new Map();
  applications: Map<number, Application> = new Map();
  
  userIdCounter = 1;
  calculationIdCounter = 1;
  budgetCategoryIdCounter = 1;
  expenseIdCounter = 1;
  applicationIdCounter = 1;

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const user: User = {
      id: this.userIdCounter++,
      ...insertUser,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    if (updates.password) {
      const saltRounds = 10;
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }

  // Calculation methods
  async createCalculation(insertCalculation: InsertCalculation): Promise<Calculation> {
    const calculation: Calculation = {
      id: this.calculationIdCounter++,
      ...insertCalculation,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.calculations.set(calculation.id, calculation);
    return calculation;
  }

  async getCalculation(id: number): Promise<Calculation | undefined> {
    return this.calculations.get(id);
  }

  async getUserCalculations(userId: number): Promise<Calculation[]> {
    return Array.from(this.calculations.values()).filter(calc => calc.userId === userId);
  }

  async updateCalculation(id: number, updates: Partial<InsertCalculation>): Promise<Calculation | undefined> {
    const calculation = this.calculations.get(id);
    if (!calculation) return undefined;

    const updatedCalculation = { ...calculation, ...updates, updatedAt: new Date() };
    this.calculations.set(id, updatedCalculation);
    return updatedCalculation;
  }

  async deleteCalculation(id: number): Promise<boolean> {
    return this.calculations.delete(id);
  }

  // Property methods - stub implementations for MemStorage
  async getUserProperties(userId: number): Promise<Property[]> {
    return [];
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return undefined;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    throw new Error('Property management not implemented in MemStorage');
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    return undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return false;
  }

  // Loan scenario methods - stub implementations for MemStorage
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    return [];
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    return undefined;
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    throw new Error('Loan scenario management not implemented in MemStorage');
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    return undefined;
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    return false;
  }

  // Budget category methods
  async createBudgetCategory(insertBudgetCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const budgetCategory: BudgetCategory = {
      id: this.budgetCategoryIdCounter++,
      ...insertBudgetCategory,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.budgetCategories.set(budgetCategory.id, budgetCategory);
    return budgetCategory;
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    return this.budgetCategories.get(id);
  }

  async getUserBudgetCategories(userId: number): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter(cat => cat.userId === userId);
  }

  async updateBudgetCategory(id: number, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const budgetCategory = this.budgetCategories.get(id);
    if (!budgetCategory) return undefined;

    const updatedBudgetCategory = { ...budgetCategory, ...updates, updatedAt: new Date() };
    this.budgetCategories.set(id, updatedBudgetCategory);
    return updatedBudgetCategory;
  }

  async deleteBudgetCategory(id: number): Promise<boolean> {
    return this.budgetCategories.delete(id);
  }

  // Expense methods
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const expense: Expense = {
      id: this.expenseIdCounter++,
      ...insertExpense,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getUserExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(exp => exp.userId === userId);
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updatedExpense = { ...expense, ...updates, updatedAt: new Date() };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Application methods
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const application: Application = {
      id: this.applicationIdCounter++,
      ...insertApplication,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.applications.set(application.id, application);
    return application;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getUserApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.userId === userId);
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;

    const updatedApplication = { ...application, ...updates, updatedAt: new Date() };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }
}

// Initialize storage instance - always use DatabaseStorage for persistence
export const storage: IStorage = new DatabaseStorage();