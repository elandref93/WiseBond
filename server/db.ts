import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine environment and adjust certificate path
const isDevelopment = process.env.NODE_ENV !== 'production';
const certPath = isDevelopment 
  ? path.join(process.cwd(), 'certs', 'DigiCertGlobalRootG2.crt.pem')
  : path.join('/app', 'certs', 'DigiCertGlobalRootG2.crt.pem'); // Path in Docker container

// Configure SSL connection
const sslConfig = {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined,
  }
};

console.log(`Database connecting with SSL certificate: ${fs.existsSync(certPath) ? 'Yes' : 'No'}`);
console.log(`Certificate path: ${certPath}`);

// Create pool with SSL configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ...sslConfig
});

export const db = drizzle({ client: pool, schema });

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
