import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Set up websocket for Neon database
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

// Create a direct connection to the database
async function addCoApplicantColumns() {
  // Connect to the database using the environment variable
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting to add co-applicant columns to users table...');

    // Step 1: Check if the columns already exist
    console.log('Checking current table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Current users table columns:', tableInfo.rows.map(r => r.column_name).join(', '));
    
    // Get the list of columns we need to add
    const existingColumns = tableInfo.rows.map(r => r.column_name);
    const requiredColumns = [
      'marital_status', 
      'has_co_applicant',
      'co_applicant_first_name', 
      'co_applicant_last_name',
      'co_applicant_email', 
      'co_applicant_phone',
      'co_applicant_id_number', 
      'co_applicant_date_of_birth',
      'co_applicant_age', 
      'co_applicant_employment_status',
      'co_applicant_employer_name', 
      'co_applicant_employment_sector',
      'co_applicant_job_title', 
      'co_applicant_employment_duration',
      'co_applicant_monthly_income', 
      'same_address',
      'co_applicant_address', 
      'co_applicant_city',
      'co_applicant_postal_code', 
      'co_applicant_province'
    ];
    
    // Find which columns are missing
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All co-applicant columns are already present in the users table.');
      return;
    }
    
    console.log(`Found ${missingColumns.length} missing columns:`, missingColumns.join(', '));
    console.log('Adding missing columns...');
    
    // Build the ALTER TABLE statement to add all missing columns at once
    let alterTableSQL = 'ALTER TABLE users';
    
    missingColumns.forEach((column, index) => {
      // Determine the SQL type based on column name
      let columnType = 'TEXT';
      if (column.includes('age') || column.includes('monthly_income')) {
        columnType = 'INTEGER';
      } else if (column === 'has_co_applicant' || column === 'same_address') {
        columnType = 'BOOLEAN DEFAULT FALSE';
      }
      
      // Add the ADD COLUMN statement
      alterTableSQL += `\n  ADD COLUMN IF NOT EXISTS ${column} ${columnType}`;
      
      // Add comma if not the last column
      if (index < missingColumns.length - 1) {
        alterTableSQL += ',';
      }
    });
    
    // Execute the ALTER TABLE statement
    await pool.query(alterTableSQL);
    
    console.log('✅ Successfully added all missing co-applicant columns to users table');
    
    // Verify the columns were added
    const updatedTableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Updated users table columns:', updatedTableInfo.rows.map(r => r.column_name).join(', '));
    
  } catch (error) {
    console.error('Error adding co-applicant columns:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
addCoApplicantColumns().catch(console.error);