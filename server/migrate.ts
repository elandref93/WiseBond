import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { db } from './db';

export async function migrate() {
  console.log('🔄 Starting database migration...');

  try {
    // Test connection
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');

    // Check if users table exists
    try {
      await db.select().from(schema.users).limit(1);
      console.log('✅ Users table exists');
    } catch (error) {
      console.log('❌ Users table does not exist');
      return;
    }

    // Check for marital_status column
    try {
      await db.execute(sql`SELECT marital_status FROM users LIMIT 1`);
      console.log('✅ marital_status column exists');
    } catch (error) {
      console.log('🔄 Adding marital_status column...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS has_co_applicant BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS co_applicant_title VARCHAR(10),
        ADD COLUMN IF NOT EXISTS co_applicant_first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_applicant_last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_applicant_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS co_applicant_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS co_applicant_id_number VARCHAR(13),
        ADD COLUMN IF NOT EXISTS co_applicant_date_of_birth VARCHAR(10),
        ADD COLUMN IF NOT EXISTS co_applicant_age INTEGER,
        ADD COLUMN IF NOT EXISTS co_applicant_employment_status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS co_applicant_employer_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS co_applicant_employment_sector VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_applicant_job_title VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_applicant_employment_duration VARCHAR(50),
        ADD COLUMN IF NOT EXISTS co_applicant_monthly_income INTEGER,
        ADD COLUMN IF NOT EXISTS same_address BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS co_applicant_address TEXT,
        ADD COLUMN IF NOT EXISTS co_applicant_city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_applicant_postal_code VARCHAR(10),
        ADD COLUMN IF NOT EXISTS co_applicant_province VARCHAR(50)
      `);
      console.log('✅ Co-applicant columns added');
    }

    // Check for OTP columns
    try {
      await db.execute(sql`SELECT otp_code FROM users LIMIT 1`);
      console.log('✅ OTP columns exist');
    } catch (error) {
      console.log('🔄 Adding OTP columns...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
        ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS phone_otp_code VARCHAR(6),
        ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP
      `);
      console.log('✅ OTP columns added');
    }

    // Check for provider_id column (OAuth)
    try {
      await db.execute(sql`SELECT provider_id FROM users LIMIT 1`);
      console.log('✅ OAuth columns exist');
    } catch (error) {
      console.log('🔄 Adding OAuth columns...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS provider_account_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS image VARCHAR(255)
      `);
      console.log('✅ OAuth columns added');
    }

    // Check for calculation_results table
    try {
      await db.select().from(schema.calculationResults).limit(1);
      console.log('✅ calculation_results table exists');
    } catch (error) {
      console.log('🔄 Creating calculation_results table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS calculation_results (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          calculation_type VARCHAR(50) NOT NULL,
          input_data TEXT NOT NULL,
          result_data TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ calculation_results table created');
    }

    // Check for budget_categories table
    try {
      await db.select().from(schema.budgetCategories).limit(1);
      console.log('✅ budget_categories table exists');
    } catch (error) {
      console.log('🔄 Creating budget_categories table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS budget_categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          monthly_budget INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ budget_categories table created');
    }

    // Check for expenses table
    try {
      await db.select().from(schema.expenses).limit(1);
      console.log('✅ expenses table exists');
    } catch (error) {
      console.log('🔄 Creating expenses table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          category_id INTEGER REFERENCES budget_categories(id),
          description VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ expenses table created');
    }

    // Check for contact_submissions table
    try {
      await db.select().from(schema.contactSubmissions).limit(1);
      console.log('✅ contact_submissions table exists');
    } catch (error) {
      console.log('🔄 Creating contact_submissions table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ contact_submissions table created');
    }

    // Check for user_sessions table
    try {
      await db.execute(sql`SELECT 1 FROM user_sessions LIMIT 1`);
      console.log('✅ user_sessions table exists');
    } catch (error) {
      console.log('🔄 Creating user_sessions table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )
        WITH (OIDS=FALSE)
      `);
      await db.execute(sql`
        ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
      `);
      await db.execute(sql`
        CREATE INDEX IDX_session_expire ON user_sessions (expire)
      `);
      console.log('✅ user_sessions table created');
    }

    // Check for notifications table
    try {
      await db.select().from(schema.notifications).limit(1);
      console.log('✅ notifications table exists');
    } catch (error) {
      console.log('🔄 Creating notifications table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ notifications table created');
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}