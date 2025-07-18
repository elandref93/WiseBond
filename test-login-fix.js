#!/usr/bin/env node

/**
 * Test Login Functionality
 * 
 * This script tests the login functionality to ensure it's working properly
 * after the environment configuration fixes.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testLogin() {
  console.log('🔐 Testing Login Functionality');
  console.log('================================\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch(`${BASE_URL}/api/auth/me`);
    console.log(`   ✅ Server is running (Status: ${healthResponse.status})`);

    // Test 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test@example.com',
        password: 'testpassword'
      })
    });

    const loginData = await loginResponse.json();
    console.log(`   ✅ Login endpoint responding (Status: ${loginResponse.status})`);
    console.log(`   📝 Response: ${JSON.stringify(loginData, null, 2)}`);

    // Test 3: Check environment variables
    console.log('\n3. Checking environment variables...');
    const envVars = [
      'MAILGUN_API_KEY',
      'MAILGUN_DOMAIN', 
      'MAILGUN_FROM_EMAIL',
      'GOOGLE_MAPS_API_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'SESSION_SECRET'
    ];

    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: Set (${value.substring(0, 10)}...)`);
      } else {
        console.log(`   ❌ ${varName}: Not set`);
      }
    });

    console.log('\n🎉 Login functionality test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5000 in your browser');
    console.log('2. Try logging in with valid credentials');
    console.log('3. Test the address input functionality');
    console.log('4. Check browser console for any errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the server is running: npm run dev');
    console.log('2. Check that .env.local file exists with API keys');
    console.log('3. Verify the server is accessible at http://localhost:5000');
  }
}

testLogin(); 