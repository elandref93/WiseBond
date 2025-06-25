#!/usr/bin/env node

/**
 * Test both Key Vault and hardcoded database connections
 */

import { Pool } from 'pg';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const KEY_VAULT_URL = "https://wisebondvault.vault.azure.net/";

async function getKeyVaultDatabaseConfig() {
    try {
        console.log('Retrieving database configuration from Key Vault...');
        
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(KEY_VAULT_URL, credential);
        
        const [host, port, database, username, password] = await Promise.all([
            client.getSecret('postgres-host'),
            client.getSecret('postgres-port'),
            client.getSecret('postgres-database'),
            client.getSecret('postgres-username'),
            client.getSecret('postgres-password')
        ]);
        
        if (!host.value || !port.value || !database.value || !username.value || !password.value) {
            throw new Error('One or more required secrets are missing');
        }
        
        return {
            host: host.value,
            port: parseInt(port.value),
            database: database.value,
            user: username.value,
            password: password.value,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        };
        
    } catch (error) {
        console.error('Failed to get Key Vault database config:', error.message);
        return null;
    }
}

async function testDatabaseConnection(config, label) {
    try {
        console.log(`\n${label}:`);
        console.log(`  Host: ${config.host}`);
        console.log(`  Port: ${config.port}`);
        console.log(`  Database: ${config.database}`);
        console.log(`  User: ${config.user}`);
        console.log(`  Password: [${config.password.length} characters]`);
        
        const pool = new Pool(config);
        const client = await pool.connect();
        
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        
        console.log('  ✓ Connection successful!');
        console.log(`  ✓ Current time: ${result.rows[0].current_time}`);
        console.log(`  ✓ PostgreSQL: ${result.rows[0].postgres_version.split(' ')[0]}`);
        
        client.release();
        await pool.end();
        
        return true;
        
    } catch (error) {
        console.log('  ✗ Connection failed!');
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('Database Connection Comparison Test');
    console.log('==================================');
    
    // Test Key Vault configuration
    console.log('\n1. Testing Key Vault database configuration...');
    const keyVaultConfig = await getKeyVaultDatabaseConfig();
    
    let keyVaultSuccess = false;
    if (keyVaultConfig) {
        keyVaultSuccess = await testDatabaseConnection(keyVaultConfig, 'Key Vault Configuration');
    } else {
        console.log('  ✗ Could not retrieve Key Vault configuration');
    }
    
    // Test hardcoded/environment configuration
    console.log('\n2. Testing hardcoded/environment database configuration...');
    
    // Use environment variables if available, otherwise use placeholders
    const hardcodedConfig = {
        host: process.env.POSTGRES_HOST || 'wisebond-server.postgres.database.azure.com',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'wisebond',
        user: process.env.POSTGRES_USERNAME || 'wisebond_admin',
        password: process.env.POSTGRES_PASSWORD || 'placeholder_password',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    };
    
    const hardcodedSuccess = await testDatabaseConnection(hardcodedConfig, 'Hardcoded/Environment Configuration');
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Key Vault connection: ${keyVaultSuccess ? '✓ Success' : '✗ Failed'}`);
    console.log(`Hardcoded connection: ${hardcodedSuccess ? '✓ Success' : '✗ Failed'}`);
    
    if (keyVaultSuccess && hardcodedSuccess) {
        console.log('\n🎉 Both connection methods work!');
        
        // Compare configurations if both successful
        if (keyVaultConfig) {
            console.log('\nConfiguration comparison:');
            console.log(`Host: ${keyVaultConfig.host === hardcodedConfig.host ? '✓ Match' : '✗ Different'}`);
            console.log(`Port: ${keyVaultConfig.port === hardcodedConfig.port ? '✓ Match' : '✗ Different'}`);
            console.log(`Database: ${keyVaultConfig.database === hardcodedConfig.database ? '✓ Match' : '✗ Different'}`);
            console.log(`User: ${keyVaultConfig.user === hardcodedConfig.user ? '✓ Match' : '✗ Different'}`);
        }
    } else if (keyVaultSuccess && !hardcodedSuccess) {
        console.log('\n✓ Key Vault has correct credentials, hardcoded values need updating');
    } else if (!keyVaultSuccess && hardcodedSuccess) {
        console.log('\n⚠ Key Vault may have incorrect credentials or access issues');
    } else {
        console.log('\n❌ Both methods failed - check database server and credentials');
    }
    
    if (!keyVaultSuccess) {
        console.log('\nNext steps for Key Vault:');
        console.log('1. Verify Azure authentication: az login');
        console.log('2. Check Key Vault access permissions');
        console.log('3. Ensure all required secrets exist in WiseBondVault:');
        console.log('   - postgres-host');
        console.log('   - postgres-port');
        console.log('   - postgres-database');
        console.log('   - postgres-username');
        console.log('   - postgres-password');
    }
    
    process.exit(keyVaultSuccess ? 0 : 1);
}

main().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
});