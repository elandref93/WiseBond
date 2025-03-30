# Mailgun Setup Guide for WiseBond

This document explains how to set up and configure Mailgun for email functionality in the WiseBond application.

## Requirements

- A Mailgun account
- Domain verified with Mailgun
- API credentials

## Configuration Options

The application supports two methods for configuring Mailgun:

### 1. Environment Variables (.env file)

Add your Mailgun credentials to the `.env` file in the project root:

```
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
MAILGUN_FROM_EMAIL=sender@your-domain.com
```

### 2. Azure Key Vault (Recommended for Production)

For secure storage of credentials in production, the application can fetch secrets from Azure Key Vault:

1. Create an Azure Key Vault instance
2. Add the following secrets:
   - `MAILGUN-API-KEY`
   - `MAILGUN-DOMAIN`
   - `MAILGUN-FROM-EMAIL`
3. Configure Azure credentials in your environment

## Testing Email Functionality

You can test the email functionality using the `test-email.js` script:

```
node test-email.js
```

This will attempt to send a test email using the configured Mailgun credentials.

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