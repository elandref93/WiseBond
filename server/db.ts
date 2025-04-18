import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine environment and adjust certificate path
const isDevelopment = process.env.NODE_ENV !== 'production';
const isAzureDb = process.env.DATABASE_URL?.includes('azure.com') || false;
const certBasePath = isDevelopment ? path.join(process.cwd(), 'certs') : path.join('/app', 'certs');

// Get all certificate files
const certFiles = [
  path.join(certBasePath, 'DigiCertGlobalRootG2.crt.pem'),
  path.join(certBasePath, 'DigiCertGlobalRootCA.crt'),
  path.join(certBasePath, 'Microsoft RSA Root Certificate Authority 2017.crt')
];

// Load available certificates
const caCerts = certFiles
  .filter(certPath => fs.existsSync(certPath))
  .map(certPath => {
    console.log(`Found certificate: ${certPath}`);
    try {
      return fs.readFileSync(certPath).toString();
    } catch (err) {
      console.error(`Error reading certificate ${certPath}:`, err);
      return null;
    }
  })
  .filter(cert => cert !== null);

// Configure SSL connection
const sslOptions = {
  rejectUnauthorized: true,
  ca: caCerts.length > 0 ? caCerts : undefined,
};

console.log(`Database connecting with SSL certificates: ${caCerts.length > 0 ? 'Yes (' + caCerts.length + ' found)' : 'No'}`);
console.log(`Database environment: ${isAzureDb ? 'Azure PostgreSQL' : 'Local PostgreSQL'}`);

// Create pool with SSL configuration
// For Azure DB, use full SSL with certificates
// For local DB, SSL might not be required, but we keep rejectUnauthorized: false for flexibility
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isAzureDb && caCerts.length > 0 
    ? sslOptions 
    : isAzureDb 
      ? { rejectUnauthorized: false } // Azure DB fallback if no certs
      : false // Local DB doesn't need SSL
});

export const db = drizzle(pool, { schema });

// Function to test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`Connected to: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown database'}`);
    console.log(`Server time: ${result.rows[0].now}`);
    
    return true;
  } catch (unknownError: unknown) {
    console.error('❌ Database connection failed:', unknownError);
    
    // Define an interface for the expected error structure
    interface DatabaseError {
      message?: string;
      code?: string;
      hostname?: string;
      syscall?: string;
    }
    
    // Safe type check
    const isErrorObject = (err: unknown): err is DatabaseError => {
      return err !== null && typeof err === 'object';
    };
    
    if (isErrorObject(unknownError)) {
      const errorDetails: DatabaseError = unknownError;
      
      console.log('Error details:', {
        message: errorDetails.message || 'Unknown error',
        code: errorDetails.code || 'none',
        hostname: errorDetails.hostname || 'none',
        syscall: errorDetails.syscall || 'none'
      });
      
      // If this is a DNS resolution error, provide more specific guidance
      if (errorDetails.code === 'ENOTFOUND') {
        console.error('DNS lookup failed. This could mean:');
        console.error('1. The server name is incorrect');
        console.error('2. The server is not publicly accessible');
        console.error('3. Firewall rules might be blocking access');
        console.error('Please check Azure Portal → PostgreSQL flexible server → Networking settings');
      }
    }
    
    return false;
  }
};
