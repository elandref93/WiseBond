// Test script for Azure PostgreSQL connection
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAzurePostgresConnection() {
  console.log('Testing Azure PostgreSQL connection...');
  
  const certPath = path.join(__dirname, 'certs', 'DigiCertGlobalRootG2.crt.pem');
  console.log(`Certificate path: ${certPath}`);
  console.log(`Certificate exists: ${fs.existsSync(certPath)}`);
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not set!');
    return;
  }
  
  const { Pool } = pg;
  
  const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined
    }
  };
  
  console.log('Creating connection pool...');
  const pool = new Pool(poolConfig);
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    console.log('Querying database...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`Server time: ${result.rows[0].current_time}`);
    
    console.log('Querying server version...');
    const versionResult = await client.query('SELECT version()');
    console.log(`Server version: ${versionResult.rows[0].version}`);
    
    client.release();
    await pool.end();
    
    console.log('Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testAzurePostgresConnection().catch(console.error);