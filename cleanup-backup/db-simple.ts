import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
dotenv.config(); 

// Simple Azure PostgreSQL connection - properly encode special characters
const dbUrl = 'postgresql://elandre:%2A6CsqD325CX%239%26HA9q%239a5r9%5E9%218W%25F@wisebond-server.postgres.database.azure.com:5432/postgres?sslmode=require';

console.log('Connecting to Azure PostgreSQL database...');

// Simple pool configuration with optimized settings for Azure
const poolConfig = {
  connectionString: dbUrl,
  connectionTimeoutMillis: 60000, // 60 seconds to connect (Azure needs more time)
  idleTimeoutMillis: 300000, // 5 minutes idle timeout
  max: 5, // Reduced pool size for better connection management
  min: 1, // Keep at least one connection alive
  acquireTimeoutMillis: 60000, // Time to wait for a connection from pool
  createTimeoutMillis: 60000, // Time to wait for connection creation
  destroyTimeoutMillis: 5000, // Time to wait for connection destruction
  createRetryIntervalMillis: 200, // Wait between connection attempts
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates for Azure
  },
  // Azure-specific optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};

const pool = new Pool(poolConfig);
const db = drizzle(pool, { schema });

// Simple connection test
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Export the initialized instances
export { pool, db };