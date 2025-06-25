import pkg, { Client } from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { DefaultAzureCredential } from "@azure/identity";
dotenv.config();

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

  console.log(user);
  console.log(token);
  console.log(database);
  console.log(port);
  console.log(host);
  if (!user || !host || !database) {
    throw new Error("Missing environment variables: AZURE_USER_OBJECT_ID, AZURE_POSTGRESQL_HOST, AZURE_POSTGRESQL_DATABASE");
  }

  return {
    user,
    password: token,
    host,
    database,
    port: Number(port),
    ssl: {
      rejectUnauthorized: false,
    }
  };
};

// Optional: Test connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const poolConfig = await getPoolConfig();
    const client = new Client({
      host: poolConfig.host,
      database:poolConfig.database,
      port: 5432,
      user:poolConfig.user,
      password: poolConfig.password,
      ssl: {
          rejectUnauthorized: true,
      },
  });

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `);

    await client.query(`
      INSERT INTO employees (name, role)
      VALUES 
        ('Alice', 'Developer'),
        ('Bob', 'Designer'),
        ('Charlie', 'Product Manager')
      ON CONFLICT DO NOTHING;
    `);

    const result = await client.query('SELECT current_user');
    console.log('✅ Connected as:', result.rows[0].current_user);
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err);
    return false;
  }
};

// Create pool and db instances with lazy initialization
let pool: any = null;
let db: any = null;

const initializeDatabase = async () => {
  if (!pool) {
    const config = await getPoolConfig();
    pool = new Pool(config);
    db = drizzle(pool, { schema });
  }
  return { pool, db };
};

// Export initialization function and lazy getters
export const getDatabase = async () => {
  await initializeDatabase();
  return { pool, db };
};

export { pool, db };
