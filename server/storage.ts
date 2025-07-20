import { eq, sql } from 'drizzle-orm';
import { users, calculationResults, properties, loanScenarios } from '@shared/schema';
import type { User, InsertUser, CalculationResult, InsertCalculationResult, Property, InsertProperty, LoanScenario, InsertLoanScenario } from '@shared/schema';
import bcrypt from 'bcrypt';
import { getPostgresClient } from './db';

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
  
  // Phone OTP methods
  storePhoneOTP(userId: number, otp: string, expiresAt: Date): Promise<void>;
  verifyPhoneOTP(userId: number, otp: string): Promise<boolean>;

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
 */
export class DatabaseStorage implements IStorage {
  // User management methods
  async createUser(insertUser: InsertUser): Promise<User> {
    if (!insertUser.password) throw new Error('Password is required');

    const db = await getPostgresClient();

    const username = insertUser.username || insertUser.email;
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      password: hashedPassword,
      otpVerified: insertUser.otpVerified || false,
      profileComplete: insertUser.profileComplete || false,
      username: username,
      phone: insertUser.phone,
      title: insertUser.title,
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
      jobTitle: insertUser.jobTitle,
      employmentDuration: insertUser.employmentDuration,
      monthlyIncome: insertUser.monthlyIncome,
      maritalStatus: insertUser.maritalStatus,
      hasCoApplicant: insertUser.hasCoApplicant,
      // Co-applicant fields
      coApplicantTitle: insertUser.coApplicantTitle,
      coApplicantFirstName: insertUser.coApplicantFirstName,
      coApplicantLastName: insertUser.coApplicantLastName,
      coApplicantEmail: insertUser.coApplicantEmail,
      coApplicantPhone: insertUser.coApplicantPhone,
      coApplicantIdNumber: insertUser.coApplicantIdNumber,
      coApplicantDateOfBirth: insertUser.coApplicantDateOfBirth,
      coApplicantAge: insertUser.coApplicantAge,
      coApplicantEmploymentStatus: insertUser.coApplicantEmploymentStatus,
      coApplicantEmployerName: insertUser.coApplicantEmployerName,
      coApplicantEmploymentSector: insertUser.coApplicantEmploymentSector,
      coApplicantJobTitle: insertUser.coApplicantJobTitle,
      coApplicantEmploymentDuration: insertUser.coApplicantEmploymentDuration,
      coApplicantMonthlyIncome: insertUser.coApplicantMonthlyIncome,
      sameAddress: insertUser.sameAddress,
      coApplicantAddress: insertUser.coApplicantAddress,
      coApplicantCity: insertUser.coApplicantCity,
      coApplicantPostalCode: insertUser.coApplicantPostalCode,
      coApplicantProvince: insertUser.coApplicantProvince,
    }).returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const db = await getPostgresClient();

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = await getPostgresClient();

    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async listUsers(): Promise<User[]> {
    const db = await getPostgresClient();

    return await db.select().from(users);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const db = await getPostgresClient();

    const user = await db.select().from(users).where(eq(users.email, email));
    if (!user[0] || !user[0].password) return false;
    return await bcrypt.compare(password, user[0].password);
  }

  // OTP methods (using user table fields)
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    const db = await getPostgresClient();

    await db.update(users).set({
      otpCode: otp,
      otpExpiresAt: expiresAt
    }).where(eq(users.id, userId));
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const db = await getPostgresClient();

    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user[0] || !user[0].otpCode || !user[0].otpExpiresAt) return false;

    const isValid = user[0].otpCode === otp && new Date() < user[0].otpExpiresAt;
    if (isValid) {
      // Clear OTP after successful verification
      await db.update(users).set({
        otpCode: null,
        otpExpiresAt: null,
        otpVerified: true
      }).where(eq(users.id, userId));
    }
    return isValid;
  }

  // Phone OTP methods (using user table fields)
  async storePhoneOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    const db = await getPostgresClient();

    await db.update(users).set({
      phoneOtpCode: otp,
      phoneOtpExpiresAt: expiresAt
    }).where(eq(users.id, userId));
  }

  async verifyPhoneOTP(userId: number, otp: string): Promise<boolean> {
    const db = await getPostgresClient();

    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user[0] || !user[0].phoneOtpCode || !user[0].phoneOtpExpiresAt) return false;

    const isValid = user[0].phoneOtpCode === otp && new Date() < user[0].phoneOtpExpiresAt;
    if (isValid) {
      // Clear OTP after successful verification
      await db.update(users).set({
        phoneOtpCode: null,
        phoneOtpExpiresAt: null
      }).where(eq(users.id, userId));
    }
    return isValid;
  }

  // Password reset methods (using user table fields)
  async storeResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    const db = await getPostgresClient();

    await db.update(users).set({
      resetToken: token,
      resetTokenExpiresAt: expiresAt
    }).where(eq(users.id, userId));
  }

  async verifyResetToken(token: string): Promise<boolean> {
    const db = await getPostgresClient();

    const user = await db.select().from(users).where(eq(users.resetToken, token));
    if (!user[0] || !user[0].resetTokenExpiresAt) return false;
    return new Date() < user[0].resetTokenExpiresAt;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(users).where(eq(users.resetToken, token));
    return result[0];
  }

  async clearResetToken(token: string): Promise<void> {
    const db = await getPostgresClient();

    await db.update(users).set({
      resetToken: null,
      resetTokenExpiresAt: null
    }).where(eq(users.resetToken, token));
  }

  // Calculation methods
  async createCalculationResult(insertCalculationResult: InsertCalculationResult): Promise<CalculationResult> {
    const db = await getPostgresClient();

    const result = await db.insert(calculationResults).values(insertCalculationResult).returning();
    return result[0];
  }

  async getCalculationResult(id: number): Promise<CalculationResult | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(calculationResults).where(eq(calculationResults.id, id));
    return result[0];
  }

  async getUserCalculationResults(userId: number): Promise<CalculationResult[]> {
    const db = await getPostgresClient();

    return await db.select().from(calculationResults).where(eq(calculationResults.userId, userId));
  }

  async updateCalculationResult(id: number, updates: Partial<InsertCalculationResult>): Promise<CalculationResult | undefined> {
    const db = await getPostgresClient();

    const result = await db.update(calculationResults).set(updates).where(eq(calculationResults.id, id)).returning();
    return result[0];
  }

  async deleteCalculationResult(id: number): Promise<boolean> {
    const db = await getPostgresClient();

    const result = await db.delete(calculationResults).where(eq(calculationResults.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Property management methods
  async getUserProperties(userId: number): Promise<Property[]> {
    const db = await getPostgresClient();

    return await db.select().from(properties).where(eq(properties.userId, userId));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(properties).where(eq(properties.id, id));
    return result[0];
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const db = await getPostgresClient();

    const result = await db.insert(properties).values(insertProperty).returning();
    return result[0];
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const db = await getPostgresClient();

    const result = await db.update(properties).set(updates).where(eq(properties.id, id)).returning();
    return result[0];
  }

  async deleteProperty(id: number): Promise<boolean> {
    const db = await getPostgresClient();

    const result = await db.delete(properties).where(eq(properties.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Loan scenario methods
  async getPropertyLoanScenarios(propertyId: number): Promise<LoanScenario[]> {
    const db = await getPostgresClient();

    return await db.select().from(loanScenarios).where(eq(loanScenarios.propertyId, propertyId));
  }

  async getLoanScenario(id: number): Promise<LoanScenario | undefined> {
    const db = await getPostgresClient();

    const result = await db.select().from(loanScenarios).where(eq(loanScenarios.id, id));
    return result[0];
  }

  async createLoanScenario(insertLoanScenario: InsertLoanScenario): Promise<LoanScenario> {
    const db = await getPostgresClient();

    const result = await db.insert(loanScenarios).values(insertLoanScenario).returning();
    return result[0];
  }

  async updateLoanScenario(id: number, updates: Partial<InsertLoanScenario>): Promise<LoanScenario | undefined> {
    const db = await getPostgresClient();

    const result = await db.update(loanScenarios).set(updates).where(eq(loanScenarios.id, id)).returning();
    return result[0];
  }

  async deleteLoanScenario(id: number): Promise<boolean> {
    const db = await getPostgresClient();

    const result = await db.delete(loanScenarios).where(eq(loanScenarios.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Single instance using Azure database only
export const storage = new DatabaseStorage();