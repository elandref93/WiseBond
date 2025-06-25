# WiseBondVault Setup Guide

## Azure Key Vault Configuration

Your WiseBondVault is configured at: `https://wisebondvault.vault.azure.net/`

## Required Secrets

To complete the Key Vault integration, add these secrets to your WiseBondVault:

### Database Configuration
- **Secret Name**: `postgres-host`
  - **Value**: `wisebond-server.postgres.database.azure.com`

- **Secret Name**: `postgres-port` 
  - **Value**: `5432`

- **Secret Name**: `postgres-database`
  - **Value**: `postgres` (or your actual database name)

- **Secret Name**: `postgres-username`
  - **Value**: `elandre` (or your actual username)

- **Secret Name**: `postgres-password`
  - **Value**: Your actual PostgreSQL password

### Application Secrets (Optional)
- **Secret Name**: `mailgun-api-key`
  - **Value**: Your Mailgun API key

- **Secret Name**: `mailgun-domain`
  - **Value**: Your Mailgun domain

- **Secret Name**: `mailgun-from-email`
  - **Value**: Your Mailgun from email

- **Secret Name**: `google-maps-api-key`
  - **Value**: Your Google Maps API key

- **Secret Name**: `session-secret`
  - **Value**: A secure random string for session encryption

## How to Add Secrets

### Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Key Vaults → WiseBondVault
3. Click on "Secrets" in the left menu
4. Click "+ Generate/Import"
5. Choose "Manual" upload type
6. Enter the secret name and value
7. Click "Create"

### Using Azure CLI
```bash
# Login to Azure
az login

# Add database secrets
az keyvault secret set --vault-name "WiseBondVault" --name "postgres-host" --value "wisebond-server.postgres.database.azure.com"
az keyvault secret set --vault-name "WiseBondVault" --name "postgres-port" --value "5432"
az keyvault secret set --vault-name "WiseBondVault" --name "postgres-database" --value "postgres"
az keyvault secret set --vault-name "WiseBondVault" --name "postgres-username" --value "elandre"
az keyvault secret set --vault-name "WiseBondVault" --name "postgres-password" --value "YOUR_PASSWORD_HERE"

# Add application secrets (optional)
az keyvault secret set --vault-name "WiseBondVault" --name "mailgun-api-key" --value "YOUR_MAILGUN_KEY"
az keyvault secret set --vault-name "WiseBondVault" --name "session-secret" --value "YOUR_SESSION_SECRET"
```

## Access Permissions

Ensure your Azure identity has the following permissions on WiseBondVault:
- **Key Vault Secrets User** (to read secrets)
- **Key Vault Secrets Officer** (to manage secrets, if needed)

## Testing the Setup

After adding the secrets, test the configuration:

```bash
# Run the comprehensive test
node test-keyvault-and-db.mjs

# Or run individual tests
node test-keyvault-simple.mjs
node test-database-connections.mjs
```

## Current Status

✅ **Application Working**: The application currently works with environment variables  
✅ **Database Connection**: Successfully connecting to `wisebond-server.postgres.database.azure.com`  
⚠️ **Key Vault**: Requires Azure authentication and secret configuration  

## Production Deployment

In production environments with proper Azure authentication:
1. The application will automatically try Key Vault first
2. If Key Vault is unavailable, it falls back to environment variables
3. This provides secure credential management while maintaining reliability

## Development vs Production

- **Development (Replit)**: Uses environment variables (current working state)
- **Production (Azure)**: Uses Key Vault for secure credential management
- **Fallback**: Always available using environment variables