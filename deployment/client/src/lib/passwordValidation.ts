import { z } from "zod";

// Password strength checker with descriptive error messages
export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(100, { message: "Password is too long" })
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Password must contain at least one uppercase letter" }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "Password must contain at least one lowercase letter" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "Password must contain at least one number" }
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    { message: "Password must contain at least one special character" }
  );

// Check if password is common or easy to guess
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    "password", "123456", "12345678", "qwerty", "abc123",
    "welcome", "admin", "password123", "letmein", "monkey",
    // Variations with capital letters
    "Password", "Welcome", "Admin"
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
}

// Check if password contains personal information
export function containsPersonalInfo(
  password: string, 
  personalInfo: { firstName?: string; lastName?: string; email?: string; }
): boolean {
  if (!personalInfo) return false;
  
  const valuesToCheck = [
    personalInfo.firstName,
    personalInfo.lastName,
    personalInfo.email?.split('@')[0] // username part of email
  ].filter(Boolean) as string[];
  
  return valuesToCheck.some(info => 
    info && info.length > 2 && password.toLowerCase().includes(info.toLowerCase())
  );
}

// Full password validation schema that includes personal info check
export function createPasswordSchema(personalInfo?: { firstName?: string; lastName?: string; email?: string; }) {
  return passwordSchema.refine(
    (password) => !isCommonPassword(password),
    { message: "This password is too common and easy to guess" }
  ).refine(
    (password) => !personalInfo || !containsPersonalInfo(password, personalInfo),
    { message: "Password should not contain your name or email address" }
  );
}

// For reset password specific validation
export function createResetPasswordSchema(
  oldPassword: string | null,
  personalInfo?: { firstName?: string; lastName?: string; email?: string; }
) {
  return createPasswordSchema(personalInfo).refine(
    (newPassword) => !oldPassword || newPassword !== oldPassword,
    { message: "New password must be different from your current password" }
  );
}