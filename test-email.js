// This script can be used to test Mailgun email functionality
// Run with: node test-email.js

const FormData = require('form-data');
const Mailgun = require('mailgun.js');

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
    return false;
  }

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ 
    username: 'api', 
    key: process.env.MAILGUN_API_KEY,
    url: 'https://api.mailgun.net' // or 'https://api.eu.mailgun.net' for EU region
  });
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  
  // Set up the test email
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@homeloanhelper.co.za';
  const testEmail = {
    to: process.env.TEST_EMAIL_TO || fromEmail, // Send to self if no test recipient specified
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
    return false;
  }
}

// Run the test
sendTestEmail();