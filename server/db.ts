import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.POSTGRES_USERNAME || 'elandre'}:${process.env.POSTGRES_PASSWORD || '*6CsqD325CX#9&HA9q#a5r9^9!8W%F'}@${process.env.POSTGRES_HOST || 'wisebond-server.postgres.database.azure.com'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DATABASE || 'postgres'}?sslmode=require`;

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: { rejectUnauthorized: false }
});

// Create drizzle instance
const db = drizzle(client, { schema });

export { db, client };
export * from '@shared/schema';

// Legacy function for backward compatibility
export async function getPostgresClient() {
  return db;
}
