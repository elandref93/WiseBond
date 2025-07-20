import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.POSTGRES_USERNAME || 'elandre'}:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '*6CsqD325CX#9&HA9q#a5r9^9!8W%F')}@${process.env.POSTGRES_HOST || 'wisebond-server.postgres.database.azure.com'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DATABASE || 'postgres'}?sslmode=require`;

// Create postgres client with Node.js 22 optimizations
const client = postgres(connectionString, {
  max: 20, // Increased for better performance
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: { rejectUnauthorized: false },
  prepare: true, // Enable prepared statements for better performance
  max_lifetime: 60 * 30, // 30 minutes
  onnotice: () => {}, // Suppress notices for cleaner logs
});

// Create drizzle instance
const db = drizzle(client, { schema });

export { db, client };
export * from '@shared/schema';

// Legacy function for backward compatibility
export async function getPostgresClient() {
  return db;
}
