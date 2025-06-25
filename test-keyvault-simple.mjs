#!/usr/bin/env node

/**
 * Simple Key Vault connectivity test
 */

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const KEY_VAULT_URL = "https://wisebondvault.vault.azure.net/";

async function testKeyVaultAccess() {
    console.log('Testing WiseBondVault Access');
    console.log('============================\n');
    
    try {
        console.log('1. Initializing Azure credentials...');
        const credential = new DefaultAzureCredential();
        
        console.log('2. Creating Key Vault client...');
        const client = new SecretClient(KEY_VAULT_URL, credential);
        
        console.log('3. Testing Key Vault connectivity...');
        
        // Try to list secrets to test connectivity
        console.log('4. Listing available secrets...');
        const secrets = [];
        
        for await (const secretProperties of client.listPropertiesOfSecrets()) {
            secrets.push({
                name: secretProperties.name,
                enabled: secretProperties.enabled,
                createdOn: secretProperties.createdOn
            });
            console.log(`   - ${secretProperties.name} (enabled: ${secretProperties.enabled})`);
        }
        
        console.log(`\n✓ Successfully connected to WiseBondVault`);
        console.log(`✓ Found ${secrets.length} secrets`);
        
        // Test retrieving a specific secret if it exists
        const requiredSecrets = ['postgres-host', 'postgres-port', 'postgres-database', 'postgres-username', 'postgres-password'];
        
        console.log('\n5. Testing secret retrieval...');
        for (const secretName of requiredSecrets) {
            try {
                const secret = await client.getSecret(secretName);
                if (secret.value) {
                    console.log(`   ✓ ${secretName}: Retrieved successfully (${secret.value.length} characters)`);
                } else {
                    console.log(`   ⚠ ${secretName}: Exists but no value`);
                }
            } catch (error) {
                console.log(`   ✗ ${secretName}: ${error.message}`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('\n✗ Key Vault test failed:');
        console.error(`   Error: ${error.message}`);
        
        if (error.code) {
            console.error(`   Code: ${error.code}`);
        }
        
        if (error.statusCode) {
            console.error(`   Status Code: ${error.statusCode}`);
        }
        
        console.log('\nTroubleshooting:');
        console.log('1. Run "az login" to authenticate');
        console.log('2. Ensure you have access to WiseBondVault');
        console.log('3. Check that the Key Vault URL is correct');
        console.log('4. Verify you have "Key Vault Secrets User" role');
        
        return false;
    }
}

// Run the test
testKeyVaultAccess()
    .then(success => {
        if (success) {
            console.log('\n🎉 Key Vault connectivity test passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Key Vault connectivity test failed!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Unexpected error:', error.message);
        process.exit(1);
    });