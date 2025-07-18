# 🛠️ Local Development Setup Guide

## Overview

This guide explains how to set up API keys for local development testing of WiseBond's third-party integrations.

## 🔐 Current Security Setup

**✅ SECURE**: Your project correctly does NOT store API keys in files that are committed to version control.

- **Production**: API keys are retrieved from Azure Key Vault
- **Development**: API keys can be set via environment variables
- **No `.env` files**: Correctly excluded from git

## 🚀 Quick Setup for Local Testing

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
npm run setup:local
```

This will:
- Prompt you for API keys
- Create a `.env.local` file (ignored by git)
- Guide you through the setup process

### Option 2: Manual Setup

1. **Create `.env.local` file** in the project root:
```bash
# WiseBond Local Development Environment
# This file is ignored by git and should not be committed

# Mailgun Email Service
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=wisebond.co.za
MAILGUN_FROM_EMAIL=postmaster@wisebond.co.za

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Session Management
SESSION_SECRET=your_session_secret_here

# Development Settings
NODE_ENV=development
```

2. **Restart the development server**:
```bash
npm run dev
```

## 📧 Required API Keys

### Mailgun (Email Services)
- **Purpose**: Send emails (welcome, password reset, OTP verification)
- **Get API Key**: https://app.mailgun.com/app/account/security/api_keys
- **Required Variables**:
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `MAILGUN_FROM_EMAIL`

### Google Maps (Address Autocomplete)
- **Purpose**: Address input with autocomplete functionality
- **Get API Key**: https://console.cloud.google.com/apis/credentials
- **Required Variables**:
  - `GOOGLE_MAPS_API_KEY`
  - `VITE_GOOGLE_MAPS_API_KEY` (same value)

## 🧪 Testing Third-Party Integrations

### Test Email Functionality
```bash
# Test welcome email
node test-welcome-email.js

# Test password reset email
node test-password-reset.js

# Test OTP email
node test-otp-email.ts
```

### Test Google Maps Integration
1. Go to any page with address input
2. Start typing an address
3. Verify autocomplete suggestions appear

### Test All Services
```bash
# Comprehensive test of all integrations
node test-all-services.js
```

## 🔄 Environment Variable Priority

The application loads environment variables in this order:

1. **System environment variables** (highest priority)
2. **`.env.local` file** (for local development)
3. **Azure Key Vault** (production fallback)
4. **Hardcoded fallbacks** (lowest priority)

## 🚨 Security Best Practices

### ✅ DO:
- Use `.env.local` for local development only
- Keep API keys secure and never share them
- Use different API keys for development vs production
- Regularly rotate API keys

### ❌ DON'T:
- Commit `.env.local` to version control
- Share API keys in chat or email
- Use production API keys for development
- Store API keys in code files

## 🐛 Troubleshooting

### "API Key Not Set" Errors
1. Check if `.env.local` exists
2. Verify API key values are correct
3. Restart the development server
4. Check console logs for environment variable status

### Email Not Sending
1. Verify Mailgun API key is valid
2. Check Mailgun domain is verified
3. Ensure `MAILGUN_FROM_EMAIL` is authorized
4. Check Mailgun logs for errors

### Google Maps Not Working
1. Verify Google Maps API key is valid
2. Check API key has Maps JavaScript API enabled
3. Ensure billing is set up on Google Cloud
4. Check browser console for API errors

## 📝 File Structure

```
WiseBond/
├── .env.local          # Local environment variables (ignored by git)
├── setup-local-env.js  # Setup script for local environment
├── test-*.js          # Test scripts for various integrations
└── server/
    └── index.ts       # Loads .env.local for development
```

## 🔗 Useful Links

- **Mailgun Dashboard**: https://app.mailgun.com/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Azure Key Vault**: https://portal.azure.com/
- **WiseBond Production**: https://www.wisebond.co.za/

---

**Remember**: Never commit API keys to version control! The `.env.local` file is already in `.gitignore` to prevent accidental commits. 