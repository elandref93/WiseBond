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
          otp_verified BOOLEAN DEFAULT FALSE,
          profile_complete BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created users table');
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
    
    console.log('✅ All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};