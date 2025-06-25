import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Robust database connection with multiple retry strategies
let db: any = null;
let connectionPool: any = null;

// Database configuration with extended timeouts for Azure
const createPoolConfig = (connectionString: string) => ({
  connectionString,
  connectionTimeoutMillis: 120000, // 2 minutes for Azure
  idleTimeoutMillis: 600000, // 10 minutes idle timeout
  max: 3, // Small pool size for reliability
  min: 0, // No minimum connections
  acquireTimeoutMillis: 120000, // 2 minutes to get connection from pool
  createTimeoutMillis: 120000, // 2 minutes for connection creation
  destroyTimeoutMillis: 10000, // 10 seconds for cleanup
  createRetryIntervalMillis: 1000, // 1 second between retry attempts
  ssl: {
    rejectUnauthorized: false // Accept Azure certificates
  },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  query_timeout: 60000, // 1 minute query timeout
  statement_timeout: 60000 // 1 minute statement timeout
});

// Multiple connection strategies for Azure PostgreSQL
async function initializeDatabase() {
  const strategies = [
    {
      name: 'Direct Azure Connection',
      url: 'postgresql://elandre:%2A6CsqD325CX%239%26HA9q%239a5r9%5E9%218W%25F@wisebond-server.postgres.database.azure.com:5432/postgres?sslmode=require&connect_timeout=120'
    },
    {
      name: 'Environment DATABASE_URL',
      url: process.env.DATABASE_URL
    }
  ];

  for (const strategy of strategies) {
    if (!strategy.url) continue;
    
    console.log(`Attempting ${strategy.name}...`);
    
    try {
      const pool = new Pool(createPoolConfig(strategy.url));
      
      // Test connection with timeout
      const testConnection = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);
      
      if (testConnection) {
        // Release test connection
        (testConnection as any).release();
        
        // Create Drizzle instance
        db = drizzle(pool, { schema });
        connectionPool = pool;
        
        console.log(`✅ Database connected using ${strategy.name}`);
        return true;
      }
    } catch (error) {
      console.log(`❌ ${strategy.name} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All database connection strategies failed');
}

// Retry wrapper for database operations
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError!;
}

// Initialize database connection
let initPromise: Promise<boolean> | null = null;

export async function getDatabase() {
  if (db) return db;
  
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  
  await initPromise;
  return db;
}

// Export wrapped database operations
export { withRetry };

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (connectionPool) {
    await connectionPool.end();
    console.log('Database pool closed');
  }
});

process.on('SIGINT', async () => {
  if (connectionPool) {
    await connectionPool.end();
    console.log('Database pool closed');
  }
  process.exit(0);
});