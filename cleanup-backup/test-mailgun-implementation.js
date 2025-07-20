import { sendEmail } from './server/email.ts';

/**
 * Test the mailgun.js implementation
 */
async function testEmailService() {
  console.log('Testing mailgun.js email service...');
  
  const testEmailData = {
    to: 'test@example.com',
    from: 'noreply@example.com',
    subject: 'Test Email - Mailgun.js Implementation',
    text: 'This is a test email to verify mailgun.js is working correctly.',
    html: '<p>This is a test email to verify <strong>mailgun.js</strong> is working correctly.</p>'
  };
  
  try {
    const result = await sendEmail(testEmailData);
    console.log('Email service test result:', result);
    
    if (result.success) {
      console.log('✅ Mailgun.js implementation is working correctly');
    } else if (result.isSandboxAuthError) {
      console.log('⚠️  Sandbox domain detected - email would work with authorized recipients');
    } else {
      console.log('❌ Email service configuration issue:', result.error);
    }
  } catch (error) {
    console.error('Email service test failed:', error);
  }
}

testEmailService().catch(console.error);