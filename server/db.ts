import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { DefaultAzureCredential } from "@azure/identity";
dotenv.config(); 

let dbUrl: string;

async function getAzureToken() {
  try {
    const credential = new DefaultAzureCredential();
    const scope = "https://ossrdbms-aad.database.windows.net/.default";
    const tokenResponse = await credential.getToken(scope);
    return tokenResponse.token;
  } catch (error) {
    console.error('Failed to get Azure token:', error);
    throw error;
  }
}

// Determine environment and set appropriate connection string
if (process.env.NODE_ENV === 'production') {
  // For production, try DATABASE_URL first, then construct from individual vars
  if (process.env.DATABASE_URL) {
    dbUrl = process.env.DATABASE_URL;
    console.log('Using production DATABASE_URL');
  } else if (
    process.env.AZURE_POSTGRESQL_HOST &&
    process.env.AZURE_POSTGRESQL_DATABASE &&
    process.env.AZURE_MANAGED_IDENTITY === 'true'
  ) {
    // Use Azure Managed Identity authentication
    const userObjectId = process.env.AZURE_USER_OBJECT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    
    if (!userObjectId || !tenantId) {
      throw new Error("Azure Managed Identity requires AZURE_USER_OBJECT_ID and AZURE_TENANT_ID environment variables");
    }
    
    const user = `${userObjectId}`;
    const password = await getAzureToken();
    
    //dbUrl = `postgresql://${user}:${password}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT || '5432'}/${process.env.AZURE_POSTGRESQL_DATABASE}`;
    //dbUrl = `postgresql://${user}:${password}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT}/${process.env.AZURE_POSTGRESQL_DATABASE}?sslmode=require`;
    console.log(user);
    console.log(password);
    console.log(process.env.AZURE_POSTGRESQL_HOST);
    console.log(process.env.AZURE_POSTGRESQL_DATABASE);
    dbUrl = `postgresql://${user}:${encodeURIComponent(password)}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT || '5432'}/${process.env.AZURE_POSTGRESQL_DATABASE}?sslmode=require`;
    console.log('Using Azure Managed Identity authentication');
    console.log(dbUrl);
  } else if (
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
      "Production environment requires either DATABASE_URL, Azure Managed Identity configuration, or all PostgreSQL environment variables"
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
      // if (process.env.AZURE_POSTGRESQL_SSL === 'false' || dbUrl.includes('ssl=false')) {
      //   return false;
      // }
      // return {
      //   rejectUnauthorized: false // Allow self-signed certificates for cloud databases
      // };
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
