import { drizzle } from 'drizzle-orm/postgres-js';
// Force CommonJS import for postgres in production
const postgresModule = await import('postgres');
const postgres = postgresModule.default;
import * as schema from '@shared/schema';
import { getDatabaseSecretsFromKeyVault, checkAzureAuthentication } from './keyVault';

// Global database instance
let db: any = null;
let client: any = null;
let initPromise: Promise<any> | null = null;

// Database connection configuration with three-tier strategy
async function initializeDatabase() {
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
          
          client = postgres(connectionString, {
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
        
        client = postgres(connectionString, {
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

  console.log('🔄 Attempting Tier 3: Fallback to hardcoded/environment credentials');
  
  try {
    // TIER 3: Direct connection with multiple SSL configurations
    const host = 'wisebond-server.postgres.database.azure.com';
    const port = 5432;
    const database = 'postgres';
    const username = 'elandre';
    const password = '*6CsqD325CX#9&HA9q#a5r9^9!8W%F';
    
    console.log(host);
    console.log(port);
    console.log(database);
    console.log(username);
    
    // Try different SSL configurations
    const sslConfigs = [
      { rejectUnauthorized: false, sslmode: 'require' },
      { rejectUnauthorized: true, sslmode: 'require' },
      { rejectUnauthorized: false },
      false
    ];
    
    for (let i = 0; i < sslConfigs.length; i++) {
      const sslConfig = sslConfigs[i];
      console.log(`Trying SSL configuration ${i + 1}:`, sslConfig);
      
      try {
        const connectionOptions = {
          host,
          port,
          database,
          username,
          password,
          ssl: sslConfig,
          max: 20,
          idle_timeout: 30,
          connect_timeout: 10,
          prepare: true,
          max_lifetime: 60 * 30,
          onnotice: () => {},
        };
        
        client = postgres(connectionOptions);
        
        // Test connection
        await client`SELECT 1`;
        
        db = drizzle(client, { schema });
        console.log(`✅ Tier 3 successful with SSL config ${i + 1}`);
        return;
      } catch (error: any) {
        console.log(`SSL config ${i + 1} failed:`, error.message);
        if (client) {
          try {
            await client.end();
          } catch {}
          client = null;
        }
      }
    }
    
    throw new Error('All SSL configurations failed');
  } catch (error: any) {
    console.log('❌ Tier 3 failed:', error.message);
    console.log('Full error details:', error);
    
    console.log('🔥 NETWORK ISSUE: Cannot reach Azure PostgreSQL server');
    console.log('This could be due to:');
    console.log('1. Azure firewall blocking Replit\'s IP ranges');
    console.log('2. Server requires specific SSL certificates');
    console.log('3. Server is in a private network');
    console.log('4. Incorrect server hostname or port');
    
    throw new Error('All connection strategies failed. Application cannot proceed.');
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
