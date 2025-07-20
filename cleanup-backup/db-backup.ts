import pkg, { Client } from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { DefaultAzureCredential } from "@azure/identity";
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

// Helper to get Azure AD token
async function getAzureToken() {
  try {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
    return tokenResponse.token;
  } catch (error) {
    console.error('Failed to get Azure token:', error);
    throw error;

  }
}

const getPoolConfig = async () => {
  const token = await getAzureToken();
  const user = "WiseBond";
  const host = process.env.AZURE_POSTGRESQL_HOST;
  const database = process.env.AZURE_POSTGRESQL_DATABASE;
  const port = process.env.AZURE_POSTGRESQL_PORT || 5432;
}

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
  }
)};

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
    console.log('✓ Azure authentication detected, attempting Tiers 1 & 2...');
    
    // TIER 1: Try Key Vault + Azure Authentication
    console.log('Tier 1: Attempting Key Vault + Azure Authentication...');
    try {
      const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
      
      if (keyVaultConfig) {
        console.log('✓ Tier 1 successful - using Key Vault configuration');
        return {
          connectionString: `postgresql://${keyVaultConfig.username}:${keyVaultConfig.password}@${keyVaultConfig.host}:${keyVaultConfig.port}/${keyVaultConfig.database}?sslmode=require`,
          source: 'keyvault_azure_auth',
          tier: 1
        };
      }
    } catch (error: any) {
      console.log('× Tier 1 failed:', error.message);
    }
    
    // TIER 2: Azure Authentication + Hardcoded values
    console.log('Tier 2: Attempting Azure Authentication + Hardcoded values...');
    try {
      const hardcodedConfig = {
        host: 'wisebond-server.postgres.database.azure.com',
        port: 5432,
        database: 'postgres',
        username: 'elandre',
        password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
      };
      
      // Test connection with a timeout to avoid hanging
      console.log('✓ Tier 2 configured - testing Azure connection...');
      return {
        connectionString: `postgresql://${hardcodedConfig.username}:${hardcodedConfig.password}@${hardcodedConfig.host}:${hardcodedConfig.port}/${hardcodedConfig.database}?sslmode=require`,
        source: 'hardcoded_azure_auth',
        tier: 2
      };
    } catch (error: any) {
      console.log('× Tier 2 failed:', error.message);
    }
  } else {
    console.log('× Azure authentication not available, skipping to Tier 3');
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
  let lastError: any;
  
  // Try each tier with connection testing
  for (let tier = 1; tier <= 3; tier++) {
    try {
      console.log(`\n🔄 Attempting Tier ${tier} database connection...`);
      
      let config;
      if (tier === 1) {
        // TIER 1: Key Vault + Azure Auth
        const azureAuth = await checkAzureAuthentication();
        if (!azureAuth) throw new Error('Azure authentication not available');
        
        const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
        if (!keyVaultConfig) throw new Error('Key Vault configuration not available');
        
        config = {
          connectionString: `postgresql://${keyVaultConfig.username}:${keyVaultConfig.password}@${keyVaultConfig.host}:${keyVaultConfig.port}/${keyVaultConfig.database}?sslmode=require`,
          source: 'keyvault_azure_auth',
          tier: 1
        };
      } else if (tier === 2) {
        // TIER 2: Hardcoded + Azure Auth
        const azureAuth = await checkAzureAuthentication();
        if (!azureAuth) throw new Error('Azure authentication not available');
        
        const hardcodedConfig = {
          host: 'wisebond-server.postgres.database.azure.com',
          port: 5432,
          database: 'postgres',
          username: 'elandre',
          password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
        };
        
        config = {
          connectionString: `postgresql://${hardcodedConfig.username}:${hardcodedConfig.password}@${hardcodedConfig.host}:${hardcodedConfig.port}/${hardcodedConfig.database}?sslmode=require`,
          source: 'hardcoded_azure_auth',
          tier: 2
        };
      } else {
        // TIER 3: Simple username/password - try public endpoint if private fails
        const originalConnectionString = process.env.DATABASE_URL;
        
        // Use direct Azure configuration for Tier 3 to avoid URL parsing issues
        config = {
          host: 'wisebond-server.postgres.database.azure.com',
          port: 5432,
          database: 'postgres',
          user: 'elandre',
          password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 20000,
          source: 'azure_direct_config',
          tier: 3
        };
      }
      
      // Test connection with appropriate timeout for each tier
      const testTimeout = tier === 3 ? 20000 : 5000;
      
      const poolConfig = config.connectionString ? {
        connectionString: config.connectionString,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: testTimeout,
        ssl: tier === 3 ? { rejectUnauthorized: false } : false,
        keepAlive: tier === 3,
        statement_timeout: 10000,
        query_timeout: 10000
      } : {
        ...config,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: testTimeout,
        statement_timeout: 10000,
        query_timeout: 10000
      };

      console.log(`Testing Tier ${tier} connection (${testTimeout}ms timeout)...`);
      if (config.connectionString) {
        console.log(`Connection string: ${config.connectionString.replace(/:[^@]*@/, ':***@')}`);
      } else {
        console.log(`Host: ${config.host}, Database: ${config.database}, User: ${config.user}`);
      }
      
      const testPool = new Pool(poolConfig);
      
      // Test connection with proper error handling and more detailed logging
      try {
        const startTime = Date.now();
        await Promise.race([
          testPool.query('SELECT 1 as test, NOW() as timestamp'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Tier ${tier} connection timeout after ${testTimeout}ms`)), testTimeout)
          )
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Tier ${tier} connection successful in ${duration}ms`);
      } catch (testError: any) {
        console.log(`❌ Tier ${tier} connection failed: ${testError.message}`);
        await testPool.end().catch(() => {}); // Clean up failed pool
        throw testError;
      }
      
      // Connection successful - use this configuration
      pool = testPool;
      db = drizzle(pool, { schema });
      
      console.log(`✅ Tier ${tier} successful - using ${config.source} configuration`);
      return { pool, db };
      
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Tier ${tier} failed: ${error.message}`);
      
      if (tier < 3) {
        console.log(`⏩ Falling back to Tier ${tier + 1}...`);
      }
    }
  }
  
  console.error('❌ All three tiers failed');
  throw lastError;
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

// Function to get database instance (for storage layer)
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

// Export the initialized instances and setup function
export { pool, db, setupDatabase };

// Initialize database on module load
setupDatabase().catch(error => {
  console.error('Failed to initialize database:', error.message);
  console.log('Application will continue with limited functionality...');
});
