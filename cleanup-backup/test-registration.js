// Test user registration and database connection
import { storage } from './server/storage.js';

async function testRegistration() {
  try {
    console.log('Testing database connection and user registration...');
    
    const testUser = {
      username: 'test@example.com',
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    };
    
    // First check if user already exists
    console.log('Checking if test user exists...');
    const existingUser = await storage.getUserByEmail(testUser.email);
    console.log('Existing user found:', existingUser ? 'Yes' : 'No');
    
    if (existingUser) {
      console.log('Test user already exists, checking login...');
      const loginResult = await storage.verifyUser(testUser.username, testUser.password);
      console.log('Login test result:', loginResult ? 'Success' : 'Failed');
    } else {
      console.log('Creating test user...');
      const newUser = await storage.createUser(testUser);
      console.log('User created successfully:', newUser.id, newUser.email);
      
      // Test login with new user
      console.log('Testing login with new user...');
      const loginResult = await storage.verifyUser(testUser.username, testUser.password);
      console.log('Login test result:', loginResult ? 'Success' : 'Failed');
    }
    
    // Now check the actual user that failed to login
    console.log('\nChecking for the actual user: elandrefourie18@gmail.com');
    const actualUser = await storage.getUserByEmail('elandrefourie18@gmail.com');
    console.log('Actual user found:', actualUser ? 'Yes' : 'No');
    if (actualUser) {
      console.log('User details:', { 
        id: actualUser.id, 
        email: actualUser.email, 
        firstName: actualUser.firstName,
        hasPassword: !!actualUser.password
      });
    }
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    console.error('Full error:', error);
  }
}

testRegistration();