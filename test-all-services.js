// Comprehensive test script for both Mailgun and Google Maps
// This script verifies that both services are properly configured with environment variables

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import readline from 'readline';
import dotenv from 'dotenv';

// Initialize environment
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function testService() {
  console.log('🧪 WiseBond Service Configuration Test');
  console.log('====================================');
  
  // Check for environment variables first
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleMapsViteApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log('\n📋 Environment Configuration:');
  console.log(`- MAILGUN_API_KEY: ${mailgunApiKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`- MAILGUN_DOMAIN: ${mailgunDomain ? '✓ Set' : '✗ Not set'}`);
  console.log(`- MAILGUN_FROM_EMAIL: ${mailgunFromEmail ? '✓ Set' : '✗ Not set'}`);
  console.log(`- GOOGLE_MAPS_API_KEY: ${googleMapsApiKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`- VITE_GOOGLE_MAPS_API_KEY: ${googleMapsViteApiKey ? '✓ Set' : '✗ Not set'}`);
  
  // Check if we need to copy Google Maps API Key to VITE version
  if (googleMapsApiKey && !googleMapsViteApiKey) {
    console.log('\n⚠️ VITE_GOOGLE_MAPS_API_KEY is not set. This should be automatically set in server/index.ts');
    console.log('   In development, this means Google Maps won\'t work in the frontend unless you restart the server.');
  }
  
  // Test Mailgun if we have all required credentials
  let mailgunSuccess = false;
  
  if (mailgunApiKey && mailgunDomain && mailgunFromEmail) {
    console.log('\n📧 Testing Mailgun...');
    
    const shouldSendEmail = await getUserInput('Would you like to send a test email? (y/n): ');
    
    if (shouldSendEmail.toLowerCase() === 'y') {
      const testEmail = await getUserInput('Enter recipient email address: ');
      
      if (testEmail) {
        mailgunSuccess = await testMailgun(testEmail);
      } else {
        console.log('❌ No email provided. Skipping Mailgun test.');
      }
    } else {
      console.log('✓ Mailgun credentials present but test email skipped.');
      mailgunSuccess = true;
    }
  } else {
    console.log('\n❌ Not all Mailgun credentials are set. Skipping Mailgun test.');
  }
  
  // Test Google Maps if we have the API key
  let googleMapsSuccess = false;
  
  if (googleMapsApiKey) {
    console.log('\n🗺️ Testing Google Maps API...');
    console.log('The API key is set. This means the service should work properly.');
    console.log('For a comprehensive test, open the application in a browser and try searching for addresses.');
    
    // We'll just assume it works if the key is present
    googleMapsSuccess = true;
  } else {
    console.log('\n❌ Google Maps API key is not set. The address autocomplete feature will not work.');
  }
  
  // Summary
  console.log('\n📝 Test Summary:');
  console.log(`- Mailgun Email Service: ${mailgunSuccess ? '✓ Ready' : '✗ Not configured'}`);
  console.log(`- Google Maps API: ${googleMapsSuccess ? '✓ Ready' : '✗ Not configured'}`);
  
  if (mailgunSuccess && googleMapsSuccess) {
    console.log('\n🎉 All services are properly configured!');
  } else {
    console.log('\n⚠️ Some services are not properly configured. Check the logs above for details.');
  }
  
  rl.close();
}

async function testMailgun(recipientEmail) {
  try {
    const mailgun = new Mailgun(FormData);
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.MAILGUN_FROM_EMAIL;
    const apiEndpoint = process.env.MAILGUN_API_ENDPOINT || 'https://api.mailgun.net';
    
    const mg = mailgun.client({ 
      username: 'api', 
      key: apiKey,
      url: apiEndpoint
    });
    
    const testEmail = {
      to: recipientEmail,
      from: fromEmail,
      subject: 'WiseBond - Service Test Email',
      text: 'This is a test email from WiseBond to verify that all services are configured correctly.',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin-top: 0;">WiseBond Services Test</h1>
              <p>This is a test email from WiseBond to verify that all services are configured correctly.</p>
            </div>
            <p>If you're receiving this email, it means your Mailgun configuration is working properly!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>WiseBond.co.za | <a href="https://www.wisebond.co.za">www.wisebond.co.za</a></p>
            </div>
          </body>
        </html>
      `
    };
    
    console.log(`📨 Sending test email from: ${fromEmail}`);
    console.log(`📤 To recipient: ${recipientEmail}`);
    console.log(`🌐 Using domain: ${domain}`);
    
    const result = await mg.messages.create(domain, testEmail);
    console.log('✅ Email sent successfully!');
    console.log('ID:', result.id);
    console.log('Message:', result.message);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    
    // Handle sandbox domain issues
    if (error.status === 403 && error.details?.includes('authorized recipients')) {
      console.log('\n⚠️ SANDBOX DOMAIN ISSUE');
      console.log(`The recipient (${recipientEmail}) is not authorized for your sandbox domain.`);
      console.log('To fix this:');
      console.log('1. Log in to your Mailgun dashboard');
      console.log('2. Navigate to Sending → Domains');
      console.log('3. Select your sandbox domain');
      console.log('4. Go to the "Authorized Recipients" section');
      console.log(`5. Add "${recipientEmail}" and verify the email`);
    }
    
    return false;
  }
}

// Run the test
testService();