// Simple test to check storage persistence
import fetch from 'node-fetch';

async function testUserPersistence() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing user registration and persistence...');
  
  // Test data
  const testUser = {
    username: 'test123@example.com',
    password: 'TestPassword123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test123@example.com'
  };
  
  try {
    // 1. Try to register a user
    console.log('1. Registering user...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration result:', registerResponse.status, registerResult);
    
    if (registerResponse.status === 201) {
      console.log('✅ User registered successfully');
      
      // 2. Try to login immediately
      console.log('2. Testing immediate login...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login result:', loginResponse.status, loginResult);
      
      if (loginResponse.status === 200) {
        console.log('✅ User can login immediately after registration');
      } else {
        console.log('❌ User cannot login immediately after registration');
        console.log('This indicates the user was not properly saved');
      }
    } else {
      console.log('❌ User registration failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUserPersistence();