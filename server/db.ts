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

// Determine environment and database type
const isDevelopment = process.env.NODE_ENV !== 'production';
const isAzureDb = process.env.DATABASE_URL?.includes('azure.com') || false;
const isNeonDb = process.env.DATABASE_URL?.includes('neon.tech') || false;
const certBasePath = isDevelopment ? path.join(process.cwd(), 'certs') : path.join('/app', 'certs');

// Determine database type for logging
let dbType = 'Standard PostgreSQL';
if (isAzureDb) dbType = 'Azure PostgreSQL';
if (isNeonDb) dbType = 'Neon PostgreSQL';

// Get all certificate files (for Azure)
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

// Configure SSL connection for Azure
const sslOptions = {
  rejectUnauthorized: true,
  ca: caCerts.length > 0 ? caCerts : undefined,
};

console.log(`Database connecting with SSL certificates: ${caCerts.length > 0 ? 'Yes (' + caCerts.length + ' found)' : 'No'}`);
console.log(`Database environment: ${dbType}`);

// Create pool with SSL configuration based on database type
// For Azure DB, use full SSL with certificates
// For Neon DB, use default SSL
// For local DB, SSL might not be required

// Define pool configuration with correct typing for SSL
// The pg module accepts various SSL configurations
interface PoolConfig {
  connectionString: string;
  ssl: boolean | {
    rejectUnauthorized: boolean;
    ca?: string[];
  };
}

// Create base configuration
let poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: false // Default for local PostgreSQL
};

// Update SSL config based on database type
if (isAzureDb) {
  if (caCerts.length > 0) {
    poolConfig.ssl = {
      rejectUnauthorized: true,
      ca: caCerts
    };
  } else {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }
} else if (isNeonDb) {
  poolConfig.ssl = {
    rejectUnauthorized: true
  };
}

export const pool = new Pool(poolConfig);
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
