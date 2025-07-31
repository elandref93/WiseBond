import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';
import { getDatabaseSecretsFromKeyVault, checkAzureAuthentication } from './keyVault';

// Global database instance
let db: any = null;
let client: any = null;
let initPromise: Promise<any> | null = null;
let postgres: any = null;

// Import postgres with ES module compatibility fix
async function importPostgres() {
  if (postgres) return postgres;
  
  try {
    // Try ES module import first
    const postgresModule = await import('postgres');
    postgres = postgresModule.default || postgresModule;
    return postgres;
  } catch (error) {
    // Fallback to CommonJS import for compatibility
    try {
      const postgresModule = await import('postgres/cjs/src/index.js');
      postgres = postgresModule.default || postgresModule;
      return postgres;
    } catch (fallbackError) {
      console.error('Failed to import postgres module:', error, fallbackError);
      throw new Error('Unable to import postgres module. Please check package installation.');
    }
  }
}

// Database connection configuration with three-tier strategy
async function initializeDatabase() {
  // Initialize postgres import
  const postgresClient = await importPostgres();
  
  // Always use Azure PostgreSQL - no in-memory fallback
  console.log('🗄️ Connecting to Azure PostgreSQL database...');
  
  // Only attempt Azure Key Vault in cloud environments
  if (process.env.WEBSITE_SITE_NAME || process.env.AZURE_WEBAPP_NAME) {
    console.log('🔄 Attempting Tier 1: Azure Key Vault');
    
    try {
      // TIER 1: Key Vault + Azure Auth
      const azureAuth = await checkAzureAuthentication();
      if (azureAuth) {
        const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
        if (keyVaultConfig) {
          const connectionString = `postgresql://${keyVaultConfig.username}:${encodeURIComponent(keyVaultConfig.password)}@${keyVaultConfig.host}:${keyVaultConfig.port}/${keyVaultConfig.database}?sslmode=require`;
          
          client = postgresClient(connectionString, {
            max: 20,
            idle_timeout: 30,
            connect_timeout: 10,
            ssl: { rejectUnauthorized: false },
            prepare: true,
            max_lifetime: 60 * 30,
            onnotice: () => {},
          });
          
          db = drizzle(client, { schema });
          console.log('✅ Tier 1 successful: Key Vault + Azure Auth');
          return;
        }
      }
    } catch (error: any) {
      console.log('⚠️ Tier 1 failed:', error.message);
    }
  } else {
    console.log('🔄 Skipping Tier 1: Azure Key Vault (local development)');
  }

  // Only attempt Azure authentication in cloud environments
  if (process.env.WEBSITE_SITE_NAME || process.env.AZURE_WEBAPP_NAME) {
    console.log('🔄 Attempting Tier 2: Managed Identity Credential');
    
    try {
      // TIER 2: Hardcoded + Azure Auth
      const azureAuth = await checkAzureAuthentication();
      if (azureAuth) {
        // Try to get from Key Vault first, then fallback to hardcoded
        const keyVaultConfig = await getDatabaseSecretsFromKeyVault();
        const hardcodedConfig = keyVaultConfig || {
          host: 'wisebond-server.postgres.database.azure.com',
          port: 5432,
          database: 'postgres',
          username: 'elandre',
          password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
        };
        
        const connectionString = `postgresql://${hardcodedConfig.username}:${encodeURIComponent(hardcodedConfig.password)}@${hardcodedConfig.host}:${hardcodedConfig.port}/${hardcodedConfig.database}?sslmode=require`;
        
        client = postgresClient(connectionString, {
          max: 20,
          idle_timeout: 30,
          connect_timeout: 10,
          ssl: { rejectUnauthorized: false },
          prepare: true,
          max_lifetime: 60 * 30,
          onnotice: () => {},
        });
        
        db = drizzle(client, { schema });
        console.log('✅ Tier 2 successful: Hardcoded + Azure Auth');
        return;
      }
    } catch (error: any) {
      console.log('⚠️ Tier 2 failed:', error.message);
    }
  } else {
    console.log('🔄 Skipping Tier 2: Managed Identity (local development)');
  }

  // TIER 3: Environment Variables (for local development)
  console.log('🔄 Attempting Tier 3: Environment Variables');
  
  try {
    // Check if we have DATABASE_URL from environment
    if (process.env.DATABASE_URL) {
      client = postgresClient(process.env.DATABASE_URL, {
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
        ssl: { rejectUnauthorized: false },
        prepare: true,
        max_lifetime: 60 * 30,
        onnotice: () => {},
      });
      
      db = drizzle(client, { schema });
      console.log('✅ Tier 3 successful: Environment Variables');
      return;
    }
    
    // Fallback to hardcoded Azure PostgreSQL for local development
    console.log('🔄 Using hardcoded Azure PostgreSQL for local development');
    const hardcodedConfig = {
      host: 'wisebond-server.postgres.database.azure.com',
      port: 5432,
      database: 'postgres',
      username: 'elandre',
      password: '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'
    };
    
    const connectionString = `postgresql://${hardcodedConfig.username}:${encodeURIComponent(hardcodedConfig.password)}@${hardcodedConfig.host}:${hardcodedConfig.port}/${hardcodedConfig.database}?sslmode=require`;
    
    client = postgresClient(connectionString, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: { rejectUnauthorized: false },
      prepare: true,
      max_lifetime: 60 * 30,
      onnotice: () => {},
    });
    
    db = drizzle(client, { schema });
    console.log('✅ Tier 3 successful with hardcoded Azure PostgreSQL');
    
  } catch (error: any) {
    console.error('❌ All database connection tiers failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function getDatabase() {
  if (db) return db;
  
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  
  await initPromise;
  return db;
}

// Legacy function for backward compatibility
export async function getPostgresClient() {
  return await getDatabase();
}

export { db, client };
export * from '@shared/schema';
