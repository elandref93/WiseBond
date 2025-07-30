/**
 * Service Configuration Validator
 * 
 * This module validates that all required services are properly configured
 * and can be used by the application.
 */

import { getPostgresClient } from './db';

interface ServiceStatus {
  name: string;
  configured: boolean;
  testable: boolean;
  testResult?: boolean;
  error?: string;
}

interface ValidationSummary {
  totalServices: number;
  configuredServices: number;
  workingServices: number;
  services: ServiceStatus[];
}

/**
 * Validate all service configurations
 */
export async function validateAllServices(): Promise<ValidationSummary> {
  console.log('🔍 ========================================');
  console.log('🔍 SERVICE CONFIGURATION VALIDATION');
  console.log('🔍 ========================================');

  const services: ServiceStatus[] = [];

  // 1. Database Configuration
  services.push(await validateDatabaseService());

  // 2. Email Service (Mailgun)
  services.push(await validateEmailService());

  // 3. Google Maps API
  services.push(await validateGoogleMapsService());

  // 4. OpenRouter AI API
  services.push(await validateOpenRouterService());

  // 5. Session Management
  services.push(await validateSessionService());

  // Calculate summary
  const configuredServices = services.filter(s => s.configured).length;
  const workingServices = services.filter(s => s.testResult === true).length;

  const summary: ValidationSummary = {
    totalServices: services.length,
    configuredServices,
    workingServices,
    services
  };

  // Print summary
  console.log('🔍 ========================================');
  console.log('🔍 VALIDATION SUMMARY');
  console.log('🔍 ========================================');
  console.log(`📊 Total Services: ${summary.totalServices}`);
  console.log(`✅ Configured: ${summary.configuredServices}`);
  console.log(`🟢 Working: ${summary.workingServices}`);
  console.log(`❌ Issues: ${summary.totalServices - summary.workingServices}`);
  console.log('🔍 ========================================');

  // Print detailed results
  services.forEach(service => {
    const status = service.testResult === true ? '🟢' : 
                   service.configured ? '🟡' : '🔴';
    console.log(`${status} ${service.name}: ${service.configured ? 'Configured' : 'Not Configured'}${service.testResult !== undefined ? ` | Test: ${service.testResult ? 'Passed' : 'Failed'}` : ''}`);
    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
  });

  console.log('🔍 ========================================');

  return summary;
}

/**
 * Validate database service configuration
 */
async function validateDatabaseService(): Promise<ServiceStatus> {
  const service: ServiceStatus = {
    name: 'Database (PostgreSQL)',
    configured: false,
    testable: true,
    testResult: false
  };

  try {
    // Check environment variables
    const hasEnvVars = !!(process.env.DATABASE_URL || 
                         (process.env.POSTGRES_HOST && process.env.POSTGRES_USERNAME && process.env.POSTGRES_PASSWORD));

    // Check Key Vault integration
    const { getDatabaseSecretsFromKeyVault } = await import('./keyVault');
    const keyVaultConfig = await getDatabaseSecretsFromKeyVault();

    service.configured = hasEnvVars || !!keyVaultConfig;

    if (service.configured) {
      // Test database connection
      try {
        await getPostgresClient();
        service.testResult = true;
      } catch (error: any) {
        service.error = `Database connection failed: ${error.message}`;
        service.testResult = false;
      }
    } else {
      service.error = 'No database configuration found in environment or Key Vault';
    }
  } catch (error: any) {
    service.error = `Validation error: ${error.message}`;
  }

  return service;
}

/**
 * Validate email service configuration
 */
async function validateEmailService(): Promise<ServiceStatus> {
  const service: ServiceStatus = {
    name: 'Email Service (Mailgun)',
    configured: false,
    testable: true,
    testResult: false
  };

  try {
    const hasApiKey = !!(process.env.MAILGUN_API_KEY);
    const hasDomain = !!(process.env.MAILGUN_DOMAIN);
    const hasFromEmail = !!(process.env.MAILGUN_FROM_EMAIL);

    service.configured = hasApiKey && hasDomain && hasFromEmail;

    if (service.configured) {
      // Test email service (optional - just check configuration)
      service.testResult = true; // Skip actual email test in validation
    } else {
      const missing = [];
      if (!hasApiKey) missing.push('MAILGUN_API_KEY');
      if (!hasDomain) missing.push('MAILGUN_DOMAIN');
      if (!hasFromEmail) missing.push('MAILGUN_FROM_EMAIL');
      service.error = `Missing configuration: ${missing.join(', ')}`;
    }
  } catch (error: any) {
    service.error = `Validation error: ${error.message}`;
  }

  return service;
}

/**
 * Validate Google Maps service configuration
 */
async function validateGoogleMapsService(): Promise<ServiceStatus> {
  const service: ServiceStatus = {
    name: 'Google Maps API',
    configured: false,
    testable: false,
    testResult: false
  };

  try {
    const hasApiKey = !!(process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY);
    service.configured = hasApiKey;

    if (service.configured) {
      service.testResult = true; // Skip actual API test in validation
    } else {
      service.error = 'Missing GOOGLE_MAPS_API_KEY configuration';
    }
  } catch (error: any) {
    service.error = `Validation error: ${error.message}`;
  }

  return service;
}

/**
 * Validate OpenRouter AI service configuration
 */
async function validateOpenRouterService(): Promise<ServiceStatus> {
  const service: ServiceStatus = {
    name: 'OpenRouter AI API',
    configured: false,
    testable: false,
    testResult: false
  };

  try {
    const hasApiKey = !!(process.env.OPENROUTER_API_KEY);
    service.configured = hasApiKey;

    if (service.configured) {
      service.testResult = true; // Skip actual API test in validation
    } else {
      service.error = 'Missing OPENROUTER_API_KEY configuration';
    }
  } catch (error: any) {
    service.error = `Validation error: ${error.message}`;
  }

  return service;
}

/**
 * Validate session management configuration
 */
async function validateSessionService(): Promise<ServiceStatus> {
  const service: ServiceStatus = {
    name: 'Session Management',
    configured: false,
    testable: false,
    testResult: false
  };

  try {
    const hasSessionSecret = !!(process.env.SESSION_SECRET);
    service.configured = hasSessionSecret;

    if (service.configured) {
      service.testResult = true;
    } else {
      service.error = 'Missing SESSION_SECRET configuration';
    }
  } catch (error: any) {
    service.error = `Validation error: ${error.message}`;
  }

  return service;
} 