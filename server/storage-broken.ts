// Simplified DatabaseStorage implementation focused on user persistence
import { eq, sql } from 'drizzle-orm';
import { users, calculationResults, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import bcrypt from 'bcrypt';
import { getDatabase, withRetry } from './db-robust';

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

// DatabaseStorage implementation with proper error handling
export class DatabaseStorage implements IStorage {
  private otpStore = new Map<number, { otp: string; expiresAt: Date }>();
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
            ${insertUser.email}, ${insertUser.phone || null}, ${insertUser.idNumber || null}, ${insertUser.dateOfBirth || null}, 
            ${insertUser.age || null}, ${insertUser.address || null}, ${insertUser.city || null}, ${insertUser.postalCode || null}, 
            ${insertUser.province || null}, ${insertUser.employmentStatus || null}, ${insertUser.employerName || null}, 
            ${insertUser.employmentSector || null}, ${insertUser.employmentDuration || null}, ${insertUser.monthlyIncome || null}, 
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
        providerId: userData.provider_id || null,
        providerAccountId: userData.provider_account_id || null,
        image: userData.image || null,
        title: userData.title || null,
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
        jobTitle: userData.job_title || null,
        employmentDuration: userData.employment_duration || null,
        monthlyIncome: userData.monthly_income || null,
        maritalStatus: userData.marital_status || null,
        hasCoApplicant: userData.has_co_applicant || false,
        coApplicantTitle: userData.co_applicant_title || null,
        coApplicantFirstName: userData.co_applicant_first_name || null,
        coApplicantLastName: userData.co_applicant_last_name || null,
        coApplicantEmail: userData.co_applicant_email || null,
        coApplicantPhone: userData.co_applicant_phone || null,
        coApplicantIdNumber: userData.co_applicant_id_number || null,
        coApplicantDateOfBirth: userData.co_applicant_date_of_birth || null,
        coApplicantAge: userData.co_applicant_age || null,
        coApplicantEmploymentStatus: userData.co_applicant_employment_status || null,
        coApplicantEmployerName: userData.co_applicant_employer_name || null,
        coApplicantEmploymentSector: userData.co_applicant_employment_sector || null,
        coApplicantJobTitle: userData.co_applicant_job_title || null,
        coApplicantEmploymentDuration: userData.co_applicant_employment_duration || null,
        coApplicantMonthlyIncome: userData.co_applicant_monthly_income || null,
        sameAddress: userData.same_address || true,
        coApplicantAddress: userData.co_applicant_address || null,
        coApplicantCity: userData.co_applicant_city || null,
        coApplicantPostalCode: userData.co_applicant_postal_code || null,
        coApplicantProvince: userData.co_applicant_province || null,
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
        return db.select().from(users).where(eq(users.email, email)).limit(1);
      });
      
      return userResult[0] || undefined;
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
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otpStore.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const stored = this.otpStore.get(userId);
    if (!stored) return false;
    
    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(userId);
      return false;
    }
    
    if (stored.otp === otp) {
      this.otpStore.delete(userId);
      return true;
    }
    
    return false;
  }
      
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Database error in verifyPassword:', error);
      return false;
    }
  }

  // Calculation result methods
  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.insert(calculationResults).values(insertCalculationResult).returning();
      });
      
      return result[0];
    } catch (error) {
      console.error('Database error in createCalculationResult:', error);
      throw error;
    }
  }

  async getCalculationResult(id: number): Promise<CalculationResult | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(calculationResults).where(eq(calculationResults.id, id));
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in getCalculationResult:', error);
      return undefined;
    }
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(calculationResults).where(eq(calculationResults.userId, userId));
      });
      
      return result;
    } catch (error) {
      console.error('Database error in getUserCalculationResults:', error);
      return [];
    }
  }

  async updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.update(calculationResults).set(updates).where(eq(calculationResults.id, id)).returning();
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Database error in updateCalculationResult:', error);
      return undefined;
    }
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.delete(calculationResults).where(eq(calculationResults.id, id));
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error in deleteCalculationResult:', error);
      return false;
    }
  }

  // Property management methods
  async getUserProperties(userId: number): Promise<Property[]> {
    try {
      const db = await getDatabase();
      const result = await withRetry(async () => {
        return db.select().from(properties).where(eq(properties.userId, userId));
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
        return db.select().from(loanScenarios).where(eq(loanScenarios.propertyId, propertyId));
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
}

// Memory storage fallback for development/testing
export class MemStorage implements IStorage {
  otps = new Map<number, { otp: string; expiresAt: Date }>();
  users: Map<number, User> = new Map();
  calculationResults: Map<number, CalculationResult> = new Map();
  properties: Map<number, Property> = new Map();
  loanScenarios: Map<number, LoanScenario> = new Map();
  
  userIdCounter = 1;
  calculationIdCounter = 1;
  propertyIdCounter = 1;
  scenarioIdCounter = 1;

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const user: User = {
      id: this.userIdCounter++,
      username: insertUser.username || null,
      password: hashedPassword,
      providerId: null,
      providerAccountId: null,
      image: null,
      title: null,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      phone: insertUser.phone || null,
      idNumber: insertUser.idNumber || null,
      dateOfBirth: insertUser.dateOfBirth || null,
      age: insertUser.age || null,
      address: insertUser.address || null,
      city: insertUser.city || null,
      postalCode: insertUser.postalCode || null,
      province: insertUser.province || null,
      employmentStatus: insertUser.employmentStatus || null,
      employerName: insertUser.employerName || null,
      employmentSector: insertUser.employmentSector || null,
      jobTitle: null,
      employmentDuration: insertUser.employmentDuration || null,
      monthlyIncome: insertUser.monthlyIncome || null,
      maritalStatus: null,
      hasCoApplicant: false,
      coApplicantTitle: null,
      coApplicantFirstName: null,
      coApplicantLastName: null,
      coApplicantEmail: null,
      coApplicantPhone: null,
      coApplicantIdNumber: null,
      coApplicantDateOfBirth: null,
      coApplicantAge: null,
      coApplicantEmploymentStatus: null,
      coApplicantEmployerName: null,
      coApplicantEmploymentSector: null,
      coApplicantJobTitle: null,
      coApplicantEmploymentDuration: null,
      coApplicantMonthlyIncome: null,
      sameAddress: true,
      coApplicantAddress: null,
      coApplicantCity: null,
      coApplicantPostalCode: null,
      coApplicantProvince: null,
      otpVerified: insertUser.otpVerified || false,
      profileComplete: insertUser.profileComplete || false,
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

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }

  // Calculation result methods
  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    const calculationResult: CalculationResult = {
      id: this.calculationIdCounter++,
      ...insertCalculationResult,
      createdAt: new Date()
    };
    
    this.calculationResults.set(calculationResult.id, calculationResult);
    return calculationResult;
  }

  async getCalculationResult(id: number): Promise<CalculationResult | undefined> {
    return this.calculationResults.get(id);
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    return Array.from(this.calculationResults.values()).filter(calc => calc.userId === userId);
  }

  async updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined> {
    const calculationResult = this.calculationResults.get(id);
    if (!calculationResult) return undefined;

    const updatedCalculationResult = { ...calculationResult, ...updates };
    this.calculationResults.set(id, updatedCalculationResult);
    return updatedCalculationResult;
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    return this.calculationResults.delete(id);
  }

  // Property methods - stub implementations for MemStorage
  async getUserProperties(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(property => property.userId === userId).sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const property: Property = {
      id: this.propertyIdCounter++,
      ...insertProperty,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.properties.set(property.id, property);
    return property;
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty = { ...property, ...updates, updatedAt: new Date() };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Also delete associated loan scenarios
    Array.from(this.loanScenarios.entries()).forEach(([scenarioId, scenario]) => {
      if (scenario.propertyId === id) {
        this.loanScenarios.delete(scenarioId);
      }
    });
    
    return this.properties.delete(id);
  }

  // Loan scenario methods - stub implementations for MemStorage
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    return Array.from(this.loanScenarios.values()).filter(scenario => scenario.propertyId === propertyId).sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    return this.loanScenarios.get(id);
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    const loanScenario: LoanScenario = {
      id: this.scenarioIdCounter++,
      ...insertLoanScenario,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.loanScenarios.set(loanScenario.id, loanScenario);
    return loanScenario;
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    const loanScenario = this.loanScenarios.get(id);
    if (!loanScenario) return undefined;

    const updatedLoanScenario = { ...loanScenario, ...updates, updatedAt: new Date() };
    this.loanScenarios.set(id, updatedLoanScenario);
    return updatedLoanScenario;
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    return this.loanScenarios.delete(id);
  }
}

// Initialize storage with fallback mechanism
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  if (storage) return storage;
  
  try {
    // Try to initialize database storage with a quick connection test
    const dbStorage = new DatabaseStorage();
    
    // Quick test to see if database is accessible
    const testPromise = dbStorage.listUsers();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    
    console.log('✓ Database storage initialized successfully');
    storage = dbStorage;
    return storage;
  } catch (error) {
    console.log('⚠ Database unavailable, using in-memory storage');
    storage = new MemStorage();
    return storage;
  }
}

// Export a promise that resolves to the storage instance
export const getStorage = async (): Promise<IStorage> => {
  return await initializeStorage();
};