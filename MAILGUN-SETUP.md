# Mailgun Setup Guide for WiseBond

This document explains how to set up and configure Mailgun for email functionality in the WiseBond application.

## Requirements

- A Mailgun account
- Domain verified with Mailgun (wisebond.co.za)
- API credentials

## Configuration Method: Azure Key Vault

WiseBond uses Azure Key Vault exclusively for storing and retrieving sensitive credentials:

1. Create an Azure Key Vault instance named "wisebond"
2. Add the following secrets (using lowercase naming convention with hyphens):
   - `mailgun-api-key` - Your Mailgun Private API key
   - `mailgun-domain` - Your verified Mailgun domain (wisebond.co.za)
   - `mailgun-from-email` - Your sender email (postmaster@wisebond.co.za)
3. Configure Azure credentials in your environment (for local development only)

## Testing Email Functionality

You can test the email functionality using the provided test scripts:

1. Test Azure Key Vault secrets:
   ```
   node test-keyvault.js
   ```

2. Test Mailgun directly (uses Key Vault for credentials):
   ```
   node test-mailgun.js
   ```

3. Test the email functionality through the application:
   ```
   node test-email.js
   ```

These tests will verify your Azure Key Vault is properly configured and that emails can be sent using the retrieved credentials.

## Troubleshooting

### Sandbox Domain Restrictions

If you're using a Mailgun sandbox domain, you can only send emails to authorized recipients. To add authorized recipients:

1. Log in to your Mailgun dashboard
2. Navigate to Sending → Domains
3. Select your sandbox domain
4. Go to the "Authorized Recipients" section
5. Add the email addresses you want to send to

### API Key Issues

If you're experiencing authentication issues, verify your API key is correct and that you're using the Private API Key, not the Public API Key.

### DNS Configuration

For production domains, ensure all required DNS records (SPF, DKIM, etc.) are properly configured according to Mailgun's instructions.

## Email Templates

The application includes pre-built templates for:

- Calculation results emails
- Account verification emails

You can customize these templates in the `server/email.ts` file.