// This script can be used to test Mailgun email functionality
// Run with: node test-email.js

import 'dotenv/config';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Function to send a test email
async function sendTestEmail() {
  // Check if environment variables are set
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
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@homeloanhelper.co.za';
  console.log(`📤 Using sender email: ${fromEmail}`);
  
  const toEmail = process.env.TEST_EMAIL_TO || fromEmail; // Send to self if no test recipient specified
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
    subject: 'HomeLoanHelper - Mailgun Test Email',
    text: 'This is a test email from HomeLoanHelper to verify that Mailgun is configured correctly.',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Mailgun Test Email</h1>
            <p>This is a test email from HomeLoanHelper to verify that Mailgun is configured correctly.</p>
          </div>
          <p>If you're receiving this email, it means your Mailgun configuration is working properly!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>HomeLoanHelper.co.za | <a href="https://www.homeloanhelper.co.za">www.homeloanhelper.co.za</a></p>
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
    if (error.status === 401) {
      console.log('\n\n📋 TROUBLESHOOTING GUIDE:');
      console.log('-------------------------');
      console.log('1. The API key appears to be invalid or unauthorized.');
      console.log('2. For Mailgun sandbox domains, you need to add authorized recipients.');
      console.log('   - Log in to your Mailgun account');
      console.log('   - Go to the Sending > Domains section');
      console.log('   - Click on your sandbox domain');
      console.log('   - Under "Authorized Recipients" add the email address you\'re sending to');
      console.log('3. If using a custom domain, verify it\'s properly set up in Mailgun');
      console.log('4. Check that your account is not suspended or restricted');
      console.log('5. Try using the EU endpoint if your account is in the EU region:');
      console.log('   - Change the URL to https://api.eu.mailgun.net');
    } else if (error.status === 400) {
      console.log('\n\n📋 TROUBLESHOOTING GUIDE:');
      console.log('-------------------------');
      console.log('1. Check that your "from" email address is properly formatted');
      console.log('2. If using a custom domain, ensure it\'s properly set up in Mailgun');
      console.log('3. Ensure the recipient email is valid');
    }
    
    return false;
  }
}

// Run the test
sendTestEmail();