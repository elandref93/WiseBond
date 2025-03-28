import { users, type User, type InsertUser, type CalculationResult, type InsertCalculationResult, type ContactSubmission, type InsertContactSubmission } from "@shared/schema";
import bcrypt from 'bcrypt';

// Modify the interface with any CRUD methods needed
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  saveCalculationResult(result: InsertCalculationResult): Promise<CalculationResult>;
  getUserCalculationResults(userId: number): Promise<CalculationResult[]>;
  
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  
  // OTP verification
  storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void>;
  verifyOTP(userId: number, otp: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calculationResults: Map<number, CalculationResult>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private userIdCounter: number;
  private calculationIdCounter: number;
  private contactIdCounter: number;
  private otpStore: Map<number, { otp: string, expiresAt: Date }>;

  constructor() {
    this.users = new Map();
    this.calculationResults = new Map();
    this.contactSubmissions = new Map();
    this.userIdCounter = 1;
    this.calculationIdCounter = 1;
    this.contactIdCounter = 1;
    this.otpStore = new Map();
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
    const user: User = { 
      ...insertUser, 
      password: hashedPassword, 
      id,
      phone: insertUser.phone || null,
      idNumber: null,
      dateOfBirth: null,
      age: null,
      address: null,
      city: null,
      postalCode: null,
      province: null,
      employmentStatus: null,
      employerName: null,
      employmentSector: null,
      jobTitle: null,
      monthlyIncome: null,
      otpVerified: insertUser.otpVerified || false,
      profileComplete: insertUser.profileComplete || false,
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
    
    const updatedUser = {
      ...user,
      ...updates,
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
}

export const storage = new MemStorage();
