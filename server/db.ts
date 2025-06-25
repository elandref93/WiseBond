import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
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
      "Production environment requires Azure PostgreSQL environment variables (AZURE_POSTGRESQL_USER, AZURE_POSTGRESQL_PASSWORD, AZURE_POSTGRESQL_HOST, AZURE_POSTGRESQL_PORT, AZURE_POSTGRESQL_DATABASE)"
    );
  }
} else {
  // For development and other environments
  if (process.env.POSTGRES_USERNAME && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_HOST && process.env.POSTGRES_DATABASE) {
    // Use individual PostgreSQL credentials for development
    const port = process.env.POSTGRES_PORT || '5432';
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(process.env.POSTGRES_PASSWORD);
    dbUrl = `postgresql://${process.env.POSTGRES_USERNAME}:${encodedPassword}@${process.env.POSTGRES_HOST}:${port}/${process.env.POSTGRES_DATABASE}?sslmode=require`;
    console.log('Using PostgreSQL credentials for development');
  } else {
    throw new Error(
      "Development environment requires PostgreSQL credentials (POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE)"
    );
  }
}

console.log('Connecting to database...');

// Create pool configuration with appropriate SSL settings and timeouts
const poolConfig = {
  connectionString: dbUrl,
  connectionTimeoutMillis: 15000, // 15 seconds to connect
  idleTimeoutMillis: 60000, // 60 seconds idle timeout
  max: 10, // maximum pool size
  ssl: (() => {
    // Determine SSL configuration based on environment and connection string
    if (process.env.NODE_ENV === 'production') {
      // For production, enable SSL by default unless explicitly disabled
      if (process.env.AZURE_POSTGRESQL_SSL === 'false' || dbUrl.includes('ssl=false')) {
        return false;
      }
      return {
        rejectUnauthorized: false // Allow self-signed certificates for cloud databases
      };
    } else {
      // For development, enable SSL for Azure PostgreSQL connections
      if (dbUrl.includes('ssl=true') || dbUrl.includes('sslmode=require') || dbUrl.includes('azure.com')) {
        return {
          rejectUnauthorized: false
        };
      }
      return false;
    }
  })()
};

let pool: Pool;
let db: ReturnType<typeof drizzle>;

/**
 * Get database configuration from Key Vault or environment variables
 */
async function getDatabaseConfig() {
  console.log('Configuring database connection...');
  
  // First try to get configuration from Key Vault
  const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
  
  if (keyVaultConfig) {
    console.log('Using database configuration from Azure Key Vault');
    return {
      connectionString: `postgresql://${keyVaultConfig.username}:${keyVaultConfig.password}@${keyVaultConfig.host}:${keyVaultConfig.port}/${keyVaultConfig.database}?sslmode=require`,
      source: 'keyvault'
    };
  }
  
  // Fallback to environment variables
  console.log('Key Vault configuration unavailable, using environment variables');
  
  if (!process.env.DATABASE_URL) {
    // Try to construct from individual environment variables
    const host = process.env.POSTGRES_HOST || process.env.PGHOST;
    const port = process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
    const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE;
    const username = process.env.POSTGRES_USERNAME || process.env.PGUSER;
    const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
    
    if (host && database && username && password) {
      const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`;
      console.log('Constructed DATABASE_URL from individual environment variables');
      return {
        connectionString,
        source: 'environment'
      };
    }
    
    throw new Error(
      "Database configuration not found. Please ensure either:\n" +
      "1. Azure Key Vault contains the required secrets, or\n" +
      "2. DATABASE_URL environment variable is set, or\n" +
      "3. Individual database environment variables are set (POSTGRES_HOST, POSTGRES_DATABASE, etc.)"
    );
  }
  
  return {
    connectionString: process.env.DATABASE_URL,
    source: 'environment'
  };
}

/**
 * Initialize database connection with Key Vault integration
 */
async function initializeDatabase() {
  try {
    const config = await getDatabaseConfig();
    
    const poolConfig = {
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(poolConfig);
    db = drizzle(pool, { schema });
    
    console.log(`Database initialized using ${config.source} configuration`);
    
    // Test the connection
    // Note: We don't test the connection here to avoid circular dependency
    // The test will be done separately when needed
    
    return { pool, db };
    
  } catch (error: any) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

// Initialize database connection with fallback
async function setupDatabase() {
  try {
    await initializeDatabase();
  } catch (error: any) {
    console.warn('Key Vault database initialization failed, trying environment variables...');
    
    // Fallback to original pool configuration
    if (process.env.DATABASE_URL) {
      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      pool = new Pool(poolConfig);
      db = drizzle(pool, { schema });
      console.log('Database initialized using environment variables');
    } else {
      console.error('No database configuration available');
      throw error;
    }
  }
}

// Initialize database on module load
setupDatabase().catch(error => {
  console.error('Failed to initialize database:', error.message);
  console.log('Application will continue with limited functionality...');
});

// Export the initialized instances
export { pool, db };

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
