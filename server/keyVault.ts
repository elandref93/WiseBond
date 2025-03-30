import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Azure Key Vault configuration
const keyVaultName = "wisebond";
const keyVaultUri = `https://${keyVaultName}.vault.azure.net/`;

// Create a new secret client using the default Azure credential
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUri, credential);

/**
 * Get a secret from Azure Key Vault
 * @param secretName The name of the secret to retrieve
 * @returns The secret value or undefined if not found
 */
export async function getSecret(secretName: string): Promise<string | undefined> {
  try {
    const secret = await secretClient.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error(`Error retrieving secret '${secretName}':`, error);
    return undefined;
  }
}

/**
 * Get all secrets from Azure Key Vault
 * @returns An array of secret names and their values
 */
export async function getAllSecrets(): Promise<{ name: string, value: string | undefined }[]> {
  try {
    const secrets: { name: string, value: string | undefined }[] = [];
    const secretProperties = secretClient.listPropertiesOfSecrets();
    
    for await (const secretProperty of secretProperties) {
      if (secretProperty.name) {
        const secretValue = await getSecret(secretProperty.name);
        secrets.push({
          name: secretProperty.name,
          value: secretValue
        });
      }
    }
    
    return secrets;
  } catch (error) {
    console.error('Error listing secrets:', error);
    return [];
  }
}

/**
 * Initialize environment variables from Azure Key Vault
 * This function loads secrets from Azure Key Vault and sets them as environment variables
 */
export async function initializeSecretsFromKeyVault(): Promise<void> {
  try {
    console.log('Initializing secrets from Azure Key Vault...');
    
    // List of secrets to retrieve from Key Vault
    const secretsToRetrieve = [
      'GOOGLE-MAPS-API-KEY',
      'MAILGUN-API-KEY',
      'MAILGUN-DOMAIN',
      'MAILGUN-FROM-EMAIL',
      'SENDGRID-API-KEY'
    ];
    
    for (const secretName of secretsToRetrieve) {
      const secretValue = await getSecret(secretName);
      
      if (secretValue) {
        // Convert key format from KEY-VAULT-NAME to KEY_VAULT_NAME for environment variables
        const envVarName = secretName.replace(/-/g, '_');
        process.env[envVarName] = secretValue;
        console.log(`Loaded secret: ${secretName}`);
      } else {
        console.warn(`Secret not found in Key Vault: ${secretName}`);
      }
    }
    
    console.log('Finished loading secrets from Azure Key Vault');
  } catch (error) {
    console.error('Error initializing secrets from Key Vault:', error);
  }
}

/**
 * List all available keys in the Key Vault
 * This is useful for debugging and setup
 */
export async function listAvailableKeys(): Promise<string[]> {
  try {
    const keyNames: string[] = [];
    const secretProperties = secretClient.listPropertiesOfSecrets();
    
    for await (const secretProperty of secretProperties) {
      if (secretProperty.name) {
        keyNames.push(secretProperty.name);
      }
    }
    
    return keyNames;
  } catch (error) {
    console.error('Error listing key names:', error);
    return [];
  }
}