const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

// Function to connect to the database
async function connectToDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully. Server time:', result.rows[0].now);
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Function to reset an existing user's password or create a new admin
async function testLogin() {
  const pool = await connectToDatabase();
  
  try {
    console.log('Analyzing users table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
    
    // Test login attempt by getting a user by email
    const email = 'elandrefourie18@gmail.com';
    console.log(`Looking up user with email: ${email}`);
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
      console.log('Creating a test user with this email...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('Elandre450', saltRounds);
      
      const insertResult = await pool.query(`
        INSERT INTO users (
          username, password, first_name, last_name, email, 
          otp_verified, profile_complete, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, NOW(), NOW()
        ) RETURNING *
      `, [
        email, 
        hashedPassword, 
        'Elandre', 
        'Fourie', 
        email, 
        true, 
        true
      ]);
      
      console.log('Created test user successfully:', insertResult.rows[0]);
    } else {
      const user = userResult.rows[0];
      console.log(`User found with id: ${user.id}`);
      console.log('User data:', JSON.stringify(user, null, 2));
      
      // Test password verification
      const testPassword = 'Elandre450';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      
      if (isMatch) {
        console.log('Password verification successful!');
      } else {
        console.log('Password verification failed.');
        
        // Update the password if verification fails
        console.log('Updating password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
        
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
        console.log('Password updated successfully');
      }
    }
  } catch (error) {
    console.error('Error during test login:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
testLogin().catch(console.error);