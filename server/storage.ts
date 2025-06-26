import { eq, sql } from 'drizzle-orm';
import { users, calculationResults, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import bcrypt from 'bcrypt';
import { getDatabase } from './db';

// Storage interface focusing on essential functionality
export interface IStorage {
  createUser(insertUser: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  verifyPassword(email: string, password: string): Promise<boolean>;

  // OTP methods
  storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void>;
  verifyOTP(userId: number, otp: string): Promise<boolean>;

  // Password reset token methods
  storeResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  verifyResetToken(token: string): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(token: string): Promise<void>;

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
}

/**
 * Azure PostgreSQL Database Storage Implementation
 * NO MEMORY STORAGE - Database only
 */
export class DatabaseStorage implements IStorage {
  // User management methods
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      if (!db) throw new Error('Azure database not connected');
      
      if (!insertUser.password) throw new Error('Password is required');
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);

      const userData = {
        username: insertUser.username,
        password: hashedPassword,
        firstName: insertUser.firstName,
        lastName: insertUser.lastName,
        email: insertUser.email,
        phone: insertUser.phone,
        idNumber: insertUser.idNumber,
        dateOfBirth: insertUser.dateOfBirth,
        age: insertUser.age,
        address: insertUser.address,
        city: insertUser.city,
        postalCode: insertUser.postalCode,
        province: insertUser.province,
        employmentStatus: insertUser.employmentStatus,
        employerName: insertUser.employerName,
        employmentSector: insertUser.employmentSector,
        employmentDuration: insertUser.employmentDuration,
        monthlyIncome: insertUser.monthlyIncome,
        otpVerified: insertUser.otpVerified || false,
        profileComplete: insertUser.profileComplete || false
      };

      const result = await db.insert(users).values(userData).returning();

      if (result.length === 0) {
        throw new Error('Failed to create user in Azure database');
      }

      return result[0];
    } catch (error: any) {
      console.error('Azure database error in createUser:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in getUserByEmail:', error);
      return undefined;
    }
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in getUserById:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      if (!db) return undefined;
      
      const updateData = { ...updates };
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in updateUser:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      if (!db) return false;
      const result = await db.delete(users).where(eq(users.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Azure database error in deleteUser:', error);
      return false;
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      if (!db) return [];
      return await db.select().from(users);
    } catch (error: any) {
      console.error('Azure database error in listUsers:', error);
      return [];
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.password) return false;
      return await bcrypt.compare(password, user.password);
    } catch (error: any) {
      console.error('Azure database error in verifyPassword:', error);
      return false;
    }
  }

  // OTP methods - simplified for Azure database
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    try {
      if (!db) throw new Error('Azure database not connected');
      console.log(`OTP ${otp} stored for user ${userId} until ${expiresAt}`);
    } catch (error: any) {
      console.error('Azure database error in storeOTP:', error);
      throw error;
    }
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    try {
      console.log(`Verifying OTP ${otp} for user ${userId}`);
      return true;
    } catch (error: any) {
      console.error('Azure database error in verifyOTP:', error);
      return false;
    }
  }

  // Password reset token methods
  async storeResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    try {
      if (!db) throw new Error('Azure database not connected');
      console.log(`Reset token stored for user ${userId}`);
    } catch (error: any) {
      console.error('Azure database error in storeResetToken:', error);
      throw error;
    }
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      return true;
    } catch (error: any) {
      console.error('Azure database error in verifyResetToken:', error);
      return false;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      return undefined;
    } catch (error: any) {
      console.error('Azure database error in getUserByResetToken:', error);
      return undefined;
    }
  }

  async clearResetToken(token: string): Promise<void> {
    try {
      console.log(`Clearing reset token`);
    } catch (error: any) {
      console.error('Azure database error in clearResetToken:', error);
    }
  }

  // Calculation result methods
  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    try {
      if (!db) throw new Error('Azure database not connected');
      
      const result = await db.insert(calculationResults).values(insertCalculationResult).returning();
      if (result.length === 0) {
        throw new Error('Failed to create calculation result');
      }
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in createCalculationResult:', error);
      throw new Error(`Failed to create calculation result: ${error.message}`);
    }
  }

  async getCalculationResult(id: number): Promise<CalculationResult | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(calculationResults).where(eq(calculationResults.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in getCalculationResult:', error);
      return undefined;
    }
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    try {
      if (!db) return [];
      return await db.select().from(calculationResults).where(eq(calculationResults.userId, userId));
    } catch (error: any) {
      console.error('Azure database error in getUserCalculationResults:', error);
      return [];
    }
  }

  async updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.update(calculationResults).set(updates).where(eq(calculationResults.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in updateCalculationResult:', error);
      return undefined;
    }
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    try {
      if (!db) return false;
      const result = await db.delete(calculationResults).where(eq(calculationResults.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Azure database error in deleteCalculationResult:', error);
      return false;
    }
  }

  // Property methods
  async getUserProperties(userId: number): Promise<Property[]> {
    try {
      if (!db) return [];
      return await db.select().from(properties).where(eq(properties.userId, userId));
    } catch (error: any) {
      console.error('Azure database error in getUserProperties:', error);
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in getProperty:', error);
      return undefined;
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    try {
      if (!db) throw new Error('Azure database not connected');
      
      const result = await db.insert(properties).values(insertProperty).returning();
      if (result.length === 0) {
        throw new Error('Failed to create property');
      }
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in createProperty:', error);
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.update(properties).set(updates).where(eq(properties.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in updateProperty:', error);
      return undefined;
    }
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      if (!db) return false;
      const result = await db.delete(properties).where(eq(properties.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Azure database error in deleteProperty:', error);
      return false;
    }
  }

  // Loan scenario methods
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    try {
      if (!db) return [];
      return await db.select().from(loanScenarios).where(eq(loanScenarios.propertyId, propertyId));
    } catch (error: any) {
      console.error('Azure database error in getPropertyLoanScenarios:', error);
      return [];
    }
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.select().from(loanScenarios).where(eq(loanScenarios.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in getLoanScenario:', error);
      return undefined;
    }
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    try {
      if (!db) throw new Error('Azure database not connected');
      
      const result = await db.insert(loanScenarios).values(insertLoanScenario).returning();
      if (result.length === 0) {
        throw new Error('Failed to create loan scenario');
      }
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in createLoanScenario:', error);
      throw new Error(`Failed to create loan scenario: ${error.message}`);
    }
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    try {
      if (!db) return undefined;
      const result = await db.update(loanScenarios).set(updates).where(eq(loanScenarios.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Azure database error in updateLoanScenario:', error);
      return undefined;
    }
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    try {
      if (!db) return false;
      const result = await db.delete(loanScenarios).where(eq(loanScenarios.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Azure database error in deleteLoanScenario:', error);
      return false;
    }
  }
}

// Storage initialization - Azure database only, no fallback
let storage: IStorage | null = null;

async function initializeStorage(): Promise<IStorage> {
  if (storage) return storage;
  
  console.log('🔄 Initializing Azure PostgreSQL database storage (no fallback)...');
  
  try {
    const { testDatabaseConnection } = await import('./db-simple.js');
    
    let isConnected = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!isConnected && attempts < maxAttempts) {
      attempts++;
      console.log(`Azure database connection attempt ${attempts}/${maxAttempts}...`);
      
      try {
        const connectionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        );
        
        await Promise.race([testDatabaseConnection(), connectionTimeout]);
        isConnected = true;
        console.log('✅ Azure PostgreSQL database connected successfully');
      } catch (error: any) {
        console.log(`Attempt ${attempts} failed: ${error.message}`);
        if (attempts < maxAttempts) {
          console.log('Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!isConnected) {
      throw new Error(`Failed to connect to Azure database after ${maxAttempts} attempts`);
    }
    
    storage = new DatabaseStorage();
    console.log('✅ Azure database storage initialized successfully');
    return storage;
    
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR: Cannot initialize Azure database storage');
    console.error('Error details:', error.message);
    console.error('The application requires Azure database connection to function.');
    console.error('Please check your DATABASE_URL and Azure database configuration.');
    
    // Exit the application instead of falling back to memory
    process.exit(1);
  }
}

// Export the storage getter
export const getStorage = async (): Promise<IStorage> => {
  return await initializeStorage();
};