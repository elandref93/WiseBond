import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  monthlyIncome: integer("monthly_income"),
  otpVerified: boolean("otp_verified").default(false),
  profileComplete: boolean("profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
  monthlyIncome: true,
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
        // Match either 10 digits starting with 0 or +27 followed by 9 digits
        return /^(0\d{9}|\+27[1-9]\d{8})$/.test(val);
      },
      { message: "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)" }
    ),
    // Email validation
    email: z.string().email("Invalid email address"),
  });

export const loginSchema = z.object({
  username: z.string().email("Please enter a valid email address"),
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
