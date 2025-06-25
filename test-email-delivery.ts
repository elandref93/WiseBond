import { sendVerificationEmail, sendPasswordResetEmail } from './server/email.js';

const testEmail = process.argv[2];

if (!testEmail) {
  console.log('Usage: npx tsx test-email-delivery.ts <your-email@domain.com>');
  process.exit(1);
}

console.log(`Testing email delivery to: ${testEmail}`);

async function testEmailDelivery() {
  console.log('\n=== Real Email Delivery Test ===\n');
  
  // Test OTP email
  console.log('1. Sending OTP verification email...');
  const otpResult = await sendVerificationEmail({
    firstName: 'Test User',
    email: testEmail,
    verificationCode: '123456'
  });
  
  console.log('OTP Result:', otpResult);
  
  // Test password reset email  
  console.log('\n2. Sending password reset email...');
  const resetResult = await sendPasswordResetEmail({
    firstName: 'Test User',
    email: testEmail,
    resetToken: 'test-reset-token-abc123'
  });
  
  console.log('Reset Result:', resetResult);
  
  console.log('\n✅ Test emails sent! Please check your inbox and spam folder.');
  console.log('📧 Check both your main inbox and spam/junk folder');
  console.log('⏰ Emails should arrive within 1-2 minutes');
}

testEmailDelivery().catch(console.error);