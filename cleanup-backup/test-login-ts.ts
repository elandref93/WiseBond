import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

async function testLogin() {
  // Log the actual table structure 
  try {
    console.log('Checking actual database table structure...');
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Current users table structure:', JSON.stringify(tableInfo.rows, null, 2));
  } catch (e) {
    console.error('Error checking table structure:', e);
  }
  
  try {
    // Check for the user in the database
    const email = 'elandrefourie18@gmail.com';
    console.log(`Looking up user with email: ${email}`);
    
    // Use Drizzle's query builder to get user by email
    const userResult = await db.select().from(users).where(eq(users.email, email));
    
    if (userResult.length === 0) {
      console.log(`No user found with email: ${email}`);
      console.log('Creating a test user with this email...');
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('Elandre450', saltRounds);
      
      // Create a new user using Drizzle's insert method
      const [newUser] = await db.insert(users).values({
        username: email,
        password: hashedPassword,
        firstName: 'Elandre',
        lastName: 'Fourie',
        email: email,
        otpVerified: true,
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log('Created test user successfully:', newUser);
    } else {
      const user = userResult[0];
      console.log(`User found with id: ${user.id}`);
      
      // Test password verification
      const testPassword = 'Elandre450';
      
      try {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        
        if (isMatch) {
          console.log('Password verification successful! Login should work now.');
        } else {
          console.log('Password verification failed.');
          
          // Update the password
          console.log('Updating password...');
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
          
          await db.update(users)
            .set({
              password: hashedPassword,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log('Password updated successfully. Login should work now.');
        }
      } catch (error) {
        console.error('Error during password verification:', error);
      }
    }
  } catch (error) {
    console.error('Error during test login:', error);
  }
}

// Run the test
testLogin()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error));