#!/usr/bin/env node

/**
 * Production Login Test Script
 * 
 * This script tests the login functionality and session storage
 * to help diagnose the "Failed to save session" error.
 */

import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

async function testProductionLogin() {
  console.log('🔍 Production Login Test');
  console.log('========================\n');

  // Test environment variables
  console.log('📋 Environment Check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('- POSTGRES_HOST:', process.env.POSTGRES_HOST || 'not set');
  console.log('- POSTGRES_USERNAME:', process.env.POSTGRES_USERNAME || 'not set');
  console.log('- POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? 'Set' : 'Not set');
  console.log('');

  // Test credentials
  const testEmail = 'elandref@eapfs.co.za';
  const testPassword = 'Elandre450';

  console.log('🔐 Testing Credentials:');
  console.log('- Email:', testEmail);
  console.log('- Password:', testPassword);
  console.log('');

  // Test password hashing (to verify bcrypt works)
  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Password hashing test:', isValid ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.log('❌ Password hashing test FAILED:', error.message);
  }

  console.log('\n📝 Next Steps:');
  console.log('1. Check Azure Portal → Your Web App → Configuration');
  console.log('2. Verify SESSION_SECRET is set');
  console.log('3. Verify DATABASE_URL or individual PostgreSQL variables are set');
  console.log('4. Check application logs in Azure Portal → Logs → Log stream');
  console.log('5. Verify user exists in production database');
  console.log('6. Test with a fresh user registration if needed');
}

testProductionLogin().catch(console.error); 