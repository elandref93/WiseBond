import { users, type User, type InsertUser, type CalculationResult, type InsertCalculationResult, type ContactSubmission, type InsertContactSubmission } from "@shared/schema";
import bcrypt from 'bcrypt';

// Modify the interface with any CRUD methods needed
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | undefined>;
  
  saveCalculationResult(result: InsertCalculationResult): Promise<CalculationResult>;
  getUserCalculationResults(userId: number): Promise<CalculationResult[]>;
  
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calculationResults: Map<number, CalculationResult>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private userIdCounter: number;
  private calculationIdCounter: number;
  private contactIdCounter: number;

  constructor() {
    this.users = new Map();
    this.calculationResults = new Map();
    this.contactSubmissions = new Map();
    this.userIdCounter = 1;
    this.calculationIdCounter = 1;
    this.contactIdCounter = 1;
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
    const user: User = { 
      ...insertUser, 
      password: hashedPassword, 
      id,
      createdAt: new Date() 
    };
    
    this.users.set(id, user);
    return user;
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : undefined;
  }

  async saveCalculationResult(insertResult: InsertCalculationResult): Promise<CalculationResult> {
    const id = this.calculationIdCounter++;
    const result: CalculationResult = {
      ...insertResult,
      id,
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
      ...insertSubmission,
      id,
      createdAt: new Date()
    };
    
    this.contactSubmissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();
