import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
dotenv.config(); 

let dbUrl: string;

// Use Azure PostgreSQL exclusively
if (process.env.NODE_ENV === 'production') {
  // For production, use Azure PostgreSQL
  if (
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
  } else {
    throw new Error(
      "Production environment requires Azure PostgreSQL environment variables (AZURE_POSTGRESQL_USER, AZURE_POSTGRESQL_PASSWORD, AZURE_POSTGRESQL_HOST, AZURE_POSTGRESQL_PORT, AZURE_POSTGRESQL_DATABASE)"
    );
  }
} else {
  // For development and other environments, also use Azure PostgreSQL
  if (process.env.POSTGRES_USERNAME && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_HOST && process.env.POSTGRES_DATABASE) {
    const port = process.env.POSTGRES_PORT || '5432';
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

let pool: any;
let db: ReturnType<typeof drizzle>;

/**
 * Check if Azure authentication is available
 */
async function checkAzureAuthentication(): Promise<boolean> {
  try {
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    
    // Try to get a token to test authentication
    const tokenResponse = await credential.getToken(['https://management.azure.com/.default']);
    return !!tokenResponse?.token;
  } catch (error: any) {
    console.log('Azure authentication not available:', error.message.split('.')[0]);
    return false;
  }
}

/**
 * Get database secrets from Azure Key Vault
 */
async function getDatabaseSecretsFromKeyVault() {
  try {
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');
    
    const credential = new DefaultAzureCredential();
    const vaultName = process.env.AZURE_KEY_VAULT_NAME || 'WiseBondVault';
    const url = `https://${vaultName}.vault.azure.net/`;
    
    const client = new SecretClient(url, credential);
    
    const [host, port, database, username, password] = await Promise.all([
      client.getSecret('postgres-host'),
      client.getSecret('postgres-port'),
      client.getSecret('postgres-database'),
      client.getSecret('postgres-username'),
      client.getSecret('postgres-password')
    ]);
    
    return {
      host: host.value,
      port: parseInt(port.value || '5432'),
      database: database.value,
      username: username.value,
      password: password.value
    };
  } catch (error: any) {
    console.log('Key Vault access failed:', error.message);
    return null;
  }
}

/**
 * Get database configuration using three-tier strategy
 */
async function getDatabaseConfig() {
  console.log('Configuring database connection with three-tier strategy...');
  
  // Check if Azure authentication is available
  const azureAuthAvailable = await checkAzureAuthentication();
  
  if (azureAuthAvailable) {
    console.log('✓ Azure authentication available');
    
    // TIER 1: Try Key Vault + Azure Authentication
    console.log('Tier 1: Attempting Key Vault + Azure Authentication...');
    try {
      const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
      
      if (keyVaultConfig) {
        console.log('✓ Successfully retrieved database configuration from Key Vault');
        return {
          connectionString: `postgresql://${keyVaultConfig.username}:${keyVaultConfig.password}@${keyVaultConfig.host}:${keyVaultConfig.port}/${keyVaultConfig.database}?sslmode=require`,
          source: 'keyvault_azure_auth',
          tier: 1
        };
      }
    } catch (error) {
      console.log('× Key Vault retrieval failed:', error.message);
    }
    
    // TIER 2: Azure Authentication + Hardcoded values
    console.log('Tier 2: Using Azure Authentication + Hardcoded values...');
    const hardcodedConfig = {
      host: 'wisebond-server.postgres.database.azure.com',
      port: 5432,
      database: 'postgres',
      username: 'elandre',
      password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
    };
    
    console.log('✓ Using hardcoded configuration with Azure Authentication');
    return {
      connectionString: `postgresql://${hardcodedConfig.username}:${hardcodedConfig.password}@${hardcodedConfig.host}:${hardcodedConfig.port}/${hardcodedConfig.database}?sslmode=require`,
      source: 'hardcoded_azure_auth',
      tier: 2
    };
  }
  
  // TIER 3: Simple username/password (no Azure authentication)
  console.log('Tier 3: Using simple username/password method...');
  
  // Try environment variables first
  if (process.env.DATABASE_URL) {
    console.log('✓ Using DATABASE_URL from environment');
    return {
      connectionString: process.env.DATABASE_URL,
      source: 'environment_simple',
      tier: 3
    };
  }
  
  // Try individual environment variables
  const host = process.env.POSTGRES_HOST || process.env.PGHOST;
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
  const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE;
  const username = process.env.POSTGRES_USERNAME || process.env.PGUSER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  
  if (host && database && username && password) {
    console.log('✓ Using individual environment variables');
    return {
      connectionString: `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`,
      source: 'environment_individual',
      tier: 3
    };
  }
  
  // Final fallback to hardcoded values
  console.log('✓ Using final fallback hardcoded values');
  const fallbackConfig = {
    host: 'wisebond-server.postgres.database.azure.com',
    port: 5432,
    database: 'postgres',
    username: 'elandre',
    password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
  };
  
  return {
    connectionString: `postgresql://${fallbackConfig.username}:${fallbackConfig.password}@${fallbackConfig.host}:${fallbackConfig.port}/${fallbackConfig.database}?sslmode=require`,
    source: 'hardcoded_simple',
    tier: 3
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
      connectionTimeoutMillis: 30000, // Extended for Azure
      ssl: {
        rejectUnauthorized: false // Required for Azure PostgreSQL
      }
    };

    pool = new Pool(poolConfig);
    db = drizzle(pool, { schema });
    
    console.log(`✓ Database initialized using ${config.source} configuration (Tier ${config.tier})`);
    
    // Test the connection
    // Note: We don't test the connection here to avoid circular dependency
    // The test will be done separately when needed
    
    return { pool, db };
    
  } catch (error: any) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

// Initialize database connection with three-tier strategy
async function setupDatabase() {
  console.log('🔄 Setting up Azure database with three-tier authentication strategy...');
  
  let lastError: any;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Initializing database connection...`);
      await initializeDatabase();
      console.log('✅ Database setup completed successfully');
      return;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s delay
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ CRITICAL: All database connection attempts failed');
  console.error('Error details:', lastError.message);
  console.error('Tier 1: Key Vault + Azure Auth');
  console.error('Tier 2: Hardcoded + Azure Auth'); 
  console.error('Tier 3: Simple username/password');
  console.error('Application requires Azure database connection to function.');
  
  // Exit application - no memory storage fallback allowed
  process.exit(1);
}

// Initialize database on module load
setupDatabase().catch(error => {
  console.error('Failed to initialize database:', error.message);
  console.log('Application will continue with limited functionality...');
});

// Function to get database instance (for storage layer)
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

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
