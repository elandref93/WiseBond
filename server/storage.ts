import { eq, and, desc, sql, gte } from "drizzle-orm";
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
  calculationResults, contactSubmissions,
  // Agent-related imports
  agencies, agents, applications, applicationDocuments, applicationMilestones, applicationComments, notifications,
  type Agency, type InsertAgency, type Agent, type InsertAgent, type Application, type InsertApplication,
  type ApplicationDocument, type InsertApplicationDocument, type ApplicationMilestone,
  type InsertApplicationMilestone, type ApplicationComment, type InsertApplicationComment,
  type Notification, type InsertNotification
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
  
  // Agency management
  getAgencies(): Promise<Agency[]>;
  getAgency(id: number): Promise<Agency | undefined>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  updateAgency(id: number, updates: Partial<Agency>): Promise<Agency | undefined>;
  
  // Agent management
  getAgents(): Promise<Agent[]>;
  getAgentsByAgency(agencyId: number): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByUserId(userId: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;
  
  // Application management
  getApplications(): Promise<Application[]>;
  getApplicationsByAgent(agentId: number): Promise<Application[]>;
  getApplicationsByClient(clientId: number): Promise<Application[]>;
  getApplicationsByStatus(status: string): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined>;
  
  // Application document management
  getApplicationDocuments(applicationId: number): Promise<ApplicationDocument[]>;
  getApplicationDocument(id: number): Promise<ApplicationDocument | undefined>;
  createApplicationDocument(document: InsertApplicationDocument): Promise<ApplicationDocument>;
  updateApplicationDocument(id: number, updates: Partial<ApplicationDocument>): Promise<ApplicationDocument | undefined>;
  
  // Application milestone management
  getApplicationMilestones(applicationId: number): Promise<ApplicationMilestone[]>;
  createApplicationMilestone(milestone: InsertApplicationMilestone): Promise<ApplicationMilestone>;
  updateApplicationMilestone(id: number, updates: Partial<ApplicationMilestone>): Promise<ApplicationMilestone | undefined>;
  
  // Application comment management
  getApplicationComments(applicationId: number): Promise<ApplicationComment[]>;
  createApplicationComment(comment: InsertApplicationComment): Promise<ApplicationComment>;
  
  // Notification management
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUserUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;
  markAllNotificationsRead(userId: number): Promise<boolean>;
}
export class MemStorage implements IStorage {
  // In-memory storage using Maps
  private users: Map<number, User>;
  private calculationResults: Map<number, CalculationResult>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private budgetCategories: Map<number, BudgetCategory>;
  private expenses: Map<number, Expense>;
  
  // Agent-related storage
  private agencies: Map<number, Agency>;
  private agents: Map<number, Agent>;
  private applications: Map<number, Application>;
  private applicationDocuments: Map<number, ApplicationDocument>;
  private applicationMilestones: Map<number, ApplicationMilestone>;
  private applicationComments: Map<number, ApplicationComment>;
  private notifications: Map<number, Notification>;
  
  // Counters for ID generation
  private userIdCounter: number;
  private calculationIdCounter: number;
  private contactIdCounter: number;
  private budgetCategoryIdCounter: number;
  private expenseIdCounter: number;
  private agencyIdCounter: number;
  private agentIdCounter: number;
  private applicationIdCounter: number;
  private docIdCounter: number;
  private milestoneIdCounter: number;
  private commentIdCounter: number;
  private notificationIdCounter: number;
  
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
    
    // Initialize agent-related storage
    this.agencies = new Map();
    this.agents = new Map();
    this.applications = new Map();
    this.applicationDocuments = new Map();
    this.applicationMilestones = new Map();
    this.applicationComments = new Map();
    this.notifications = new Map();
    
    // Initialize counters
    this.userIdCounter = 1;
    this.calculationIdCounter = 1;
    this.contactIdCounter = 1;
    this.budgetCategoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.agencyIdCounter = 1;
    this.agentIdCounter = 1;
    this.applicationIdCounter = 1;
    this.docIdCounter = 1;
    this.milestoneIdCounter = 1;
    this.commentIdCounter = 1;
    this.notificationIdCounter = 1;
    
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
    // Log the login attempt for debugging
    console.log(`Login attempt for username: ${username}`);
    
    // Since we're using email as username now, we'll look up by email instead
    const user = await this.getUserByEmail(username);
    if (!user) {
      console.log(`No user found with email: ${username}`);
      return undefined;
    }
    
    console.log(`User found with ID: ${user.id}, attempting password verification`);
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Password verification failed for user ID: ${user.id}`);
    } else {
      console.log(`Password verification successful for user ID: ${user.id}`);
    }
    
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
  
  // Agency Management Methods
  
  async getAgencies(): Promise<Agency[]> {
    return Array.from(this.agencies.values())
      .filter(agency => agency.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getAgency(id: number): Promise<Agency | undefined> {
    return this.agencies.get(id);
  }
  
  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const id = this.agencyIdCounter++;
    const now = new Date();
    
    const agency: Agency = {
      id,
      name: insertAgency.name,
      logo: insertAgency.logo ?? null,
      address: insertAgency.address ?? null,
      city: insertAgency.city ?? null,
      province: insertAgency.province ?? null,
      postalCode: insertAgency.postalCode ?? null,
      website: insertAgency.website ?? null,
      phoneNumber: insertAgency.phoneNumber ?? null,
      email: insertAgency.email ?? null,
      licenseNumber: insertAgency.licenseNumber ?? null,
      active: insertAgency.active ?? true,
      commissionStructure: insertAgency.commissionStructure ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.agencies.set(id, agency);
    return agency;
  }
  
  async updateAgency(id: number, updates: Partial<Agency>): Promise<Agency | undefined> {
    const agency = this.agencies.get(id);
    if (!agency) return undefined;
    
    const updatedAgency = {
      ...agency,
      ...updates,
      updatedAt: new Date()
    };
    
    this.agencies.set(id, updatedAgency);
    return updatedAgency;
  }
  
  // Agent Management Methods
  
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.active);
  }
  
  async getAgentsByAgency(agencyId: number): Promise<Agent[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.agencyId === agencyId && agent.active);
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async getAgentByUserId(userId: number): Promise<Agent | undefined> {
    return Array.from(this.agents.values())
      .find(agent => agent.userId === userId);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++;
    const now = new Date();
    
    const agent: Agent = {
      id,
      userId: insertAgent.userId,
      agencyId: insertAgent.agencyId ?? null,
      licenseNumber: insertAgent.licenseNumber,
      profilePicture: insertAgent.profilePicture ?? null,
      biography: insertAgent.biography ?? null,
      specializations: insertAgent.specializations ?? null,
      regions: insertAgent.regions ?? null,
      commissionTier: insertAgent.commissionTier ?? 'standard',
      commissionRate: insertAgent.commissionRate ?? 0,
      active: insertAgent.active ?? true,
      approved: insertAgent.approved ?? false,
      applicationDate: insertAgent.applicationDate ?? now,
      approvalDate: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.agents.set(id, agent);
    return agent;
  }
  
  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date()
    };
    
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }
  
  // Application Management Methods
  
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values())
      .sort((a, b) => {
        // Sort by application date descending (newest first)
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      });
  }
  
  async getApplicationsByAgent(agentId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.agentId === agentId)
      .sort((a, b) => {
        // Sort by application date descending (newest first)
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      });
  }
  
  async getApplicationsByClient(clientId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.clientId === clientId)
      .sort((a, b) => {
        // Sort by application date descending (newest first)
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      });
  }
  
  async getApplicationsByStatus(status: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.status === status)
      .sort((a, b) => {
        // Sort by application date descending (newest first)
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      });
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const now = new Date();
    
    const application: Application = {
      id,
      clientId: insertApplication.clientId,
      agentId: insertApplication.agentId ?? null,
      status: insertApplication.status ?? 'new_lead',
      lender: insertApplication.lender ?? null,
      propertyValue: insertApplication.propertyValue ?? null,
      loanAmount: insertApplication.loanAmount ?? null,
      term: insertApplication.term ?? null,
      interestRate: insertApplication.interestRate ?? null,
      applicationDate: insertApplication.applicationDate ?? now,
      submissionDate: null,
      decisionDate: null,
      fundingDate: null,
      notes: insertApplication.notes ?? null,
      urgency: insertApplication.urgency ?? 'normal',
      commissionEarned: insertApplication.commissionEarned ?? null,
      commissionPaidDate: null,
      propertyAddress: insertApplication.propertyAddress ?? null,
      propertyType: insertApplication.propertyType ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = {
      ...application,
      ...updates,
      updatedAt: new Date()
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Application Document Methods
  
  async getApplicationDocuments(applicationId: number): Promise<ApplicationDocument[]> {
    return Array.from(this.applicationDocuments.values())
      .filter(doc => doc.applicationId === applicationId)
      .sort((a, b) => {
        // Sort by upload date descending (newest first)
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      });
  }
  
  async getApplicationDocument(id: number): Promise<ApplicationDocument | undefined> {
    return this.applicationDocuments.get(id);
  }
  
  async createApplicationDocument(insertDocument: InsertApplicationDocument): Promise<ApplicationDocument> {
    const id = this.docIdCounter++;
    const now = new Date();
    
    const document: ApplicationDocument = {
      id,
      applicationId: insertDocument.applicationId,
      userId: insertDocument.userId,
      documentType: insertDocument.documentType,
      fileName: insertDocument.fileName,
      filePath: insertDocument.filePath,
      fileSize: insertDocument.fileSize,
      mimeType: insertDocument.mimeType,
      status: insertDocument.status ?? 'pending',
      uploadDate: insertDocument.uploadDate ?? now,
      reviewDate: null,
      reviewedBy: null,
      notes: insertDocument.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.applicationDocuments.set(id, document);
    return document;
  }
  
  async updateApplicationDocument(id: number, updates: Partial<ApplicationDocument>): Promise<ApplicationDocument | undefined> {
    const document = this.applicationDocuments.get(id);
    if (!document) return undefined;
    
    const updatedDocument = {
      ...document,
      ...updates,
      updatedAt: new Date()
    };
    
    this.applicationDocuments.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Application Milestone Methods
  
  async getApplicationMilestones(applicationId: number): Promise<ApplicationMilestone[]> {
    return Array.from(this.applicationMilestones.values())
      .filter(milestone => milestone.applicationId === applicationId);
  }
  
  async createApplicationMilestone(insertMilestone: InsertApplicationMilestone): Promise<ApplicationMilestone> {
    const id = this.milestoneIdCounter++;
    const now = new Date();
    
    const milestone: ApplicationMilestone = {
      id,
      applicationId: insertMilestone.applicationId,
      milestoneName: insertMilestone.milestoneName,
      completed: insertMilestone.completed ?? false,
      expectedDate: insertMilestone.expectedDate ?? null,
      completedDate: null,
      notes: insertMilestone.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.applicationMilestones.set(id, milestone);
    return milestone;
  }
  
  async updateApplicationMilestone(id: number, updates: Partial<ApplicationMilestone>): Promise<ApplicationMilestone | undefined> {
    const milestone = this.applicationMilestones.get(id);
    if (!milestone) return undefined;
    
    // If updating to completed, add a completedDate if not already set
    if (updates.completed === true && !updates.completedDate) {
      updates.completedDate = new Date();
    }
    
    const updatedMilestone = {
      ...milestone,
      ...updates,
      updatedAt: new Date()
    };
    
    this.applicationMilestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  // Application Comment Methods
  
  async getApplicationComments(applicationId: number): Promise<ApplicationComment[]> {
    return Array.from(this.applicationComments.values())
      .filter(comment => comment.applicationId === applicationId)
      .sort((a, b) => {
        // Sort by creation date ascending (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }
  
  async createApplicationComment(insertComment: InsertApplicationComment): Promise<ApplicationComment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    
    const comment: ApplicationComment = {
      id,
      applicationId: insertComment.applicationId,
      userId: insertComment.userId,
      comment: insertComment.comment,
      mentions: insertComment.mentions ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.applicationComments.set(id, comment);
    return comment;
  }
  
  // Notification Methods
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => {
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      title: insertNotification.title,
      message: insertNotification.message,
      relatedId: insertNotification.relatedId ?? null,
      relatedType: insertNotification.relatedType ?? null,
      read: false,
      createdAt: now
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification = {
      ...notification,
      read: true
    };
    
    this.notifications.set(id, updatedNotification);
    return true;
  }
  
  async markAllNotificationsRead(userId: number): Promise<boolean> {
    let success = true;
    
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .forEach(notification => {
        const updated = {
          ...notification,
          read: true
        };
        
        success = success && this.notifications.set(notification.id, updated) !== undefined;
      });
    
    return success;
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
      // First try with just the basic user fields
      const userResult = await db.execute(sql`
        SELECT id, username, password, first_name as "firstName", last_name as "lastName", 
        email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
        address, city, postal_code as "postalCode", province, 
        employment_status as "employmentStatus", employer_name as "employerName", 
        employment_sector as "employmentSector", job_title as "jobTitle", 
        employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
        otp_verified as "otpVerified", profile_complete as "profileComplete", 
        created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE id = ${id}
        LIMIT 1
      `);
      
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];
        
        // Check if co-applicant columns exist by attempting a separate query
        try {
          const coApplicantResult = await db.execute(sql`
            SELECT 
              marital_status, has_co_applicant, 
              co_applicant_first_name, co_applicant_last_name, co_applicant_email, 
              co_applicant_phone, co_applicant_id_number, co_applicant_date_of_birth, 
              co_applicant_age, co_applicant_employment_status, co_applicant_employer_name, 
              co_applicant_employment_sector, co_applicant_job_title, co_applicant_employment_duration, 
              co_applicant_monthly_income, same_address, co_applicant_address, co_applicant_city, 
              co_applicant_postal_code, co_applicant_province
            FROM users 
            WHERE id = ${id}
            LIMIT 1
          `);
          
          if (coApplicantResult.rows.length > 0) {
            const coApplicantData = coApplicantResult.rows[0];
            
            // Map co-applicant database columns to JavaScript properties
            return {
              ...userData,
              maritalStatus: coApplicantData.marital_status,
              hasCoApplicant: coApplicantData.has_co_applicant,
              coApplicantFirstName: coApplicantData.co_applicant_first_name,
              coApplicantLastName: coApplicantData.co_applicant_last_name,
              coApplicantEmail: coApplicantData.co_applicant_email,
              coApplicantPhone: coApplicantData.co_applicant_phone,
              coApplicantIdNumber: coApplicantData.co_applicant_id_number,
              coApplicantDateOfBirth: coApplicantData.co_applicant_date_of_birth,
              coApplicantAge: coApplicantData.co_applicant_age,
              coApplicantEmploymentStatus: coApplicantData.co_applicant_employment_status,
              coApplicantEmployerName: coApplicantData.co_applicant_employer_name,
              coApplicantEmploymentSector: coApplicantData.co_applicant_employment_sector,
              coApplicantJobTitle: coApplicantData.co_applicant_job_title,
              coApplicantEmploymentDuration: coApplicantData.co_applicant_employment_duration,
              coApplicantMonthlyIncome: coApplicantData.co_applicant_monthly_income,
              sameAddress: coApplicantData.same_address,
              coApplicantAddress: coApplicantData.co_applicant_address,
              coApplicantCity: coApplicantData.co_applicant_city,
              coApplicantPostalCode: coApplicantData.co_applicant_postal_code,
              coApplicantProvince: coApplicantData.co_applicant_province,
            };
          }
        } catch (coApplicantError) {
          // Co-applicant columns don't exist yet, so just return user with default values
          console.log("Co-applicant columns don't exist yet, using default values");
        }
        
        // If we get here, either co-applicant columns don't exist or no data was found
        // Return user with default values for co-applicant fields
        return {
          ...userData,
          maritalStatus: null,
          hasCoApplicant: false,
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
        };
      }
      return undefined;
    } catch (error) {
      console.error("Database error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // First try with just the basic user fields
      const userResult = await db.execute(sql`
        SELECT id, username, password, first_name as "firstName", last_name as "lastName", 
        email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
        address, city, postal_code as "postalCode", province, 
        employment_status as "employmentStatus", employer_name as "employerName", 
        employment_sector as "employmentSector", job_title as "jobTitle", 
        employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
        otp_verified as "otpVerified", profile_complete as "profileComplete", 
        created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE username = ${username}
        LIMIT 1
      `);
      
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];
        
        // Check if co-applicant columns exist by attempting a separate query
        try {
          const coApplicantResult = await db.execute(sql`
            SELECT 
              marital_status, has_co_applicant, 
              co_applicant_first_name, co_applicant_last_name, co_applicant_email, 
              co_applicant_phone, co_applicant_id_number, co_applicant_date_of_birth, 
              co_applicant_age, co_applicant_employment_status, co_applicant_employer_name, 
              co_applicant_employment_sector, co_applicant_job_title, co_applicant_employment_duration, 
              co_applicant_monthly_income, same_address, co_applicant_address, co_applicant_city, 
              co_applicant_postal_code, co_applicant_province
            FROM users 
            WHERE id = ${userData.id}
            LIMIT 1
          `);
          
          if (coApplicantResult.rows.length > 0) {
            const coApplicantData = coApplicantResult.rows[0];
            
            // Map co-applicant database columns to JavaScript properties
            return {
              ...userData,
              maritalStatus: coApplicantData.marital_status,
              hasCoApplicant: coApplicantData.has_co_applicant,
              coApplicantFirstName: coApplicantData.co_applicant_first_name,
              coApplicantLastName: coApplicantData.co_applicant_last_name,
              coApplicantEmail: coApplicantData.co_applicant_email,
              coApplicantPhone: coApplicantData.co_applicant_phone,
              coApplicantIdNumber: coApplicantData.co_applicant_id_number,
              coApplicantDateOfBirth: coApplicantData.co_applicant_date_of_birth,
              coApplicantAge: coApplicantData.co_applicant_age,
              coApplicantEmploymentStatus: coApplicantData.co_applicant_employment_status,
              coApplicantEmployerName: coApplicantData.co_applicant_employer_name,
              coApplicantEmploymentSector: coApplicantData.co_applicant_employment_sector,
              coApplicantJobTitle: coApplicantData.co_applicant_job_title,
              coApplicantEmploymentDuration: coApplicantData.co_applicant_employment_duration,
              coApplicantMonthlyIncome: coApplicantData.co_applicant_monthly_income,
              sameAddress: coApplicantData.same_address,
              coApplicantAddress: coApplicantData.co_applicant_address,
              coApplicantCity: coApplicantData.co_applicant_city,
              coApplicantPostalCode: coApplicantData.co_applicant_postal_code,
              coApplicantProvince: coApplicantData.co_applicant_province,
            };
          }
        } catch (coApplicantError) {
          // Co-applicant columns don't exist yet, so just return user with default values
          console.log("Co-applicant columns don't exist yet, using default values");
        }
        
        // If we get here, either co-applicant columns don't exist or no data was found
        // Return user with default values for co-applicant fields
        return {
          ...userData,
          maritalStatus: null,
          hasCoApplicant: false,
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
        };
      }
      return undefined;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // First try with just the basic user fields
      const userResult = await db.execute(sql`
        SELECT id, username, password, first_name as "firstName", last_name as "lastName", 
        email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
        address, city, postal_code as "postalCode", province, 
        employment_status as "employmentStatus", employer_name as "employerName", 
        employment_sector as "employmentSector", job_title as "jobTitle", 
        employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
        otp_verified as "otpVerified", profile_complete as "profileComplete", 
        created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE email = ${email}
        LIMIT 1
      `);
      
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];
        
        // Check if co-applicant columns exist by attempting a separate query
        try {
          const coApplicantResult = await db.execute(sql`
            SELECT 
              marital_status, has_co_applicant, 
              co_applicant_first_name, co_applicant_last_name, co_applicant_email, 
              co_applicant_phone, co_applicant_id_number, co_applicant_date_of_birth, 
              co_applicant_age, co_applicant_employment_status, co_applicant_employer_name, 
              co_applicant_employment_sector, co_applicant_job_title, co_applicant_employment_duration, 
              co_applicant_monthly_income, same_address, co_applicant_address, co_applicant_city, 
              co_applicant_postal_code, co_applicant_province
            FROM users 
            WHERE id = ${userData.id}
            LIMIT 1
          `);
          
          if (coApplicantResult.rows.length > 0) {
            const coApplicantData = coApplicantResult.rows[0];
            
            // Map co-applicant database columns to JavaScript properties
            return {
              ...userData,
              maritalStatus: coApplicantData.marital_status,
              hasCoApplicant: coApplicantData.has_co_applicant,
              coApplicantFirstName: coApplicantData.co_applicant_first_name,
              coApplicantLastName: coApplicantData.co_applicant_last_name,
              coApplicantEmail: coApplicantData.co_applicant_email,
              coApplicantPhone: coApplicantData.co_applicant_phone,
              coApplicantIdNumber: coApplicantData.co_applicant_id_number,
              coApplicantDateOfBirth: coApplicantData.co_applicant_date_of_birth,
              coApplicantAge: coApplicantData.co_applicant_age,
              coApplicantEmploymentStatus: coApplicantData.co_applicant_employment_status,
              coApplicantEmployerName: coApplicantData.co_applicant_employer_name,
              coApplicantEmploymentSector: coApplicantData.co_applicant_employment_sector,
              coApplicantJobTitle: coApplicantData.co_applicant_job_title,
              coApplicantEmploymentDuration: coApplicantData.co_applicant_employment_duration,
              coApplicantMonthlyIncome: coApplicantData.co_applicant_monthly_income,
              sameAddress: coApplicantData.same_address,
              coApplicantAddress: coApplicantData.co_applicant_address,
              coApplicantCity: coApplicantData.co_applicant_city,
              coApplicantPostalCode: coApplicantData.co_applicant_postal_code,
              coApplicantProvince: coApplicantData.co_applicant_province,
            };
          }
        } catch (coApplicantError) {
          // Co-applicant columns don't exist yet, so just return user with default values
          console.log("Co-applicant columns don't exist yet, using default values");
        }
        
        // If we get here, either co-applicant columns don't exist or no data was found
        // Return user with default values for co-applicant fields
        return {
          ...userData,
          maritalStatus: null,
          hasCoApplicant: false,
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
        };
      }
      return undefined;
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
      
      // Use raw SQL to create user with only fields we know exist
      const userResult = await db.execute(sql`
        INSERT INTO users (
          username, password, first_name, last_name, email, phone, 
          id_number, date_of_birth, age, address, city, postal_code, 
          province, employment_status, employer_name, employment_sector, 
          job_title, employment_duration, monthly_income, 
          otp_verified, profile_complete, created_at, updated_at
        ) VALUES (
          ${insertUser.username}, 
          ${hashedPassword}, 
          ${insertUser.firstName}, 
          ${insertUser.lastName},
          ${insertUser.email}, 
          ${insertUser.phone ? insertUser.phone : ''}, 
          ${insertUser.idNumber ? insertUser.idNumber : ''}, 
          ${insertUser.dateOfBirth ? insertUser.dateOfBirth : ''}, 
          ${insertUser.age ? insertUser.age : 0}, 
          ${insertUser.address ? insertUser.address : ''}, 
          ${insertUser.city ? insertUser.city : ''}, 
          ${insertUser.postalCode ? insertUser.postalCode : ''}, 
          ${insertUser.province ? insertUser.province : ''}, 
          ${insertUser.employmentStatus ? insertUser.employmentStatus : ''}, 
          ${insertUser.employerName ? insertUser.employerName : ''}, 
          ${insertUser.employmentSector ? insertUser.employmentSector : ''}, 
          ${insertUser.jobTitle ? insertUser.jobTitle : ''}, 
          ${insertUser.employmentDuration ? insertUser.employmentDuration : ''}, 
          ${insertUser.monthlyIncome ? insertUser.monthlyIncome : 0}, 
          ${insertUser.otpVerified}, 
          ${insertUser.profileComplete}, 
          NOW(), 
          NOW()
        ) RETURNING 
          id, username, password, first_name as "firstName", last_name as "lastName", 
          email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
          address, city, postal_code as "postalCode", province, 
          employment_status as "employmentStatus", employer_name as "employerName", 
          employment_sector as "employmentSector", job_title as "jobTitle", 
          employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
          otp_verified as "otpVerified", profile_complete as "profileComplete", 
          created_at as "createdAt", updated_at as "updatedAt"
      `);
      
      if (userResult.rows.length === 0) {
        throw new Error("User insertion did not return a result");
      }
      
      const userData = userResult.rows[0];
      
      // Convert to User type with null values for co-applicant fields
      const user = {
        ...userData,
        // Add null values for co-applicant fields
        maritalStatus: null,
        hasCoApplicant: false,
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
      };
      
      return user;
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw new Error(`Failed to create user:  ${insertUser.username}`);
    }
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    try {
      console.log(`Attempting to verify user with login: ${username}`);
      
      let user = await this.getUserByEmail(username);
      
      // If user not found by email, try looking up by username
      if (!user) {
        console.log(`No user found with email: ${username}, trying username lookup`);
        user = await this.getUserByUsername(username);
      }
      
      // If still no user found, authentication fails
      if (!user) {
        console.log(`No user found with either email or username: ${username}`);
        return undefined;
      }
      
      console.log(`User found with ID: ${user.id}, attempting password verification`);
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        console.log(`Password verification failed for user ID: ${user.id}`);
      } else {
        console.log(`Password verification successful for user ID: ${user.id}`);
      }
      
      return isMatch ? user : undefined;
    } catch (error) {
      console.error("Database error in verifyUser:", error);
      return undefined;
    }
  }

  async saveCalculationResult(insertResult: InsertCalculationResult): Promise<CalculationResult> {
    try {
      // Check for duplicate calculations to prevent saving identical ones
      if (insertResult.userId) {
        // Get recent calculations for this user and type (last 24 hours)
        const recentCalculations = await db.select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.userId, insertResult.userId),
              eq(calculationResults.calculationType, insertResult.calculationType),
              // Use a date comparison for the last 24 hours
              gte(calculationResults.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
            )
          );
        
        // Check if we already have an identical calculation
        const isDuplicate = recentCalculations.some(calc => 
          calc.inputData === insertResult.inputData && 
          calc.resultData === insertResult.resultData
        );
        
        if (isDuplicate) {
          console.log('Skipping duplicate calculation save - found existing identical calculation');
          return recentCalculations[0]; // Return the existing calculation
        }
      }
      
      // If no duplicate found, insert new calculation
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
      console.log(`Updating user ID ${id} with fields:`, Object.keys(updates).join(', '));
      
      // Create a single update query that only includes the fields in the database
      const updateFields: Record<string, any> = {};
      
      // Base user fields
      if (updates.username !== undefined) updateFields.username = updates.username;
      if (updates.password !== undefined) updateFields.password = updates.password;
      if (updates.firstName !== undefined) updateFields.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateFields.last_name = updates.lastName;
      if (updates.email !== undefined) updateFields.email = updates.email;
      if (updates.phone !== undefined) updateFields.phone = updates.phone;
      if (updates.idNumber !== undefined) updateFields.id_number = updates.idNumber;
      if (updates.dateOfBirth !== undefined) updateFields.date_of_birth = updates.dateOfBirth;
      if (updates.age !== undefined) updateFields.age = updates.age;
      if (updates.address !== undefined) updateFields.address = updates.address;
      if (updates.city !== undefined) updateFields.city = updates.city;
      if (updates.postalCode !== undefined) updateFields.postal_code = updates.postalCode;
      if (updates.province !== undefined) updateFields.province = updates.province;
      if (updates.employmentStatus !== undefined) updateFields.employment_status = updates.employmentStatus;
      if (updates.employerName !== undefined) updateFields.employer_name = updates.employerName;
      if (updates.employmentSector !== undefined) updateFields.employment_sector = updates.employmentSector;
      if (updates.jobTitle !== undefined) updateFields.job_title = updates.jobTitle;
      if (updates.employmentDuration !== undefined) updateFields.employment_duration = updates.employmentDuration;
      if (updates.monthlyIncome !== undefined) {
        updateFields.monthly_income = updates.monthlyIncome === 0 ? null : updates.monthlyIncome;
      }
      if (updates.otpVerified !== undefined) updateFields.otp_verified = updates.otpVerified;
      if (updates.profileComplete !== undefined) updateFields.profile_complete = updates.profileComplete;
      updateFields.updated_at = new Date();
      
      // Check if we need co-applicant columns
      let needsCoApplicantColumns = false;
      
      if (updates.maritalStatus !== undefined ||
          updates.hasCoApplicant !== undefined ||
          updates.coApplicantFirstName !== undefined ||
          updates.coApplicantLastName !== undefined ||
          updates.coApplicantEmail !== undefined ||
          updates.coApplicantPhone !== undefined ||
          updates.coApplicantIdNumber !== undefined ||
          updates.coApplicantDateOfBirth !== undefined ||
          updates.coApplicantAge !== undefined ||
          updates.coApplicantEmploymentStatus !== undefined ||
          updates.coApplicantEmployerName !== undefined ||
          updates.coApplicantEmploymentSector !== undefined ||
          updates.coApplicantJobTitle !== undefined ||
          updates.coApplicantEmploymentDuration !== undefined ||
          updates.coApplicantMonthlyIncome !== undefined ||
          updates.sameAddress !== undefined ||
          updates.coApplicantAddress !== undefined ||
          updates.coApplicantCity !== undefined ||
          updates.coApplicantPostalCode !== undefined ||
          updates.coApplicantProvince !== undefined) {
        needsCoApplicantColumns = true;
      }
      
      // Add co-applicant columns if needed
      if (needsCoApplicantColumns) {
        try {
          // Check if co-applicant columns exist
          await db.execute(sql`SELECT marital_status FROM users LIMIT 1`);
          console.log("Co-applicant columns already exist");
        } catch (e) {
          console.log("Co-applicant columns don't exist, adding them");
          
          try {
            // Add co-applicant columns to users table
            await db.execute(sql`
              ALTER TABLE users
              ADD COLUMN IF NOT EXISTS marital_status TEXT,
              ADD COLUMN IF NOT EXISTS has_co_applicant BOOLEAN DEFAULT FALSE,
              ADD COLUMN IF NOT EXISTS co_applicant_first_name TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_last_name TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_email TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_phone TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_id_number TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_date_of_birth TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_age INTEGER,
              ADD COLUMN IF NOT EXISTS co_applicant_employment_status TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_employer_name TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_employment_sector TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_job_title TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_employment_duration TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_monthly_income INTEGER,
              ADD COLUMN IF NOT EXISTS same_address BOOLEAN DEFAULT TRUE,
              ADD COLUMN IF NOT EXISTS co_applicant_address TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_city TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_postal_code TEXT,
              ADD COLUMN IF NOT EXISTS co_applicant_province TEXT
            `);
            console.log("Co-applicant columns added to users table");
            
            // Now add co-applicant fields to the update
            if (updates.maritalStatus !== undefined) updateFields.marital_status = updates.maritalStatus;
            if (updates.hasCoApplicant !== undefined) updateFields.has_co_applicant = updates.hasCoApplicant;
            if (updates.coApplicantFirstName !== undefined) updateFields.co_applicant_first_name = updates.coApplicantFirstName;
            if (updates.coApplicantLastName !== undefined) updateFields.co_applicant_last_name = updates.coApplicantLastName;
            if (updates.coApplicantEmail !== undefined) updateFields.co_applicant_email = updates.coApplicantEmail;
            if (updates.coApplicantPhone !== undefined) updateFields.co_applicant_phone = updates.coApplicantPhone;
            if (updates.coApplicantIdNumber !== undefined) updateFields.co_applicant_id_number = updates.coApplicantIdNumber;
            if (updates.coApplicantDateOfBirth !== undefined) updateFields.co_applicant_date_of_birth = updates.coApplicantDateOfBirth;
            if (updates.coApplicantAge !== undefined) updateFields.co_applicant_age = updates.coApplicantAge;
            if (updates.coApplicantEmploymentStatus !== undefined) updateFields.co_applicant_employment_status = updates.coApplicantEmploymentStatus;
            if (updates.coApplicantEmployerName !== undefined) updateFields.co_applicant_employer_name = updates.coApplicantEmployerName;
            if (updates.coApplicantEmploymentSector !== undefined) updateFields.co_applicant_employment_sector = updates.coApplicantEmploymentSector;
            if (updates.coApplicantJobTitle !== undefined) updateFields.co_applicant_job_title = updates.coApplicantJobTitle;
            if (updates.coApplicantEmploymentDuration !== undefined) updateFields.co_applicant_employment_duration = updates.coApplicantEmploymentDuration;
            if (updates.coApplicantMonthlyIncome !== undefined) {
              updateFields.co_applicant_monthly_income = updates.coApplicantMonthlyIncome === 0 ? null : updates.coApplicantMonthlyIncome;
            }
            if (updates.sameAddress !== undefined) updateFields.same_address = updates.sameAddress;
            if (updates.coApplicantAddress !== undefined) updateFields.co_applicant_address = updates.coApplicantAddress;
            if (updates.coApplicantCity !== undefined) updateFields.co_applicant_city = updates.coApplicantCity;
            if (updates.coApplicantPostalCode !== undefined) updateFields.co_applicant_postal_code = updates.coApplicantPostalCode;
            if (updates.coApplicantProvince !== undefined) updateFields.co_applicant_province = updates.coApplicantProvince;
          } catch (alterError) {
            console.error("Error adding co-applicant columns:", alterError);
            // Continue with just the basic fields
          }
        }
      }
      
      // Now execute the update query with all fields
      if (Object.keys(updateFields).length === 0) {
        console.log("No fields to update for user:", id);
        return await this.getUser(id);
      }
      
      try {
        // Build the update query
        const fieldEntries = Object.entries(updateFields);
        const setClause = fieldEntries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
        const values = fieldEntries.map(([_, value]) => value);
        values.push(id);  // Add ID for the WHERE clause
        
        const query = `
          UPDATE users 
          SET ${setClause} 
          WHERE id = $${values.length}
          RETURNING 
            id, username, first_name as "firstName", last_name as "lastName", 
            email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
            address, city, postal_code as "postalCode", province, 
            employment_status as "employmentStatus", employer_name as "employerName", 
            employment_sector as "employmentSector", job_title as "jobTitle", 
            employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
            otp_verified as "otpVerified", profile_complete as "profileComplete", 
            created_at as "createdAt", updated_at as "updatedAt"
        `;
        
        console.log(`Executing update query for user ${id}`);
        
        // Execute query
        const userResult = await pool.query(query, values);
        
        if (userResult.rows.length === 0) {
          console.log("User not found:", id);
          return undefined;
        }
        
        const userData = userResult.rows[0];
        
        // Add co-applicant fields to the response with default values if needed
        const user = {
          ...userData,
          maritalStatus: updates.maritalStatus || userData.maritalStatus || null,
          hasCoApplicant: updates.hasCoApplicant !== undefined ? updates.hasCoApplicant : (userData.hasCoApplicant || false),
          coApplicantFirstName: updates.coApplicantFirstName || userData.coApplicantFirstName || null,
          coApplicantLastName: updates.coApplicantLastName || userData.coApplicantLastName || null,
          coApplicantEmail: updates.coApplicantEmail || userData.coApplicantEmail || null,
          coApplicantPhone: updates.coApplicantPhone || userData.coApplicantPhone || null,
          coApplicantIdNumber: updates.coApplicantIdNumber || userData.coApplicantIdNumber || null,
          coApplicantDateOfBirth: updates.coApplicantDateOfBirth || userData.coApplicantDateOfBirth || null,
          coApplicantAge: updates.coApplicantAge || userData.coApplicantAge || null,
          coApplicantEmploymentStatus: updates.coApplicantEmploymentStatus || userData.coApplicantEmploymentStatus || null,
          coApplicantEmployerName: updates.coApplicantEmployerName || userData.coApplicantEmployerName || null,
          coApplicantEmploymentSector: updates.coApplicantEmploymentSector || userData.coApplicantEmploymentSector || null,
          coApplicantJobTitle: updates.coApplicantJobTitle || userData.coApplicantJobTitle || null,
          coApplicantEmploymentDuration: updates.coApplicantEmploymentDuration || userData.coApplicantEmploymentDuration || null,
          coApplicantMonthlyIncome: updates.coApplicantMonthlyIncome || userData.coApplicantMonthlyIncome || null,
          sameAddress: updates.sameAddress !== undefined ? updates.sameAddress : (userData.sameAddress !== undefined ? userData.sameAddress : true),
          coApplicantAddress: updates.coApplicantAddress || userData.coApplicantAddress || null,
          coApplicantCity: updates.coApplicantCity || userData.coApplicantCity || null,
          coApplicantPostalCode: updates.coApplicantPostalCode || userData.coApplicantPostalCode || null,
          coApplicantProvince: updates.coApplicantProvince || userData.coApplicantProvince || null
        };
        
        return user;
      } catch (error) {
        console.error("Error in update query:", error);
        
        // Fallback to a simpler update without RETURNING clause
        try {
          // Build a simpler update query
          const fieldEntries = Object.entries(updateFields);
          const setClause = fieldEntries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
          const values = fieldEntries.map(([_, value]) => value);
          values.push(id);  // Add ID for the WHERE clause
          
          const query = `
            UPDATE users 
            SET ${setClause} 
            WHERE id = $${values.length}
          `;
          
          console.log(`Executing fallback update query for user ${id}`);
          
          // Execute update without trying to return data
          await pool.query(query, values);
          
          // Now do a separate query to get the user
          const userQuery = `
            SELECT 
              id, username, first_name as "firstName", last_name as "lastName", 
              email, phone, id_number as "idNumber", date_of_birth as "dateOfBirth", age, 
              address, city, postal_code as "postalCode", province, 
              employment_status as "employmentStatus", employer_name as "employerName", 
              employment_sector as "employmentSector", job_title as "jobTitle", 
              employment_duration as "employmentDuration", monthly_income as "monthlyIncome", 
              otp_verified as "otpVerified", profile_complete as "profileComplete", 
              created_at as "createdAt", updated_at as "updatedAt"
            FROM users 
            WHERE id = $1
          `;
          
          const userResult = await pool.query(userQuery, [id]);
          
          if (userResult.rows.length === 0) {
            console.log("User not found in fallback query:", id);
            return undefined;
          }
          
          const userData = userResult.rows[0];
          
          // Add co-applicant fields to the response with default values
          const user = {
            ...userData,
            maritalStatus: updates.maritalStatus || null,
            hasCoApplicant: updates.hasCoApplicant || false,
            coApplicantFirstName: updates.coApplicantFirstName || null,
            coApplicantLastName: updates.coApplicantLastName || null,
            coApplicantEmail: updates.coApplicantEmail || null,
            coApplicantPhone: updates.coApplicantPhone || null,
            coApplicantIdNumber: updates.coApplicantIdNumber || null,
            coApplicantDateOfBirth: updates.coApplicantDateOfBirth || null,
            coApplicantAge: updates.coApplicantAge || null,
            coApplicantEmploymentStatus: updates.coApplicantEmploymentStatus || null,
            coApplicantEmployerName: updates.coApplicantEmployerName || null,
            coApplicantEmploymentSector: updates.coApplicantEmploymentSector || null,
            coApplicantJobTitle: updates.coApplicantJobTitle || null,
            coApplicantEmploymentDuration: updates.coApplicantEmploymentDuration || null,
            coApplicantMonthlyIncome: updates.coApplicantMonthlyIncome || null,
            sameAddress: updates.sameAddress !== undefined ? updates.sameAddress : true,
            coApplicantAddress: updates.coApplicantAddress || null,
            coApplicantCity: updates.coApplicantCity || null,
            coApplicantPostalCode: updates.coApplicantPostalCode || null,
            coApplicantProvince: updates.coApplicantProvince || null
          };
          
          return user;
        } catch (fallbackError) {
          console.error("Error in fallback update:", fallbackError);
          return undefined;
        }
      }
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

  // Agency management
  async getAgencies(): Promise<Agency[]> {
    try {
      const result = await db.select().from(agencies).orderBy(agencies.name);
      return result;
    } catch (error) {
      console.error("Database error in getAgencies:", error);
      return [];
    }
  }

  async getAgency(id: number): Promise<Agency | undefined> {
    try {
      const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
      return agency;
    } catch (error) {
      console.error("Database error in getAgency:", error);
      return undefined;
    }
  }

  async createAgency(agency: InsertAgency): Promise<Agency> {
    try {
      const [result] = await db.insert(agencies).values({
        ...agency,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createAgency:", error);
      throw new Error("Failed to create agency");
    }
  }

  async updateAgency(id: number, updates: Partial<Agency>): Promise<Agency | undefined> {
    try {
      const [updatedAgency] = await db.update(agencies)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(agencies.id, id))
        .returning();
      return updatedAgency;
    } catch (error) {
      console.error("Database error in updateAgency:", error);
      return undefined;
    }
  }

  // Agent management
  async getAgents(): Promise<Agent[]> {
    try {
      const result = await db.select().from(agents);
      return result;
    } catch (error) {
      console.error("Database error in getAgents:", error);
      return [];
    }
  }

  async getAgentsByAgency(agencyId: number): Promise<Agent[]> {
    try {
      const result = await db.select()
        .from(agents)
        .where(eq(agents.agencyId, agencyId));
      return result;
    } catch (error) {
      console.error("Database error in getAgentsByAgency:", error);
      return [];
    }
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    try {
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      return agent;
    } catch (error) {
      console.error("Database error in getAgent:", error);
      return undefined;
    }
  }

  async getAgentByUserId(userId: number): Promise<Agent | undefined> {
    try {
      const [agent] = await db.select().from(agents).where(eq(agents.userId, userId));
      return agent;
    } catch (error) {
      console.error("Database error in getAgentByUserId:", error);
      return undefined;
    }
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    try {
      const [result] = await db.insert(agents).values({
        ...agent,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createAgent:", error);
      throw new Error("Failed to create agent");
    }
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const [updatedAgent] = await db.update(agents)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(agents.id, id))
        .returning();
      return updatedAgent;
    } catch (error) {
      console.error("Database error in updateAgent:", error);
      return undefined;
    }
  }

  // Application management
  async getApplications(): Promise<Application[]> {
    try {
      const result = await db.select().from(applications).orderBy(desc(applications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplications:", error);
      return [];
    }
  }

  async getApplicationsByAgent(agentId: number): Promise<Application[]> {
    try {
      const result = await db.select()
        .from(applications)
        .where(eq(applications.agentId, agentId))
        .orderBy(desc(applications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplicationsByAgent:", error);
      return [];
    }
  }

  async getApplicationsByClient(clientId: number): Promise<Application[]> {
    try {
      const result = await db.select()
        .from(applications)
        .where(eq(applications.clientId, clientId))
        .orderBy(desc(applications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplicationsByClient:", error);
      return [];
    }
  }

  async getApplicationsByStatus(status: string): Promise<Application[]> {
    try {
      const result = await db.select()
        .from(applications)
        .where(eq(applications.status, status))
        .orderBy(desc(applications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplicationsByStatus:", error);
      return [];
    }
  }

  async getApplication(id: number): Promise<Application | undefined> {
    try {
      const [application] = await db.select().from(applications).where(eq(applications.id, id));
      return application;
    } catch (error) {
      console.error("Database error in getApplication:", error);
      return undefined;
    }
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    try {
      const [result] = await db.insert(applications).values({
        ...application,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createApplication:", error);
      throw new Error("Failed to create application");
    }
  }

  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    try {
      const [updatedApplication] = await db.update(applications)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(applications.id, id))
        .returning();
      return updatedApplication;
    } catch (error) {
      console.error("Database error in updateApplication:", error);
      return undefined;
    }
  }

  // Application document management
  async getApplicationDocuments(applicationId: number): Promise<ApplicationDocument[]> {
    try {
      const result = await db.select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, applicationId))
        .orderBy(applicationDocuments.documentType);
      return result;
    } catch (error) {
      console.error("Database error in getApplicationDocuments:", error);
      return [];
    }
  }

  async getApplicationDocument(id: number): Promise<ApplicationDocument | undefined> {
    try {
      const [document] = await db.select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.id, id));
      return document;
    } catch (error) {
      console.error("Database error in getApplicationDocument:", error);
      return undefined;
    }
  }

  async createApplicationDocument(document: InsertApplicationDocument): Promise<ApplicationDocument> {
    try {
      const [result] = await db.insert(applicationDocuments).values({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createApplicationDocument:", error);
      throw new Error("Failed to create application document");
    }
  }

  async updateApplicationDocument(id: number, updates: Partial<ApplicationDocument>): Promise<ApplicationDocument | undefined> {
    try {
      const [updatedDocument] = await db.update(applicationDocuments)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(applicationDocuments.id, id))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error("Database error in updateApplicationDocument:", error);
      return undefined;
    }
  }

  // Application milestone management
  async getApplicationMilestones(applicationId: number): Promise<ApplicationMilestone[]> {
    try {
      const result = await db.select()
        .from(applicationMilestones)
        .where(eq(applicationMilestones.applicationId, applicationId))
        .orderBy(desc(applicationMilestones.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplicationMilestones:", error);
      return [];
    }
  }

  async createApplicationMilestone(milestone: InsertApplicationMilestone): Promise<ApplicationMilestone> {
    try {
      const [result] = await db.insert(applicationMilestones).values({
        ...milestone,
        createdAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createApplicationMilestone:", error);
      throw new Error("Failed to create application milestone");
    }
  }

  async updateApplicationMilestone(id: number, updates: Partial<ApplicationMilestone>): Promise<ApplicationMilestone | undefined> {
    try {
      const [updatedMilestone] = await db.update(applicationMilestones)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(applicationMilestones.id, id))
        .returning();
      return updatedMilestone;
    } catch (error) {
      console.error("Database error in updateApplicationMilestone:", error);
      return undefined;
    }
  }

  // Application comment management
  async getApplicationComments(applicationId: number): Promise<ApplicationComment[]> {
    try {
      const result = await db.select()
        .from(applicationComments)
        .where(eq(applicationComments.applicationId, applicationId))
        .orderBy(desc(applicationComments.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getApplicationComments:", error);
      return [];
    }
  }

  async createApplicationComment(comment: InsertApplicationComment): Promise<ApplicationComment> {
    try {
      const [result] = await db.insert(applicationComments).values({
        ...comment,
        createdAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createApplicationComment:", error);
      throw new Error("Failed to create application comment");
    }
  }

  // Notification management
  async getUserNotifications(userId: number): Promise<Notification[]> {
    try {
      const result = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getUserNotifications:", error);
      return [];
    }
  }

  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
    try {
      const result = await db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        )
        .orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getUserUnreadNotifications:", error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [result] = await db.insert(notifications).values({
        ...notification,
        createdAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error("Database error in createNotification:", error);
      throw new Error("Failed to create notification");
    }
  }

  async markNotificationRead(id: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Database error in markNotificationRead:", error);
      return false;
    }
  }

  async markAllNotificationsRead(userId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      return true;
    } catch (error) {
      console.error("Database error in markAllNotificationsRead:", error);
      return false;
    }
  }
}

// Exporting the appropriate storage implementation
// Determine environment type
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = !isDevelopment;

// Create memory storage
const memStorage = new MemStorage();

// Use database storage for both development and production to ensure data persistence
let storageImplementation: IStorage;

try {
  // Use database storage to ensure data persistence
  storageImplementation = new DatabaseStorage();
  console.log('Using PostgreSQL database storage for data persistence');
} catch (error) {
  // Fallback to in-memory in case of database error
  console.error('❌ CRITICAL: Database initialization failed:', error);
  storageImplementation = memStorage;
  console.log('CRITICAL: Using in-memory storage as fallback. User data will not persist between restarts!');
}

// Export the selected storage implementation
export const storage = storageImplementation;
