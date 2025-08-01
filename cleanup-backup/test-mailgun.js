// Test script for Mailgun that first tries to use Azure Key Vault,
// then falls back to user input if Key Vault is not available

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import readline from 'readline';
import dotenv from 'dotenv';

// Initialize environment
dotenv.config();

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

async function sendTestEmail() {
  console.log('🛠️  Mailgun Test Email Configuration');
  console.log('-----------------------------------');
  
  console.log('Checking for Mailgun credentials in environment variables...');
  
  // Try to get credentials from environment variables first (set by Key Vault)
  let apiKey = process.env.MAILGUN_API_KEY;
  let domain = process.env.MAILGUN_DOMAIN;
  let fromEmail = process.env.MAILGUN_FROM_EMAIL;
  
  // Fall back to manual input if needed
  if (!apiKey) {
    apiKey = await getUserInput('Enter Mailgun API Key: ');
  } else {
    console.log('✅ Using Mailgun API Key from environment');
  }
  
  if (!domain) {
    domain = await getUserInput('Enter Mailgun Domain: ');
  } else {
    console.log(`✅ Using Mailgun Domain from environment: ${domain}`);
  }
  
  if (!fromEmail) {
    fromEmail = await getUserInput('Enter From Email (default: noreply@domain): ') || `noreply@${domain}`;
  } else {
    console.log(`✅ Using From Email from environment: ${fromEmail}`);
  }
  
  const toEmail = await getUserInput('Enter To Email (who should receive the test): ');
  const endpoint = process.env.MAILGUN_API_ENDPOINT || 
                  await getUserInput('Enter API Endpoint (default: https://api.mailgun.net): ') || 
                  'https://api.mailgun.net';
  
  console.log('\n🌐 Starting email test...');
  console.log(`🔄 Using Mailgun API endpoint: ${endpoint}`);

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ 
    username: 'api', 
    key: apiKey,
    url: endpoint
  });
  
  console.log(`📨 Using Mailgun domain: ${domain}`);
  console.log(`📤 Using sender email: ${fromEmail}`);
  console.log(`📬 Sending test email to: ${toEmail}`);
  
  // Check if it's likely a sandbox domain and provide a hint
  if (domain.includes('sandbox') && !toEmail.includes(domain)) {
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
    const result = await mg.messages.create(domain, testEmail);
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
      console.log(`2. Double-check the spelling of your domain: "${domain}"`);
    } else {
      console.log(`Error (${error.status || 'Unknown'}):`);
      console.log('1. Check the detailed error message above.');
      console.log('2. Verify your Mailgun account status.');
      console.log('3. If using EU region, set endpoint to https://api.eu.mailgun.net');
    }
    
    console.log('\nFor more help, see the Mailgun documentation:');
    console.log('https://documentation.mailgun.com/en/latest/');
    
    return false;
  } finally {
    rl.close();
  }
}

// Run the test
sendTestEmail();