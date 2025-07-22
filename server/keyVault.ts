import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const KEY_VAULT_URL = "https://wisebondvault.vault.azure.net/";

let secretClient: SecretClient | null = null;
let keyVaultAvailable = false;


/**
 * Initialize the Azure Key Vault client with error handling
 */
async function initializeKeyVaultClient(): Promise<SecretClient | null> {
  if (secretClient && keyVaultAvailable) {
    return secretClient;
  }

  try {
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(KEY_VAULT_URL, credential);
    
    // Test connectivity by trying to list secrets
    const secretsIterator = secretClient.listPropertiesOfSecrets();
    await secretsIterator.next();
    
    keyVaultAvailable = true;
    console.log('Azure Key Vault client initialized successfully');
    return secretClient;
    
  } catch (error: any) {
    console.warn('Azure Key Vault unavailable:', error.message);
    keyVaultAvailable = false;
    return null;
  }
}

/**
 * Get a secret from Azure Key Vault with retry logic and graceful fallback
 * @param secretName The name of the secret to retrieve
 * @param retries Number of retry attempts
 * @returns The secret value or undefined if not found
 */
export async function getSecret(secretName: string, retries: number = 2): Promise<string | undefined> {
  const client = await initializeKeyVaultClient();
  
  if (!client) {
    console.log(`Key Vault unavailable, skipping secret '${secretName}'`);
    return undefined;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const secret = await client.getSecret(secretName);
      
      if (secret.value) {
        console.log(`Retrieved secret '${secretName}' from Key Vault`);
        return secret.value;
      } else {
        console.warn(`Secret '${secretName}' exists but has no value`);
        return undefined;
      }
      
    } catch (error: any) {
      console.error(`Attempt ${attempt}/${retries} - Failed to get secret '${secretName}':`, error.message);
      
      if (attempt === retries) {
        console.error(`All ${retries} attempts failed for secret '${secretName}'`);
        return undefined;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Get all secrets from Azure Key Vault
 * @returns An array of secret names and their values
 */
export async function getAllSecrets(): Promise<{ name: string, value: string | undefined }[]> {
  try {
    const secrets: { name: string, value: string | undefined }[] = [];
    const secretProperties:any = secretClient?.listPropertiesOfSecrets();
    
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
    
    // List of secrets to retrieve from Key Vault (lowercase per Azure Key Vault naming)
    const secretsToRetrieve = [
      'google-maps-api-key',
      'mailgun-api-key',
      'mailgun-domain',
      'mailgun-from-email'
    ];
    
    for (const secretName of secretsToRetrieve) {
      const secretValue = await getSecret(secretName);
      
      if (secretValue) {
        // Convert from lowercase-hyphen to UPPERCASE_UNDERSCORE format
        const envVarName = secretName.replace(/-/g, '_').toUpperCase();
        process.env[envVarName] = secretValue;
        
        // Special case for Google Maps API Key - also set the VITE_ version for frontend
        if (secretName === 'google-maps-api-key') {
          process.env.VITE_GOOGLE_MAPS_API_KEY = secretValue;
        }
        
        console.log(`Loaded secret: ${secretName} as ${envVarName}`);
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
    const secretProperties:any = secretClient?.listPropertiesOfSecrets();
    
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

/**
 * Check if Azure authentication is available
 */
export async function checkAzureAuthentication(): Promise<boolean> {
  try {
    const credential = new DefaultAzureCredential();
    // Try to get a token to test authentication
    const token = await credential.getToken('https://vault.azure.net/.default');
    return !!token;
  } catch (error) {
    console.log('Azure authentication not available:', error.message);
    return false;
  }
}

/**
 * Get database secrets from Key Vault
 */
export async function getDatabaseSecretsFromKeyVault(): Promise<{
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
} | null> {
  try {
    console.log(KEY_VAULT_URL);
    
    const host = await getSecret('postgres-host');
    const port = await getSecret('postgres-port');
    const database = await getSecret('postgres-database');
    const username = await getSecret('postgres-username');
    const password = await getSecret('postgres-password');
    
    if (host && port && database && username && password) {
      return {
        host,
        port: parseInt(port, 10),
        database,
        username,
        password
      };
    }
    
    console.log('Some database secrets missing from Key Vault');
    return null;
  } catch (error: any) {
    console.log('Failed to get database secrets from Key Vault:', error.message);
    return null;
  }
}