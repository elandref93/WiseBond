import { sendVerificationEmail, sendPasswordResetEmail } from './server/email.js';

async function testEmailFunctionality() {
  console.log('=== Testing Email Functionality ===\n');
  
  // Test OTP verification email
  console.log('1. Testing OTP verification email...');
  try {
    const otpResult = await sendVerificationEmail({
      firstName: 'Test User',
      email: 'test@example.com',
      verificationCode: '123456'
    });
    
    console.log('   OTP Email Result:', JSON.stringify(otpResult, null, 2));
    
    if (!otpResult.success) {
      console.log('   ❌ OTP email failed:', otpResult.error);
      if (otpResult.isSandboxAuthError) {
        console.log('   📧 This appears to be a Mailgun sandbox authorization issue');
        console.log('   💡 The recipient email needs to be authorized in Mailgun sandbox mode');
      }
    } else {
      console.log('   ✅ OTP email sent successfully');
    }
  } catch (error) {
    console.log('   ❌ OTP email test failed with exception:', error);
  }
  
  console.log('\n2. Testing password reset email...');
  try {
    const resetResult = await sendPasswordResetEmail({
      firstName: 'Test User',
      email: 'test@example.com',
      resetToken: 'test-reset-token-12345'
    });
    
    console.log('   Reset Email Result:', JSON.stringify(resetResult, null, 2));
    
    if (!resetResult.success) {
      console.log('   ❌ Password reset email failed:', resetResult.error);
      if (resetResult.isSandboxAuthError) {
        console.log('   📧 This appears to be a Mailgun sandbox authorization issue');
        console.log('   💡 The recipient email needs to be authorized in Mailgun sandbox mode');
      }
    } else {
      console.log('   ✅ Password reset email sent successfully');
    }
  } catch (error) {
    console.log('   ❌ Password reset email test failed with exception:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

testEmailFunctionality().catch(console.error);