import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password"),
  // OAuth fields
  providerId: text("provider_id"), // OAuth provider ID (google, facebook)
  providerAccountId: text("provider_account_id"), // OAuth account ID from provider
  image: text("image"), // Profile image URL from OAuth provider
  title: text("title"), // Title (Mr, Mrs, Ms, Dr, etc.)
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  idNumber: text("id_number"), // South African ID number
  dateOfBirth: text("date_of_birth"), // Date of birth (YYYY-MM-DD)
  age: integer("age"), // Age calculated from ID number or set manually
  address: text("address"), // Physical address
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  employmentStatus: text("employment_status"), // Employed, Self-employed, etc.
  employerName: text("employer_name"),
  employmentSector: text("employment_sector"),
  jobTitle: text("job_title"),
  employmentDuration: text("employment_duration"), // Duration of employment in current position
  monthlyIncome: integer("monthly_income"),  // Can be null
  maritalStatus: text("marital_status"), // Single, Married, Divorced, Widowed
  hasCoApplicant: boolean("has_co_applicant").default(false), // Whether the user is applying with a co-applicant
  coApplicantTitle: text("co_applicant_title"), // Co-applicant's title (Mr, Mrs, Ms, Dr, etc.)
  coApplicantFirstName: text("co_applicant_first_name"), // Co-applicant's first name
  coApplicantLastName: text("co_applicant_last_name"), // Co-applicant's last name
  coApplicantEmail: text("co_applicant_email"), // Co-applicant's email address
  coApplicantPhone: text("co_applicant_phone"), // Co-applicant's phone number
  coApplicantIdNumber: text("co_applicant_id_number"), // Co-applicant's ID number
  coApplicantDateOfBirth: text("co_applicant_date_of_birth"), // Co-applicant's date of birth
  coApplicantAge: integer("co_applicant_age"), // Co-applicant's age
  coApplicantEmploymentStatus: text("co_applicant_employment_status"), // Co-applicant's employment status
  coApplicantEmployerName: text("co_applicant_employer_name"), // Co-applicant's employer name
  coApplicantEmploymentSector: text("co_applicant_employment_sector"), // Co-applicant's employment sector
  coApplicantJobTitle: text("co_applicant_job_title"), // Co-applicant's job title
  coApplicantEmploymentDuration: text("co_applicant_employment_duration"), // Co-applicant's employment duration
  coApplicantMonthlyIncome: integer("co_applicant_monthly_income"), // Co-applicant's monthly income
  sameAddress: boolean("same_address").default(true), // Whether co-applicant has the same address as main applicant
  coApplicantAddress: text("co_applicant_address"), // Co-applicant's address if different
  coApplicantCity: text("co_applicant_city"), // Co-applicant's city if different
  coApplicantPostalCode: text("co_applicant_postal_code"), // Co-applicant's postal code if different
  coApplicantProvince: text("co_applicant_province"), // Co-applicant's province if different
  // Authentication fields
  otpVerified: boolean("otp_verified").default(false),
  otpCode: text("otp_code"), // Current OTP code
  otpExpiresAt: timestamp("otp_expires_at"), // OTP expiration time
  resetToken: text("reset_token"), // Password reset token
  resetTokenExpiresAt: timestamp("reset_token_expires_at"), // Reset token expiration
  profileComplete: boolean("profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NextAuth.js tables for OAuth
export const accounts = pgTable("accounts", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  title: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  idNumber: true,
  dateOfBirth: true,
  age: true,
  address: true,
  city: true,
  postalCode: true,
  province: true,
  employmentStatus: true,
  employerName: true,
  employmentSector: true,
  jobTitle: true,
  employmentDuration: true,
  monthlyIncome: true,
  maritalStatus: true,
  hasCoApplicant: true,
  coApplicantTitle: true,
  coApplicantFirstName: true,
  coApplicantLastName: true,
  coApplicantEmail: true,
  coApplicantPhone: true,
  coApplicantIdNumber: true,
  coApplicantDateOfBirth: true,
  coApplicantAge: true,
  coApplicantEmploymentStatus: true,
  coApplicantEmployerName: true,
  coApplicantEmploymentSector: true,
  coApplicantJobTitle: true,
  coApplicantEmploymentDuration: true,
  coApplicantMonthlyIncome: true,
  sameAddress: true,
  coApplicantAddress: true,
  coApplicantCity: true,
  coApplicantPostalCode: true,
  coApplicantProvince: true,
  otpVerified: true,
  profileComplete: true,
});

// Schema for updating user profile
export const updateProfileSchema = createInsertSchema(users)
  .omit({ id: true, password: true, username: true, createdAt: true, updatedAt: true })
  .extend({
    idNumber: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        // Must be 13 digits
        if (!/^\d{13}$/.test(val)) return false;
        
        // Luhn algorithm for SA ID validation
        const digits = val.split('').map(Number);
        const checkDigit = digits.pop();
        const sum = digits.reverse()
          .map((d, i) => (i % 2 === 0) ? 
            ((d * 2) > 9 ? (d * 2) - 9 : (d * 2)) : d)
          .reduce((acc, val) => acc + val, 0);
        return (10 - (sum % 10)) % 10 === checkDigit;
      },
      { message: "Invalid South African ID number" }
    ),
    // Phone numbers in South African format
    phone: z.string().optional().refine(
      (val) => {
        if (!val) return true; // Allow empty as it's optional
        // Match South African mobile numbers (starting with 0 or +27 followed by 6, 7, or 8)
        return /^(\+27|0)[6-8][0-9]{8}$/.test(val);
      },
      { message: "Please enter a valid South African mobile number (e.g., 0821234567 or +27821234567)" }
    ),
    // Email validation with specific regex pattern
    email: z.string().refine(
      (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
      { message: "Invalid email address" }
    ),
    // Monthly income can be null
    monthlyIncome: z.number().nullable().optional(),
    
    // Co-applicant fields
    maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
    hasCoApplicant: z.boolean().optional(),
    coApplicantTitle: z.string().optional(),
    coApplicantFirstName: z.string().optional(),
    coApplicantLastName: z.string().optional(),
    coApplicantEmail: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        return /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val);
      },
      { message: "Invalid co-applicant email address" }
    ),
    coApplicantPhone: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        return /^(\+27|0)[6-8][0-9]{8}$/.test(val);
      },
      { message: "Please enter a valid South African mobile number for co-applicant" }
    ),
    coApplicantIdNumber: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        if (!/^\d{13}$/.test(val)) return false;
        
        const digits = val.split('').map(Number);
        const checkDigit = digits.pop();
        const sum = digits.reverse()
          .map((d, i) => (i % 2 === 0) ? 
            ((d * 2) > 9 ? (d * 2) - 9 : (d * 2)) : d)
          .reduce((acc, val) => acc + val, 0);
        return (10 - (sum % 10)) % 10 === checkDigit;
      },
      { message: "Invalid South African ID number for co-applicant" }
    ),
    coApplicantDateOfBirth: z.string().optional(),
    coApplicantAge: z.number().optional(),
    coApplicantEmploymentStatus: z.enum(['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student']).optional(),
    coApplicantEmployerName: z.string().optional(),
    coApplicantEmploymentSector: z.string().optional(),
    coApplicantJobTitle: z.string().optional(),
    coApplicantEmploymentDuration: z.string().optional(),
    coApplicantMonthlyIncome: z.number().nullable().optional(),
    sameAddress: z.boolean().optional(),
    coApplicantAddress: z.string().optional(),
    coApplicantCity: z.string().optional(),
    coApplicantPostalCode: z.string().optional(),
    coApplicantProvince: z.string().optional(),
  });

export const loginSchema = z.object({
  username: z.string().refine(
    (val) => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-_]+\.)+[A-Za-z]{2,6}$/.test(val),
    { message: "Please enter a valid email address" }
  ),
  password: z.string().min(1, "Password is required"),
});

export const calculationResults = pgTable("calculation_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  calculationType: text("calculation_type").notNull(), // bond, affordability, deposit
  inputData: text("input_data").notNull(), // JSON string of input values
  resultData: text("result_data").notNull(), // JSON string of calculated results
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalculationResultSchema = createInsertSchema(calculationResults).pick({
  userId: true,
  calculationType: true,
  inputData: true,
  resultData: true,
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).pick({
  name: true,
  email: true,
  phone: true,
  message: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Login = z.infer<typeof loginSchema>;
export type CalculationResult = typeof calculationResults.$inferSelect;
export type InsertCalculationResult = z.infer<typeof insertCalculationResultSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Property Management Tables
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // User-defined property name
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  propertyValue: integer("property_value").notNull(),
  originalLoanAmount: integer("original_loan_amount").notNull(),
  currentLoanBalance: integer("current_loan_balance").notNull(),
  currentMonthlyPayment: integer("current_monthly_payment").notNull(),
  currentInterestRate: real("current_interest_rate").notNull(),
  remainingTerm: integer("remaining_term").notNull(), // months remaining
  originalTerm: integer("original_term").notNull(), // original term in months
  bank: text("bank").notNull(),
  loanStartDate: text("loan_start_date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  propertyValue: z.number().min(1, "Property value must be greater than 0"),
  originalLoanAmount: z.number().min(1, "Original loan amount must be greater than 0"),
  currentLoanBalance: z.number().min(0, "Current loan balance cannot be negative"),
  currentMonthlyPayment: z.number().min(1, "Monthly payment must be greater than 0"),
  currentInterestRate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  remainingTerm: z.number().min(1, "Remaining term must be at least 1 month"),
  originalTerm: z.number().min(1, "Original term must be at least 1 month"),
  bank: z.string().min(1, "Bank is required"),
  loanStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const updatePropertySchema = insertPropertySchema.partial().extend({
  id: z.number(),
});

// Loan Payment Scenarios
export const loanScenarios = pgTable("loan_scenarios", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'lump_sum', 'extra_monthly', 'monthly_increase'
  isActive: boolean("is_active").default(true),
  // Lump sum fields
  lumpSumAmount: integer("lump_sum_amount"),
  lumpSumDate: text("lump_sum_date"), // YYYY-MM-DD or payment number
  lumpSumDateType: text("lump_sum_date_type"), // 'date' or 'payment_number'
  // Extra monthly payment fields
  extraMonthlyAmount: integer("extra_monthly_amount"),
  extraMonthlyStartDate: text("extra_monthly_start_date"), // YYYY-MM-DD or payment number
  extraMonthlyStartType: text("extra_monthly_start_type"), // 'date' or 'payment_number'
  extraMonthlyEndDate: text("extra_monthly_end_date"), // YYYY-MM-DD or payment number (optional)
  extraMonthlyEndType: text("extra_monthly_end_type"), // 'date' or 'payment_number'
  extraMonthlyDuration: integer("extra_monthly_duration"), // number of payments (alternative to end date)
  // Monthly increase fields
  monthlyIncreaseAmount: integer("monthly_increase_amount"),
  monthlyIncreaseStartDate: text("monthly_increase_start_date"), // YYYY-MM-DD or payment number
  monthlyIncreaseStartType: text("monthly_increase_start_type"), // 'date' or 'payment_number'
  monthlyIncreaseFrequency: text("monthly_increase_frequency"), // 'once', 'annually'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLoanScenarioSchema = createInsertSchema(loanScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Scenario name is required"),
  type: z.enum(['lump_sum', 'extra_monthly', 'monthly_increase']),
  isActive: z.boolean().default(true),
  lumpSumAmount: z.number().min(1).optional(),
  lumpSumDate: z.string().optional(),
  lumpSumDateType: z.enum(['date', 'payment_number']).optional(),
  extraMonthlyAmount: z.number().min(1).optional(),
  extraMonthlyStartDate: z.string().optional(),
  extraMonthlyStartType: z.enum(['date', 'payment_number']).optional(),
  extraMonthlyEndDate: z.string().optional(),
  extraMonthlyEndType: z.enum(['date', 'payment_number']).optional(),
  extraMonthlyDuration: z.number().min(1).optional(),
  monthlyIncreaseAmount: z.number().min(1).optional(),
  monthlyIncreaseStartDate: z.string().optional(),
  monthlyIncreaseStartType: z.enum(['date', 'payment_number']).optional(),
  monthlyIncreaseFrequency: z.enum(['once', 'annually']).optional(),
});

export const updateLoanScenarioSchema = insertLoanScenarioSchema.partial().extend({
  id: z.number(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
export type LoanScenario = typeof loanScenarios.$inferSelect;
export type InsertLoanScenario = z.infer<typeof insertLoanScenarioSchema>;
export type UpdateLoanScenario = z.infer<typeof updateLoanScenarioSchema>;

// Budget Categories and Expenses

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).pick({
  name: true,
  description: true,
  isDefault: true,
  sortOrder: true,
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => budgetCategories.id).notNull(),
  subcategoryId: text("subcategory_id"), // References the subcategory id from budgetSubcategories.ts
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(true),
  frequency: text("frequency").default("monthly"), // once, weekly, monthly, yearly
  isCustom: boolean("is_custom").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  userId: true,
  categoryId: true,
  subcategoryId: true,
  name: true,
  amount: true,
  description: true,
  isRecurring: true,
  frequency: true,
  isCustom: true,
});

export const updateExpenseSchema = createInsertSchema(expenses)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
  .extend({
    amount: z.number().min(0, "Amount must be greater than or equal to 0"),
    description: z.string().optional(),
    isRecurring: z.boolean().optional(),
    frequency: z.enum(['once', 'weekly', 'monthly', 'yearly']).optional(),
    subcategoryId: z.string().optional(),
  });

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;

// Agent and Agency Models for Real Estate Agents Portal

export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logo: text("logo"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  licenseNumber: text("license_number"),
  active: boolean("active").default(true),
  commissionStructure: text("commission_structure"), // JSON string with commission tiers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgencySchema = createInsertSchema(agencies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  agencyId: integer("agency_id").references(() => agencies.id),
  licenseNumber: text("license_number").notNull(),
  profilePicture: text("profile_picture"),
  biography: text("biography"),
  specializations: text("specializations"), // JSON array of specializations
  regions: text("regions"), // JSON array of regions covered
  commissionTier: text("commission_tier").default("standard"),
  commissionRate: real("commission_rate").default(0),
  active: boolean("active").default(true),
  approved: boolean("approved").default(false),
  applicationDate: timestamp("application_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  approvalDate: true
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  agentId: integer("agent_id").references(() => agents.id),
  status: text("status").notNull().default("new_lead"), // new_lead, in_progress, submitted, under_review, approved, funded, declined
  lender: text("lender"),
  propertyValue: integer("property_value"),
  loanAmount: integer("loan_amount"),
  term: integer("term"), // Loan term in months
  interestRate: real("interest_rate"),
  applicationDate: timestamp("application_date").defaultNow(),
  submissionDate: timestamp("submission_date"),
  decisionDate: timestamp("decision_date"),
  fundingDate: timestamp("funding_date"),
  notes: text("notes"),
  urgency: text("urgency").default("normal"), // low, normal, high
  commissionEarned: real("commission_earned"),
  commissionPaidDate: timestamp("commission_paid_date"),
  propertyAddress: text("property_address"),
  propertyType: text("property_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  commissionPaidDate: true,
  decisionDate: true,
  fundingDate: true,
  submissionDate: true
});

export const applicationDocuments = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // id, payslip, bank_statement, tax_return, offer_letter, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  uploadDate: timestamp("upload_date").defaultNow(),
  reviewDate: timestamp("review_date"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationDocumentSchema = createInsertSchema(applicationDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  reviewDate: true,
  reviewedBy: true
});

export const applicationMilestones = pgTable("application_milestones", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  milestoneName: text("milestone_name").notNull(), // pre_qualify, submit, under_review, decision, funding
  completed: boolean("completed").default(false),
  expectedDate: timestamp("expected_date"),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationMilestoneSchema = createInsertSchema(applicationMilestones).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  completedDate: true
});

export const applicationComments = pgTable("application_comments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  mentions: text("mentions"), // JSON array of user IDs mentioned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationCommentSchema = createInsertSchema(applicationComments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // approval, document_request, reminder, comment, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of the related entity (application, document, etc.)
  relatedType: text("related_type"), // Type of the related entity (application, document, etc.)
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true,
  read: true
});

// Export types for all these new models
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type ApplicationDocument = typeof applicationDocuments.$inferSelect;
export type InsertApplicationDocument = z.infer<typeof insertApplicationDocumentSchema>;

export type ApplicationMilestone = typeof applicationMilestones.$inferSelect;
export type InsertApplicationMilestone = z.infer<typeof insertApplicationMilestoneSchema>;

export type ApplicationComment = typeof applicationComments.$inferSelect;
export type InsertApplicationComment = z.infer<typeof insertApplicationCommentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
