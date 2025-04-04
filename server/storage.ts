import { 
  users, type User, type InsertUser, type CalculationResult, type InsertCalculationResult, 
  type ContactSubmission, type InsertContactSubmission, type BudgetCategory, type InsertBudgetCategory,
  type Expense, type InsertExpense, type UpdateExpense, budgetCategories, expenses
} from "@shared/schema";
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
  
  // Budget management
  getBudgetCategories(): Promise<BudgetCategory[]>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  
  getUserExpenses(userId: number): Promise<Expense[]>;
  getUserExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, userId: number, updates: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
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

  constructor() {
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
    
    // Initialize default budget categories based on South African home loan application
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
}

export const storage = new MemStorage();
