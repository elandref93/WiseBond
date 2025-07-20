#!/usr/bin/env node

/**
 * Test script to verify Mailgun email functionality
 * Tests both the registration OTP flow and direct email sending
 */

import { sendVerificationEmail } from './server/email.js';

async function testMailgunOTP() {
  console.log('🧪 Testing Mailgun OTP Email Functionality\n');
  
  // Test data
  const testEmail = 'test@example.com';
  const testOTP = '123456';
  
  console.log('Testing OTP email sending...');
  console.log(`Target: ${testEmail}`);
  console.log(`OTP Code: ${testOTP}\n`);
  
  try {
    const result = await sendVerificationEmail({
      firstName: 'Test',
      email: testEmail,
      verificationCode: testOTP
    });
    
    console.log('📧 Email Send Result:');
    console.log(`✅ Success: ${result.success}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      
      if (result.isSandboxAuthError) {
        console.log('\n⚠️  SANDBOX AUTHORIZATION ERROR DETECTED');
        console.log('This means Mailgun is working but the test email address');
        console.log('needs to be authorized in your Mailgun sandbox domain.');
        console.log('\nTo fix this:');
        console.log('1. Log into your Mailgun dashboard');
        console.log('2. Go to Sending > Authorized Recipients');
        console.log('3. Add the test email address');
        console.log('4. Or use a real authorized email for testing');
      }
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📬 Check the recipient inbox for the verification email');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

async function testRegistrationFlow() {
  console.log('\n🔄 Testing Registration Flow with Real API Call\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        phone: '0821234567'
      })
    });
    
    const result = await response.json();
    
    console.log('📋 Registration API Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, result);
    
    if (response.ok) {
      console.log('\n✅ Registration successful - OTP should be sent!');
      console.log('📧 Check server logs for OTP code and email send status');
    } else {
      console.log('\n❌ Registration failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Registration API error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testMailgunOTP();
  await testRegistrationFlow();
}

runTests().catch(console.error);