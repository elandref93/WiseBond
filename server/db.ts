const { ManagedIdentityCredential } = require("@azure/identity");
const { Client } = require("pg");
 
export async function getPostgresClient() {
    const credential = new ManagedIdentityCredential();
    const host = process.env["database_host"]?.trim();
    const database = process.env["database_name"]?.trim();
    const user = process.env["database_user"]?.trim();
    const port = process.env["database_port"]?.trim();
 
    console.log(host)
    console.log(database)
    console.log(port)
    console.log(user)
 
    const tokenResponse = await credential.getToken("https://ossrdbms-aad.database.windows.net");
    const password = tokenResponse.token;
  
    const client = new Client({
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
    return client;
}