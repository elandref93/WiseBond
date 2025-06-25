import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
dotenv.config(); 

// Simple Azure PostgreSQL connection - hardcoded for now
const dbUrl = 'postgresql://elandre:*6CsqD325CX#9&HA9q#a5r9^9!8W%F@wisebond-server.postgres.database.azure.com:5432/postgres?sslmode=require';

console.log('Connecting to Azure PostgreSQL database...');

// Simple pool configuration
const poolConfig = {
  connectionString: dbUrl,
  connectionTimeoutMillis: 30000, // 30 seconds to connect
  idleTimeoutMillis: 60000, // 60 seconds idle timeout
  max: 10, // maximum pool size
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates for Azure
  }
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