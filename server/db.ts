import pkg from 'pg';
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
    const scope = "https://ossrdbms-aad.database.windows.net/.default";
    const tokenResponse = await credential.getToken(scope);
    return tokenResponse.token;
  } catch (error) {
    console.error('Failed to get Azure token:', error);
    throw error;
  }
}

const getPoolConfig = async () => {
  const token = await getAzureToken();
  const user = "jitendra_eapfs.co.za#EXT#@elandrefourie18gmail.onmicrosoft.com"; // e.g., "fb48e328-aec7-466f-aa8c-a895aadd0aae"
  const host = process.env.AZURE_POSTGRESQL_HOST;
  const database = process.env.AZURE_POSTGRESQL_DATABASE;
  const port = process.env.AZURE_POSTGRESQL_PORT || 5432;

  console.log(user);
  console.log(token);
  console.log(database);
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

// Initialize and export pool
let pool: Pool;
let db;

const initDb = async () => {
  const poolConfig = await getPoolConfig();
  pool = new Pool(poolConfig);
  console.log('Connected to database');
  db = drizzle(pool, { schema });
};

await initDb();

// Optional: Test connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_user');
    client.release();
    
    console.log('✅ Connected as:', result.rows[0].current_user);
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err);
    return false;
  }
};

export { pool, db };
