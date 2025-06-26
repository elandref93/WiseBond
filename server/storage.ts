import { eq } from 'drizzle-orm';
import { users, calculationResults, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import bcrypt from 'bcrypt';

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

// Simple in-memory storage implementation
export class MemStorage implements IStorage {
  users: Map<number, User> = new Map();
  calculationResults: Map<number, CalculationResult> = new Map();
  properties: Map<number, Property> = new Map();
  loanScenarios: Map<number, LoanScenario> = new Map();
  otps: Map<number, { otp: string; expiresAt: Date }> = new Map();
  resetTokens: Map<string, { userId: number; expiresAt: Date }> = new Map();

  userIdCounter = 1;
  calculationIdCounter = 1;
  propertyIdCounter = 1;
  scenarioIdCounter = 1;

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password || '', 10);
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

  async storeResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expiresAt });
  }

  async verifyResetToken(token: string): Promise<boolean> {
    const stored = this.resetTokens.get(token);
    if (!stored) return false;
    
    if (new Date() > stored.expiresAt) {
      this.resetTokens.delete(token);
      return false;
    }
    
    return true;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const stored = this.resetTokens.get(token);
    if (!stored) return undefined;
    
    if (new Date() > stored.expiresAt) {
      this.resetTokens.delete(token);
      return undefined;
    }
    
    return this.users.get(stored.userId);
  }

  async clearResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    const calculationResult: CalculationResult = {
      id: this.calculationIdCounter++,
      userId: insertCalculationResult.userId || null,
      calculationType: insertCalculationResult.calculationType,
      inputData: insertCalculationResult.inputData,
      resultData: insertCalculationResult.resultData,
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
    const calc = this.calculationResults.get(id);
    if (!calc) return undefined;

    const updatedCalc = { ...calc, ...updates };
    this.calculationResults.set(id, updatedCalc);
    return updatedCalc;
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    return this.calculationResults.delete(id);
  }

  async getUserProperties(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(prop => prop.userId === userId);
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
    return this.properties.delete(id);
  }

  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    return Array.from(this.loanScenarios.values()).filter(scenario => scenario.propertyId === propertyId);
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    return this.loanScenarios.get(id);
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    const loanScenario: LoanScenario = {
      id: this.scenarioIdCounter++,
      name: insertLoanScenario.name,
      propertyId: insertLoanScenario.propertyId,
      type: insertLoanScenario.type,
      isActive: insertLoanScenario.isActive ?? true,
      lumpSumAmount: insertLoanScenario.lumpSumAmount || null,
      lumpSumDate: insertLoanScenario.lumpSumDate ?? null,
      lumpSumDateType: insertLoanScenario.lumpSumDateType ?? null,
      extraMonthlyAmount: insertLoanScenario.extraMonthlyAmount ?? null,
      extraMonthlyStartDate: insertLoanScenario.extraMonthlyStartDate ?? null,
      extraMonthlyStartType: insertLoanScenario.extraMonthlyStartType ?? null,
      extraMonthlyEndDate: insertLoanScenario.extraMonthlyEndDate ?? null,
      extraMonthlyEndType: insertLoanScenario.extraMonthlyEndType ?? null,
      extraMonthlyDuration: insertLoanScenario.extraMonthlyDuration ?? null,
      monthlyIncreaseAmount: insertLoanScenario.monthlyIncreaseAmount ?? null,
      monthlyIncreaseStartDate: insertLoanScenario.monthlyIncreaseStartDate ?? null,
      monthlyIncreaseStartType: insertLoanScenario.monthlyIncreaseStartType ?? null,
      monthlyIncreaseFrequency: insertLoanScenario.monthlyIncreaseFrequency ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.loanScenarios.set(loanScenario.id, loanScenario);
    return loanScenario;
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    const scenario = this.loanScenarios.get(id);
    if (!scenario) return undefined;

    const updatedScenario = { ...scenario, ...updates, updatedAt: new Date() };
    this.loanScenarios.set(id, updatedScenario);
    return updatedScenario;
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
    // Try to use database storage first
    const { DatabaseStorage } = await import('../server-storage-fixed.js');
    const { testDatabaseConnection } = await import('./db-simple.js');
    
    // Test if database is available with a timeout
    const connectionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    const isConnected = await Promise.race([
      testDatabaseConnection(),
      connectionTimeout
    ]).then(() => true).catch(() => false);
    
    if (isConnected) {
      console.log('✅ Connected to Azure PostgreSQL database');
      storage = new DatabaseStorage();
      return storage;
    }
  } catch (error) {
    console.log('Database storage initialization failed:', error.message);
  }
  
  // Fallback to in-memory storage
  console.log('⚠ Using in-memory storage for development');
  storage = new MemStorage();
  return storage;
}

// Export a promise that resolves to the storage instance
export const getStorage = async (): Promise<IStorage> => {
  return await initializeStorage();
};