import { ManagedIdentityCredential } from "@azure/identity";
import { Client } from "pg";
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Create a global database instance
let db: ReturnType<typeof drizzle> | null = null;
let client: Client | null = null;

export async function getPostgresClient() {
    if (client && db) {
        return db;
    }

    const credential = new ManagedIdentityCredential();
    const host = process.env["database_host"]?.trim();
    const database = process.env["database_name"]?.trim();
    const user = process.env["database_user"]?.trim();
    const port = parseInt(process.env["database_port"]?.trim() || "5432", 10);
 
    console.log(host)
    console.log(database)
    console.log(port)
    console.log(user)
 
    const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
    const password = tokenResponse.token;
  
    client = new Client({
        host,
        database,
        port,
        user,
        password,
        ssl: {
            rejectUnauthorized: true,
        },
    });
 
    await client.connect();

    console.log("Connected to database");
    
    // Create Drizzle instance with the connected client
    db = drizzle(client, { schema });
    
    return db;
}