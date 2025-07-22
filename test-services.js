#!/usr/bin/env node

/**
 * Service Validation Test Script
 * 
 * This script tests all service configurations to ensure everything is working
 * before deployment.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testServices() {
  console.log('🧪 ========================================');
  console.log('🧪 SERVICE VALIDATION TEST');
  console.log('🧪 ========================================');
  console.log('');

  // Test environment variables
  console.log('📋 Environment Variables Check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('- POSTGRES_HOST:', process.env.POSTGRES_HOST || 'not set');
  console.log('- POSTGRES_USERNAME:', process.env.POSTGRES_USERNAME || 'not set');
  console.log('- POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('- MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || 'not set');
  console.log('- MAILGUN_FROM_EMAIL:', process.env.MAILGUN_FROM_EMAIL || 'not set');
  console.log('- GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- VITE_GOOGLE_MAPS_API_KEY:', process.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');

  // Test Key Vault integration
  console.log('🔐 Key Vault Integration Test:');
  try {
    const { checkAzureAuthentication, getDatabaseSecretsFromKeyVault, listAvailableKeys } = await import('./server/keyVault.js');
    
    const azureAuth = await checkAzureAuthentication();
    console.log('- Azure Authentication:', azureAuth ? '✅ Available' : '❌ Not available');
    
    if (azureAuth) {
      const availableKeys = await listAvailableKeys();
      console.log('- Available Key Vault secrets:', availableKeys.length > 0 ? availableKeys : 'None found');
      
      const dbConfig = await getDatabaseSecretsFromKeyVault();
      console.log('- Database config from Key Vault:', dbConfig ? '✅ Available' : '❌ Not available');
    }
  } catch (error) {
    console.log('- Key Vault test failed:', error.message);
  }
  console.log('');

  // Test service validation
  console.log('🔍 Service Validation Test:');
  try {
    const { validateAllServices } = await import('./server/serviceValidator.js');
    const summary = await validateAllServices();
    
    console.log('');
    console.log('📊 Final Summary:');
    console.log(`- Total Services: ${summary.totalServices}`);
    console.log(`- Configured: ${summary.configuredServices}`);
    console.log(`- Working: ${summary.workingServices}`);
    console.log(`- Issues: ${summary.totalServices - summary.workingServices}`);
    
    if (summary.workingServices === summary.totalServices) {
      console.log('🎉 All services are properly configured and working!');
    } else {
      console.log('⚠️ Some services have configuration issues. Check the logs above.');
    }
  } catch (error) {
    console.log('- Service validation failed:', error.message);
  }

  console.log('');
  console.log('🧪 ========================================');
  console.log('🧪 TEST COMPLETED');
  console.log('🧪 ========================================');
}

testServices().catch(console.error); 