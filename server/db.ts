import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
dotenv.config(); 

let dbUrl: string;

// Determine environment and set appropriate connection string
if (process.env.NODE_ENV === 'production') {
  // For production, try DATABASE_URL first, then construct from individual vars
  if (process.env.DATABASE_URL) {
    dbUrl = process.env.DATABASE_URL;
    console.log('Using production DATABASE_URL');
  }else if (
    process.env.AZURE_POSTGRESQL_USER &&
    process.env.AZURE_POSTGRESQL_PASSWORD &&
    process.env.AZURE_POSTGRESQL_HOST &&
    process.env.AZURE_POSTGRESQL_PORT &&
    process.env.AZURE_POSTGRESQL_DATABASE
  ) {
    dbUrl = `postgresql://${process.env.AZURE_POSTGRESQL_USER}:${process.env.AZURE_POSTGRESQL_PASSWORD}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT}/${process.env.AZURE_POSTGRESQL_DATABASE}`;
    console.log('Using constructed Azure PostgreSQL URL for production');
    if (process.env.AZURE_POSTGRESQL_SSL === 'true' && !dbUrl.includes('sslmode') && !dbUrl.includes('ssl=')) 
    {
      dbUrl += '?sslmode=require';
    }
  }
  else {
    throw new Error(
      "Production environment requires either DATABASE_URL or all PostgreSQL environment variables (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE)"
    );
  }
} else {
  // For development and other environments
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }
  dbUrl = process.env.DATABASE_URL;
  console.log('Using development DATABASE_URL');
}

console.log('Connecting to database...');

// Create pool configuration with appropriate SSL settings
const poolConfig = {
  connectionString: dbUrl,
  ssl: (() => {
    // Determine SSL configuration based on environment and connection string
    if (process.env.NODE_ENV === 'production') {
      // For production, enable SSL by default unless explicitly disabled
      if (process.env.AZURE_POSTGRESQL_SSL === 'false' || dbUrl.includes('ssl=false')) {
        return false;
      }
      return {
        rejectUnauthorized: true,
        ca: process.env.AZURE_POSTGRESQL_SSL_CA_PATH ? 
            readFileSync(process.env.AZURE_POSTGRESQL_SSL_CA_PATH, 'utf-8') : 
          undefined
      };
    } else {
      // For development, disable SSL by default unless connection string requires it
      if (dbUrl.includes('ssl=true') || dbUrl.includes('sslmode=require')) {
        return {
          rejectUnauthorized: false
        };
      }
      return false;
    }
  })()
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Function to test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`Connected to: ${dbUrl.split('@')[1]?.split('/')[0] || 'Unknown database'}`);
    console.log(`Server time: ${result.rows[0].now}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
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
      
      // Provide specific guidance based on error type
      if (errorDetails.code === 'ENOTFOUND') {
        console.error('DNS lookup failed. This could mean:');
        console.error('1. The database URL is incorrect');
        console.error('2. The database server is not accessible');
        console.error('3. Check if the database is provisioned correctly');
        console.error('4. Verify network connectivity');
      } else if (errorDetails.code === 'ECONNREFUSED') {
        console.error('Connection refused. This could mean:');
        console.error('1. The database server is not running');
        console.error('2. Wrong port or host specified');
        console.error('3. Firewall blocking the connection');
      } else if (errorDetails.message?.includes('SSL')) {
        console.error('SSL connection issue. Try:');
        console.error('1. Setting DATABASE_SSL=false environment variable');
        console.error('2. Adding ?ssl=false to your connection string');
        console.error('3. Check if your database requires SSL');
      }
    }
    
    return false;
  }
};
