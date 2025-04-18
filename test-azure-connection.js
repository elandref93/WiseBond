import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define connection details for testing
const testConnection = async () => {
  console.log('🔍 Testing Azure PostgreSQL connection...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please check your .env file.');
    return;
  }
  
  // Extract and mask sensitive info for logging
  const dbUrlParts = process.env.DATABASE_URL.split('@');
  const serverPart = dbUrlParts.length > 1 ? dbUrlParts[1] : 'unknown';
  console.log(`🔄 Attempting to connect to: ${serverPart.split('/')[0]}`);
  
  // Get all certificate files in the certs directory
  const certBasePath = path.join(process.cwd(), 'certs');
  
  try {
    const files = fs.readdirSync(certBasePath);
    console.log('📜 Available certificates:');
    files.forEach(file => console.log(`   - ${file}`));
    
    // Load all certificate files
    const caCerts = files
      .map(file => {
        const certPath = path.join(certBasePath, file);
        try {
          return fs.readFileSync(certPath);
        } catch (err) {
          console.error(`❌ Error reading certificate ${certPath}:`, err);
          return null;
        }
      })
      .filter(cert => cert !== null);
    
    // Try to connect using a Pool with all certificates
    console.log(`🔐 Connecting using ${caCerts.length} certificate(s)...`);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
        ca: caCerts
      }
    });
    
    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Connection successful!');
    console.log(`🕒 Server time: ${result.rows[0].now}`);
    console.log('✅ Your database is correctly configured and accessible.');
    
  } catch (err) {
    console.error('❌ Connection failed:', err);
    
    // Provide guidance based on the error
    if (err.code === 'ENOTFOUND') {
      console.error('\n🔍 DNS resolution failed. This could mean:');
      console.error('   1. The server name in DATABASE_URL is incorrect');
      console.error('   2. The server is not publicly accessible');
      console.error('   3. Firewall rules are blocking access');
      console.error('\n💡 Suggestions:');
      console.error('   - Verify the server name in the Azure Portal');
      console.error('   - Check networking settings to allow public access');
      console.error('   - Add your IP address to the firewall rules');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n🔍 Connection was refused. This could mean:');
      console.error('   1. The server is down or not accepting connections');
      console.error('   2. The port number is incorrect');
      console.error('   3. Firewall is blocking the connection');
    } else if (err.message && err.message.includes('certificate')) {
      console.error('\n🔍 SSL/Certificate error. This could mean:');
      console.error('   1. The SSL certificate is not correctly configured');
      console.error('   2. You need a different root certificate');
      console.error('\n💡 Suggestions:');
      console.error('   - Try adding the Microsoft Azure SSL certificate from the Azure Portal');
      console.error('   - Set SSL mode to require in DATABASE_URL (add ?sslmode=require)');
    } else if (err.message && err.message.includes('authentication')) {
      console.error('\n🔍 Authentication error. This could mean:');
      console.error('   1. Username or password is incorrect');
      console.error('   2. User does not have permission to access the database');
    }
  }
};

// Run the test
testConnection();