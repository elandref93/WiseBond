import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * This script resets a user's password or creates a new admin user
 * Run with: tsx server/reset-user.ts
 */
async function resetUserPassword() {
  try {
    console.log('Starting user password reset...');
    
    // Get the user by email
    const email = 'elandrefourie18@gmail.com';
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    
    if (!existingUser) {
      console.log(`No user found with email: ${email}. Creating a new admin user...`);
      
      // Create a new admin user with the provided password
      const saltRounds = 10;
      const newPassword = 'Elandre450';
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const [newUser] = await db.insert(users).values({
        username: email,
        email: email,
        password: hashedPassword,
        firstName: 'Elandre',
        lastName: 'Fourie',
        phone: '0716785114',
        otpVerified: true,
        profileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`Created new admin user with ID: ${newUser.id} and email: ${newUser.email}`);
    } else {
      console.log(`Found existing user with ID: ${existingUser.id}`);
      
      // Reset password for existing user
      const saltRounds = 10;
      const newPassword = 'Elandre450';
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      await db.update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id));
      
      console.log(`Reset password for user with ID: ${existingUser.id}`);
    }
    
    console.log('Password reset/user creation completed successfully');
  } catch (error) {
    console.error('Error during password reset:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Execute the function
resetUserPassword();