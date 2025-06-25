#!/usr/bin/env node

/**
 * Test script to verify Azure Key Vault integration for PostgreSQL database connections
 * This script tests both Key Vault-based and hardcoded connection methods
 */

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables
dotenv.config();

// Azure Key Vault configuration
const KEY_VAULT_URL = "https://wisebondvault.vault.azure.net/";

/**
 * Test database connection using Azure Key Vault secrets
 */
async function testKeyVaultConnection() {
    console.log('\n=== Testing Azure Key Vault Database Connection ===');
    
    try {
        // Initialize Azure credentials and Key Vault client
        console.log('1. Initializing Azure Key Vault client...');
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(KEY_VAULT_URL, credential);
        
        // Retrieve database connection secrets from Key Vault
        console.log('2. Retrieving database connection secrets from Key Vault...');
        
        const secrets = {
            host: await client.getSecret("postgres-host"),
            port: await client.getSecret("postgres-port"),
            database: await client.getSecret("postgres-database"),
            username: await client.getSecret("postgres-username"),
            password: await client.getSecret("postgres-password")
        };
        
        console.log('✓ Successfully retrieved secrets from Key Vault');
        console.log(`  - Host: ${secrets.host.value}`);
        console.log(`  - Port: ${secrets.port.value}`);
        console.log(`  - Database: ${secrets.database.value}`);
        console.log(`  - Username: ${secrets.username.value}`);
        console.log(`  - Password: [REDACTED - ${secrets.password.value?.length} characters]`);
        
        // Create database connection string
        const connectionConfig = {
            host: secrets.host.value,
            port: parseInt(secrets.port.value),
            database: secrets.database.value,
            user: secrets.username.value,
            password: secrets.password.value,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000
        };
        
        console.log('3. Testing database connection...');
        
        // Test the connection
        const pool = new Pool(connectionConfig);
        const client = await pool.connect();
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✓ Database connection successful!');
        console.log(`  - Current time: ${result.rows[0].current_time}`);
        console.log(`  - PostgreSQL version: ${result.rows[0].postgres_version}`);
        
        // Clean up
        client.release();
        await pool.end();
        
        return {
            success: true,
            config: connectionConfig,
            testResult: result.rows[0]
        };
        
    } catch (error) {
        console.error('✗ Key Vault connection test failed:');
        console.error(`  Error: ${error.message}`);
        
        if (error.code) {
            console.error(`  Code: ${error.code}`);
        }
        
        if (error.statusCode) {
            console.error(`  Status Code: ${error.statusCode}`);
        }
        
        return {
            success: false,
            error: error.message,
            details: {
                code: error.code,
                statusCode: error.statusCode
            }
        };
    }
}

/**
 * Test database connection using hardcoded values for comparison
 */
async function testHardcodedConnection() {
    console.log('\n=== Testing Hardcoded Database Connection ===');
    
    try {
        // Hardcoded connection configuration for comparison
        // These should match your actual Azure PostgreSQL values
        const connectionConfig = {
            host: "wisebond-server.postgres.database.azure.com",
            port: 5432,
            database: "wisebond",
            user: "wisebond_admin",
            password: process.env.POSTGRES_PASSWORD || "placeholder_password", // Use env var if available
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000
        };
        
        console.log('1. Using hardcoded connection configuration...');
        console.log(`  - Host: ${connectionConfig.host}`);
        console.log(`  - Port: ${connectionConfig.port}`);
        console.log(`  - Database: ${connectionConfig.database}`);
        console.log(`  - Username: ${connectionConfig.user}`);
        console.log(`  - Password: [REDACTED - ${connectionConfig.password.length} characters]`);
        
        console.log('2. Testing database connection...');
        
        // Test the connection
        const pool = new Pool(connectionConfig);
        const client = await pool.connect();
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✓ Database connection successful!');
        console.log(`  - Current time: ${result.rows[0].current_time}`);
        console.log(`  - PostgreSQL version: ${result.rows[0].postgres_version}`);
        
        // Clean up
        client.release();
        await pool.end();
        
        return {
            success: true,
            config: connectionConfig,
            testResult: result.rows[0]
        };
        
    } catch (error) {
        console.error('✗ Hardcoded connection test failed:');
        console.error(`  Error: ${error.message}`);
        
        if (error.code) {
            console.error(`  Code: ${error.code}`);
        }
        
        return {
            success: false,
            error: error.message,
            details: {
                code: error.code
            }
        };
    }
}

/**
 * Compare both connection methods
 */
async function compareConnections(keyVaultResult, hardcodedResult) {
    console.log('\n=== Connection Comparison ===');
    
    if (keyVaultResult.success && hardcodedResult.success) {
        console.log('✓ Both connection methods successful!');
        
        // Compare configurations
        const kvConfig = keyVaultResult.config;
        const hcConfig = hardcodedResult.config;
        
        console.log('\nConfiguration Comparison:');
        console.log(`Host: KV(${kvConfig.host}) vs HC(${hcConfig.host}) - ${kvConfig.host === hcConfig.host ? '✓ Match' : '✗ Different'}`);
        console.log(`Port: KV(${kvConfig.port}) vs HC(${hcConfig.port}) - ${kvConfig.port === hcConfig.port ? '✓ Match' : '✗ Different'}`);
        console.log(`Database: KV(${kvConfig.database}) vs HC(${hcConfig.database}) - ${kvConfig.database === hcConfig.database ? '✓ Match' : '✗ Different'}`);
        console.log(`Username: KV(${kvConfig.user}) vs HC(${hcConfig.user}) - ${kvConfig.user === hcConfig.user ? '✓ Match' : '✗ Different'}`);
        
    } else if (keyVaultResult.success && !hardcodedResult.success) {
        console.log('✓ Key Vault connection successful, hardcoded failed');
        console.log('This suggests Key Vault has correct credentials that differ from hardcoded values');
        
    } else if (!keyVaultResult.success && hardcodedResult.success) {
        console.log('✗ Key Vault connection failed, hardcoded successful');
        console.log('This suggests an issue with Key Vault configuration or credentials');
        
    } else {
        console.log('✗ Both connection methods failed');
        console.log('This suggests a broader connectivity or configuration issue');
    }
}

/**
 * List available secrets in Key Vault for debugging
 */
async function listKeyVaultSecrets() {
    console.log('\n=== Listing Key Vault Secrets ===');
    
    try {
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(KEY_VAULT_URL, credential);
        
        console.log('Available secrets in WiseBondVault:');
        
        const secretsIterator = client.listPropertiesOfSecrets();
        const secrets = [];
        
        for await (const secretProperties of secretsIterator) {
            secrets.push(secretProperties.name);
            console.log(`  - ${secretProperties.name} (enabled: ${secretProperties.enabled})`);
        }
        
        if (secrets.length === 0) {
            console.log('  No secrets found in Key Vault');
        }
        
        return secrets;
        
    } catch (error) {
        console.error('✗ Failed to list Key Vault secrets:');
        console.error(`  Error: ${error.message}`);
        return [];
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('WiseBond Azure Key Vault Database Connection Test');
    console.log('==============================================');
    
    // Check environment and authentication
    console.log('\nEnvironment Check:');
    console.log(`Azure Tenant ID: ${process.env.AZURE_TENANT_ID || 'Not set'}`);
    console.log(`Azure Client ID: ${process.env.AZURE_CLIENT_ID || 'Not set'}`);
    console.log(`Key Vault URL: ${KEY_VAULT_URL}`);
    
    // List available secrets first
    const availableSecrets = await listKeyVaultSecrets();
    
    // Test both connection methods
    const keyVaultResult = await testKeyVaultConnection();
    const hardcodedResult = await testHardcodedConnection();
    
    // Compare results
    await compareConnections(keyVaultResult, hardcodedResult);
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Key Vault connection: ${keyVaultResult.success ? '✓ Success' : '✗ Failed'}`);
    console.log(`Hardcoded connection: ${hardcodedResult.success ? '✓ Success' : '✗ Failed'}`);
    console.log(`Available secrets: ${availableSecrets.length}`);
    
    if (!keyVaultResult.success) {
        console.log('\nTroubleshooting Tips:');
        console.log('1. Ensure you are authenticated to Azure (az login)');
        console.log('2. Verify you have access to the WiseBondVault Key Vault');
        console.log('3. Check that the required secrets exist with correct names:');
        console.log('   - postgres-host');
        console.log('   - postgres-port');
        console.log('   - postgres-database');
        console.log('   - postgres-username');
        console.log('   - postgres-password');
        console.log('4. Ensure your Azure identity has "Key Vault Secrets User" role');
    }
    
    process.exit(keyVaultResult.success ? 0 : 1);
}

// Execute the main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});