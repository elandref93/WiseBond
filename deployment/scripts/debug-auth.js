import { db, pool } from '../server/db.js';
import bcrypt from 'bcrypt';

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Test basic database connection
    const result = await pool.query('SELECT NOW() as server_time');
    console.log('Connected to database. Server time:', result.rows[0].server_time);
    
    // Check if users table exists and has records
    const usersResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log('Total users in database:', usersResult.rows[0].user_count);
    
    // Get a specific user for testing (replace with the email you're having trouble with)
    const email = 'elandrefourie18@gmail.com';
    const userQuery = await pool.query(
      'SELECT id, username, email, password, otp_verified FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    
    if (userQuery.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
    } else {
      const user = userQuery.rows[0];
      console.log('Found user:', {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordLength: user.password.length,
        otpVerified: user.otp_verified
      });
      
      // Test given password against stored hash
      const testPassword = 'Elandre450'; // Replace with the password you're trying to use
      try {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`Password verification result: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        
        if (!isMatch) {
          // If the password doesn't match, let's create a new hash for debugging
          const newHash = await bcrypt.hash(testPassword, 10);
          console.log('New hash generated for the password:', newHash);
          console.log('This hash is different from stored hash (expected behavior)');
        }
      } catch (bcryptError) {
        console.error('Error comparing passwords:', bcryptError);
      }
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

main();