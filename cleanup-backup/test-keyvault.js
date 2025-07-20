// Test script to debug Azure Key Vault configuration
// This helps diagnose issues with connecting to the Key Vault

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testKeyVault() {
  console.log('🔐 Azure Key Vault Test Script');
  console.log('----------------------------');
  
  try {
    // Azure Key Vault configuration
    const keyVaultName = "wisebond";
    const keyVaultUri = `https://${keyVaultName}.vault.azure.net/`;
    
    console.log(`🏛️  Key Vault Name: ${keyVaultName}`);
    console.log(`🌐 Key Vault URI: ${keyVaultUri}`);
    
    console.log('\n🔑 Creating credential...');
    const credential = new DefaultAzureCredential();
    
    console.log('🔌 Creating secret client...');
    const secretClient = new SecretClient(keyVaultUri, credential);
    
    // List available secrets
    console.log('\n📋 Attempting to list available secrets...');
    
    const secrets = [];
    try {
      const secretProperties = secretClient.listPropertiesOfSecrets();
      
      for await (const secretProperty of secretProperties) {
        if (secretProperty.name) {
          console.log(`- Found secret: ${secretProperty.name}`);
          secrets.push(secretProperty.name);
        }
      }
      
      if (secrets.length === 0) {
        console.log('No secrets found in key vault.');
      }
    } catch (error) {
      console.error('Error listing secrets:', error);
    }
    
    // Try to retrieve specific secrets
    console.log('\n🔍 Looking for expected secret keys...');
    const expectedSecrets = [
      'mailgun-domain',
      'mailgun-api-key',
      'mailgun-from-email',
      'google-maps-api-key'
    ];
    
    for (const secretName of expectedSecrets) {
      try {
        console.log(`Checking for ${secretName}...`);
        const secret = await secretClient.getSecret(secretName);
        
        // Don't log the actual value for security
        console.log(`✅ Found secret: ${secretName}, value starts with: ${secret.value.substr(0, 3)}...`);
      } catch (error) {
        console.error(`❌ Error retrieving secret '${secretName}':`, error.message);
      }
    }
    
    // Print troubleshooting info
    console.log('\n🔧 Troubleshooting Info:');
    console.log('1. Ensure you have proper Azure credentials configured');
    console.log('2. Check that the key vault exists and is accessible');
    console.log('3. Verify that the secrets are created with correct names (case-sensitive)');
    console.log('4. For local testing, you may need to authenticate with az login');
    
  } catch (error) {
    console.error('❌ Error testing Key Vault:', error);
  }
}

// Run the test
testKeyVault();