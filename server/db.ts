import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@shared/schema';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import dotenv from 'dotenv';
dotenv.config();

let db: ReturnType<typeof drizzle> | null = null;

// export async function getPostgresClient() {
//     if (client && db) {
//         return db;
//     }

//     const credential = new ManagedIdentityCredential();
//     const host = process.env["database_host"]?.trim();
//     const database = process.env["database_name"]?.trim();
//     const user = process.env["database_user"]?.trim();
//     const port = parseInt(process.env["database_port"]?.trim() || "5432", 10);
 
//     console.log(host)
//     console.log(database)
//     console.log(port)
//     console.log(user)
 
//     const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
//     const password = tokenResponse.token;
  
//     client = new Client({
//         host,
//         database,
//         port,
//         user,
//         password,
//         ssl: {
//             rejectUnauthorized: true,
//         },
//     });
 
//     await client.connect();

//     console.log("Connected to database");
    
//     // Create Drizzle instance with the connected client
//     db = drizzle(client, { schema });
    
//     return db;
// }

async function getPostgresClientTiered() {
    if (db) return db;

    console.log("🔄 Attempting Tier 1: Azure Key Vault");

    // Tier 1: Key Vault + Default Azure Credential
    try {
        const credential = new ManagedIdentityCredential();
        const vaultName = process.env.AZURE_KEY_VAULT_NAME || 'wisebondvault';
        const url = `https://${vaultName}.vault.azure.net/`;
        const secretClient = new SecretClient(url, credential);
        
        console.log(url);

        const [host, port, database, user, password] = await Promise.all([
            secretClient.getSecret("database-host"),
            secretClient.getSecret("database-port"),
            secretClient.getSecret("database-name"),
            secretClient.getSecret("database-username"),
            secretClient.getSecret("database-password")
        ]);

        console.log(host.value)
        console.log(port.value)
        console.log(database.value)
        console.log(user.value)        
    
        const client = new Client({
            host: host.value,
            port: parseInt(port.value || "5432", 10),
            database: database.value,
            user: user.value,
            password: password.value,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log("✅ Tier 1: Connected using Key Vault secrets");
        db = drizzle(client, { schema });
        return db;

    } catch (error: any) {
        console.warn("⚠️ Tier 1 failed:", error.message);
    }

    console.log("🔄 Attempting Tier 2: Managed Identity Credential");

    // Tier 2: Managed Identity
    try {
        const credential = new ManagedIdentityCredential();
        const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
        const password = tokenResponse.token;

        const host = process.env["database_host"]?.trim();
        const port = parseInt(process.env["database_port"]?.trim() || "5432", 10);
        const database = process.env["database_name"]?.trim();
        const user = process.env["database_user"]?.trim();

        console.log(host)
        console.log(port)
        console.log(database)
        console.log(user)        

        const client = new Client({
            host,
            port,
            database,
            user,
            password,
            ssl: { rejectUnauthorized: true }
        });

        await client.connect();
        console.log("✅ Tier 2: Connected using Managed Identity");
        db = drizzle(client, { schema });
        return db;
    } catch (e) {
        const error = e as Error;
        console.warn("⚠️ Tier 2 failed:", error.message);
    }

    console.log("🔄 Attempting Tier 3: Fallback to hardcoded/environment credentials");

    // Tier 3: Hardcoded or env
    try {
        const host = process.env.POSTGRES_HOST || 'wisebond-server.postgres.database.azure.com';
        const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
        const database = process.env.POSTGRES_DATABASE || 'postgres';
        const user = process.env.POSTGRES_USERNAME || 'elandre';
        const password = process.env.POSTGRES_PASSWORD || '*6CsqD325CX#9&HA9q#a5r9^9!8W%F';

        console.log(host)
        console.log(port)
        console.log(database)
        console.log(user)  

        const client = new Client({
            host,
            port,
            database,
            user,
            password,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log("✅ Tier 3: Connected using fallback credentials");
        db = drizzle(client, { schema });
        return db;
    } catch (e) {
        const error = e as Error;
        console.error("❌ Tier 3 failed:", error.message);
        throw new Error("All connection strategies failed. Application cannot proceed.");
    }
}

// Export with both names for backward compatibility
export const getPostgresClient = getPostgresClientTiered;
