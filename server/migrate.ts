import { db } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Simple migration function to ensure tables exist
 */
export const runMigrations = async () => {
  console.log('Running database migrations...');
  
  try {
    // Check if users table exists by trying to select from it
    try {
      await db.select().from(schema.users).limit(1);
      console.log('✅ Users table exists');
      
      // Check and add co-applicant columns
      console.log('Checking for missing co-applicant columns in users table...');
      try {
        // Check if marital_status column exists
        await db.execute(sql`SELECT marital_status FROM users LIMIT 1`);
        console.log('✅ Co-applicant columns already exist');
      } catch (e) {
        console.log('Adding co-applicant columns to users table...');
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
        console.log('✅ Added co-applicant columns to users table');
      }
    } catch (e) {
      console.log('Creating users table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          id_number TEXT,
          date_of_birth TEXT,
          age INTEGER,
          address TEXT,
          city TEXT,
          postal_code TEXT,
          province TEXT,
          employment_status TEXT,
          employer_name TEXT,
          employment_sector TEXT,
          job_title TEXT,
          employment_duration TEXT,
          monthly_income INTEGER,
          marital_status TEXT,
          has_co_applicant BOOLEAN DEFAULT FALSE,
          co_applicant_first_name TEXT,
          co_applicant_last_name TEXT,
          co_applicant_email TEXT,
          co_applicant_phone TEXT,
          co_applicant_id_number TEXT,
          co_applicant_date_of_birth TEXT,
          co_applicant_age INTEGER,
          co_applicant_employment_status TEXT,
          co_applicant_employer_name TEXT,
          co_applicant_employment_sector TEXT,
          co_applicant_job_title TEXT,
          co_applicant_employment_duration TEXT,
          co_applicant_monthly_income INTEGER,
          same_address BOOLEAN DEFAULT TRUE,
          co_applicant_address TEXT,
          co_applicant_city TEXT,
          co_applicant_postal_code TEXT,
          co_applicant_province TEXT,
          otp_verified BOOLEAN DEFAULT FALSE,
          profile_complete BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created users table with co-applicant columns');
    }
    
    // Check if calculation_results table exists
    try {
      await db.select().from(schema.calculationResults).limit(1);
      console.log('✅ Calculation results table exists');
    } catch (e) {
      console.log('Creating calculation_results table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS calculation_results (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          calculation_type TEXT NOT NULL,
          input_data JSONB NOT NULL,
          result_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created calculation_results table');
    }

    // Check if budget_categories table exists
    try {
      await db.select().from(schema.budgetCategories).limit(1);
      console.log('✅ Budget categories table exists');
    } catch (e) {
      console.log('Creating budget_categories table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS budget_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          sort_order INTEGER DEFAULT 0
        )
      `);
      console.log('✅ Created budget_categories table');
    }
    
    // Check if expenses table exists
    try {
      await db.select().from(schema.expenses).limit(1);
      console.log('✅ Expenses table exists');
    } catch (e) {
      console.log('Creating expenses table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created expenses table');
    }

    // Check if contact_submissions table exists
    try {
      await db.select().from(schema.contactSubmissions).limit(1);
      console.log('✅ Contact submissions table exists');
    } catch (e) {
      console.log('Creating contact_submissions table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created contact_submissions table');
    }

    // Check if sessions table exists
    try {
      await db.execute(sql`SELECT 1 FROM sessions LIMIT 1`);
      console.log('✅ Sessions table exists');
    } catch (e) {
      console.log('Sessions table might be created by connect-pg-simple automatically');
    }
    
    // Check notifications table
    try {
      await db.select().from(schema.notifications).limit(1);
      console.log('✅ Notifications table exists');
      
      // Ensure notifications table has read column, not isRead
      try {
        await db.execute(sql`SELECT read FROM notifications LIMIT 1`);
        console.log('✅ Notifications table has correct column structure');
      } catch (e) {
        // The error could be because either the table doesn't exist or the column doesn't exist
        try {
          // Check if isRead exists
          await db.execute(sql`SELECT "is_read" FROM notifications LIMIT 1`);
          // If we get here, it means isRead exists but read doesn't, so we need to rename
          console.log('Renaming is_read column to read in notifications table...');
          await db.execute(sql`ALTER TABLE notifications RENAME COLUMN "is_read" TO "read"`);
          console.log('✅ Renamed is_read to read in notifications table');
        } catch (e2) {
          // If we get here, neither column exists, so we need to add read
          console.log('Adding read column to notifications table...');
          await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT FALSE`);
          console.log('✅ Added read column to notifications table');
        }
      }
    } catch (e) {
      // Notifications table doesn't exist
      console.log('Creating notifications table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          related_id INTEGER,
          related_type TEXT,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created notifications table');
    }
    
    console.log('✅ All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};