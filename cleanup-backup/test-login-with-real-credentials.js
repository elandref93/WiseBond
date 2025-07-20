#!/usr/bin/env node

/**
 * Test Login with Real Credentials
 * 
 * This script tests the login functionality with real credentials
 * and also tests the email functionality with the new Mailgun API key.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testLoginWithRealCredentials() {
  console.log('🔐 Testing Login with Real Credentials');
  console.log('=======================================\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch(`${BASE_URL}/api/auth/me`);
    console.log(`   ✅ Server is running (Status: ${healthResponse.status})`);

    // Test 2: Test registration to create a test account
    console.log('\n2. Testing registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@wisebond.co.za',
        password: 'TestPassword123!',
        phone: '0821234567',
        terms: true
      })
    });

    const registerData = await registerResponse.json();
    console.log(`   ✅ Registration endpoint responding (Status: ${registerResponse.status})`);
    console.log(`   📝 Response: ${JSON.stringify(registerData, null, 2)}`);

    if (registerResponse.status === 201) {
      console.log('   🎉 Test account created successfully!');
      
      // Test 3: Test login with the created account
      console.log('\n3. Testing login with created account...');
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test@wisebond.co.za',
          password: 'TestPassword123!'
        })
      });

      const loginData = await loginResponse.json();
      console.log(`   ✅ Login endpoint responding (Status: ${loginResponse.status})`);
      console.log(`   📝 Response: ${JSON.stringify(loginData, null, 2)}`);

      if (loginResponse.status === 200) {
        console.log('   🎉 Login successful!');
      } else {
        console.log('   ❌ Login failed - this might be expected if OTP verification is required');
      }
    }

    // Test 4: Test email functionality
    console.log('\n4. Testing email functionality...');
    const emailResponse = await fetch(`${BASE_URL}/api/calculations/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@wisebond.co.za',
        calculationType: 'Bond Repayment',
        calculationData: {
          loanAmount: 1000000,
          interestRate: 10.5,
          term: 20,
          monthlyPayment: 9980
        }
      })
    });

    const emailData = await emailResponse.json();
    console.log(`   ✅ Email endpoint responding (Status: ${emailResponse.status})`);
    console.log(`   📝 Response: ${JSON.stringify(emailData, null, 2)}`);

    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5000 in your browser');
    console.log('2. Try logging in with: test@wisebond.co.za / TestPassword123!');
    console.log('3. Check your email for OTP verification');
    console.log('4. Test the address input functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the server is running: npm run dev');
    console.log('2. Check that .env.local file exists with API keys');
    console.log('3. Verify the server is accessible at http://localhost:5000');
  }
}

testLoginWithRealCredentials(); 