import { eq, sql } from 'drizzle-orm';
import { users, calculationResults, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import type { IStorage } from './storage';
import bcrypt from 'bcrypt';
import { db } from './db';

/**
 * Database storage implementation using PostgreSQL via Drizzle ORM
 * Implements all IStorage interface methods with proper error handling
 */
export class DatabaseStorage implements IStorage {
  private otps = new Map<number, { otp: string; expiresAt: Date }>();
  private resetTokens = new Map<string, { userId: number; expiresAt: Date }>();

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const db = await getDatabase();
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);

      const result = await db.insert(users).values({
        ...insertUser,
        password: hashedPassword,
        otpVerified: insertUser.otpVerified || false,
        profileComplete: insertUser.profileComplete || false
      }).returning();

      if (result.length === 0) {
        throw new Error('Failed to create user');
      }

      return result[0];
    } catch (error: any) {
      console.error('Database error in createUser:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Database error in getUserByEmail:', error);
      return undefined;
    }
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Database error in getUserById:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Database error in updateUser:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.delete(users).where(eq(users.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Database error in deleteUser:', error);
      return false;
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const db = await getDatabase();
      return await db.select().from(users);
    } catch (error: any) {
      console.error('Database error in listUsers:', error);
      return [];
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return false;
      return await bcrypt.compare(password, user.password);
    } catch (error: any) {
      console.error('Database error in verifyPassword:', error);
      return false;
    }
  }

  // OTP methods (using in-memory storage for now, can be moved to database later)
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otps.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const stored = this.otps.get(userId);
    if (!stored) return false;
    
    if (new Date() > stored.expiresAt) {
      this.otps.delete(userId);
      return false;
    }
    
    if (stored.otp === otp) {
      this.otps.delete(userId);
      return true;
    }
    
    return false;
  }

  // Password reset token methods (using in-memory storage for now)
  async storeResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expiresAt });
  }

  async verifyResetToken(token: string): Promise<boolean> {
    const stored = this.resetTokens.get(token);
    if (!stored) return false;
    return new Date() <= stored.expiresAt;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const stored = this.resetTokens.get(token);
    if (!stored || new Date() > stored.expiresAt) {
      if (stored) this.resetTokens.delete(token);
      return undefined;
    }
    return await this.getUserById(stored.userId);
  }

  async clearResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  // Calculation methods
  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    try {
      const db = await getDatabase();
      const result = await db.insert(calculationResults).values(insertCalculationResult).returning();
      if (result.length === 0) {
        throw new Error('Failed to create calculation result');
      }
      return result[0];
    } catch (error: any) {
      console.error('Database error in createCalculationResult:', error);
      throw new Error(`Failed to create calculation result: ${error.message}`);
    }
  }

  async getCalculationResult(id: number): Promise<CalculationResult | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.select().from(calculationResults).where(eq(calculationResults.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Database error in getCalculationResult:', error);
      return undefined;
    }
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    try {
      const db = await getDatabase();
      return await db.select().from(calculationResults).where(eq(calculationResults.userId, userId));
    } catch (error: any) {
      console.error('Database error in getUserCalculationResults:', error);
      return [];
    }
  }

  async updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.update(calculationResults).set(updates).where(eq(calculationResults.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Database error in updateCalculationResult:', error);
      return undefined;
    }
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.delete(calculationResults).where(eq(calculationResults.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Database error in deleteCalculationResult:', error);
      return false;
    }
  }

  // Property methods
  async getUserProperties(userId: number): Promise<Property[]> {
    try {
      const db = await getDatabase();
      return await db.select().from(properties).where(eq(properties.userId, userId));
    } catch (error: any) {
      console.error('Database error in getUserProperties:', error);
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Database error in getProperty:', error);
      return undefined;
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    try {
      const db = await getDatabase();
      const result = await db.insert(properties).values(insertProperty).returning();
      if (result.length === 0) {
        throw new Error('Failed to create property');
      }
      return result[0];
    } catch (error: any) {
      console.error('Database error in createProperty:', error);
      throw new Error(`Failed to create property: ${error.message}`);
    }
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.update(properties).set(updates).where(eq(properties.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Database error in updateProperty:', error);
      return undefined;
    }
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.delete(properties).where(eq(properties.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Database error in deleteProperty:', error);
      return false;
    }
  }

  // Loan scenario methods
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    try {
      const db = await getDatabase();
      return await db.select().from(loanScenarios).where(eq(loanScenarios.propertyId, propertyId));
    } catch (error: any) {
      console.error('Database error in getPropertyLoanScenarios:', error);
      return [];
    }
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.select().from(loanScenarios).where(eq(loanScenarios.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      console.error('Database error in getLoanScenario:', error);
      return undefined;
    }
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    try {
      const db = await getDatabase();
      const result = await db.insert(loanScenarios).values(insertLoanScenario).returning();
      if (result.length === 0) {
        throw new Error('Failed to create loan scenario');
      }
      return result[0];
    } catch (error: any) {
      console.error('Database error in createLoanScenario:', error);
      throw new Error(`Failed to create loan scenario: ${error.message}`);
    }
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    try {
      const db = await getDatabase();
      const result = await db.update(loanScenarios).set(updates).where(eq(loanScenarios.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error('Database error in updateLoanScenario:', error);
      return undefined;
    }
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.delete(loanScenarios).where(eq(loanScenarios.id, id));
      return (result as any).rowCount > 0;
    } catch (error: any) {
      console.error('Database error in deleteLoanScenario:', error);
      return false;
    }
  }
}