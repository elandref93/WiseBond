// This script can be used to test Mailgun email functionality
// 
// Usage:
//   node test-email.js                               - Test with default recipient
//   TEST_EMAIL_TO=email@example.com node test-email.js   - Test with specific recipient
//
// Note: For Mailgun sandbox domains, the recipient must be authorized in your Mailgun account.
// See MAILGUN-SETUP.md for detailed instructions.
//
// This script can also load credentials from Azure Key Vault if configured

import 'dotenv/config';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Try to import the Azure Key Vault utilities
let keyVaultModule;
try {
  keyVaultModule = await import('./server/keyVault.js');
} catch (err) {
  console.log('Azure Key Vault utilities not available, using only environment variables');
}

// Function to send a test email
async function sendTestEmail() {
  // Try to load from Azure Key Vault first if available
  if (keyVaultModule) {
    console.log('🔐 Attempting to load credentials from Azure Key Vault...');
    try {
      // Try to initialize from Key Vault
      await keyVaultModule.initializeSecretsFromKeyVault();
      
      // List available keys for debugging
      const availableKeys = await keyVaultModule.listAvailableKeys();
      console.log('Available keys in Azure Key Vault:', availableKeys);
      
      console.log('✅ Successfully loaded credentials from Azure Key Vault');
    } catch (error) {
      console.error('❌ Error loading from Azure Key Vault:', error.message);
      console.log('⚠️ Falling back to environment variables in .env file');
    }
  }
  
  // Check if environment variables are set (either from .env or Key Vault)
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('❌ Error: MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables must be set');
    console.log('');
    console.log('Please create a .env file with the following variables:');
    console.log('MAILGUN_API_KEY=your_mailgun_api_key');
    console.log('MAILGUN_DOMAIN=your_mailgun_domain');
    console.log('MAILGUN_FROM_EMAIL=noreply@yourdomain.com (optional)');
    console.log('MAILGUN_API_ENDPOINT=https://api.eu.mailgun.net (optional, for EU region)');
    console.log('TEST_EMAIL_TO=test@example.com (optional, defaults to from email)');
    return false;
  }
  
  console.log('🔑 Mailgun API key detected');
  console.log('🌐 Starting email test...');

  // Get the API endpoint (default to US endpoint)
  const apiEndpoint = process.env.MAILGUN_API_ENDPOINT || 'https://api.mailgun.net';
  console.log(`🔄 Using Mailgun API endpoint: ${apiEndpoint}`);

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ 
    username: 'api', 
    key: process.env.MAILGUN_API_KEY,
    url: apiEndpoint
  });
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  console.log(`📨 Using Mailgun domain: ${mailgunDomain}`);
  
  // Set up the test email
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@wisebond.co.za';
  console.log(`📤 Using sender email: ${fromEmail}`);
  
  // For sandbox domains, use an authorized recipient if provided, otherwise default to the from address
  const toEmail = process.env.TEST_EMAIL_TO || 'elandrefourie18@gmail.com' || fromEmail;
  console.log(`📬 Sending test email to: ${toEmail}`);
  
  // Check if it's likely a sandbox domain and provide a hint
  if (mailgunDomain.includes('sandbox') && !toEmail.includes(mailgunDomain)) {
    console.log('\n⚠️  WARNING: Using a sandbox domain to send to an external address.');
    console.log('   Make sure this recipient is authorized in your Mailgun account!');
    console.log('   Sandbox domains can only send to pre-authorized recipients.');
  }
  
  const testEmail = {
    to: toEmail,
    from: fromEmail,
    subject: 'WiseBond - Mailgun Test Email',
    text: 'This is a test email from WiseBond to verify that Mailgun is configured correctly.',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Mailgun Test Email</h1>
            <p>This is a test email from WiseBond to verify that Mailgun is configured correctly.</p>
          </div>
          <p>If you're receiving this email, it means your Mailgun configuration is working properly!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>WiseBond.co.za | <a href="https://www.wisebond.co.za">www.wisebond.co.za</a></p>
          </div>
        </body>
      </html>
    `
  };
  
  try {
    console.log('📧 Sending test email...');
    const result = await mg.messages.create(mailgunDomain, testEmail);
    console.log('✅ Email sent successfully!');
    console.log('ID:', result.id);
    console.log('Message:', result.message);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    
    // Provide more helpful guidance based on the error
    console.log('\n\n📋 TROUBLESHOOTING GUIDE:');
    console.log('-------------------------');
    
    if (error.status === 401) {
      console.log('Authentication Error (401):');
      console.log('1. The API key appears to be invalid or unauthorized.');
      console.log('2. Check if you\'re using the private API key, not the public key.');
      console.log('3. Check that your account is not suspended or restricted.');
    } else if (error.status === 403 && error.details?.includes('authorized recipients')) {
      console.log('Sandbox Authorization Error (403):');
      console.log(`1. The recipient (${toEmail}) is not authorized for your sandbox domain.`);
      console.log('   To fix this:');
      console.log('   - Log in to your Mailgun account at https://app.mailgun.com/');
      console.log('   - Go to Sending → Domains');
      console.log('   - Click on your sandbox domain');
      console.log('   - Navigate to "Authorized Recipients"');
      console.log(`   - Add "${toEmail}" and have the recipient check their inbox for the verification email`);
      console.log('2. If you need to send to multiple recipients, consider upgrading to a paid plan.');
    } else if (error.status === 400) {
      console.log('Request Error (400):');
      console.log('1. Check that your "from" email address is properly formatted.');
      console.log('2. For sandbox domains, the "from" address should use the sandbox domain.');
      console.log('3. Ensure the recipient email is valid.');
    } else if (error.status === 404) {
      console.log('Not Found Error (404):');
      console.log('1. The domain you\'re trying to use might not exist in your Mailgun account.');
      console.log(`2. Double-check the spelling of your domain: "${mailgunDomain}"`);
    } else {
      console.log(`Error (${error.status || 'Unknown'}):`);
      console.log('1. Check the detailed error message above.');
      console.log('2. Verify your Mailgun account status.');
      console.log('3. If using EU region, set MAILGUN_API_ENDPOINT=https://api.eu.mailgun.net');
    }
    
    console.log('\nFor more help, see MAILGUN-SETUP.md or the Mailgun documentation:');
    console.log('https://documentation.mailgun.com/en/latest/');
    
    return false;
  }
}

// Run the test
sendTestEmail();