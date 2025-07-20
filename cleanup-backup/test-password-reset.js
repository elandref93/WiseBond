import { sendPasswordResetEmail } from './server/email.js';
import { storage } from './server/storage.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

async function testPasswordReset() {
  try {
    console.log('Testing password reset functionality...');

    // Check for required environment variables
    console.log('Mailgun API Key:', process.env.MAILGUN_API_KEY ? 'Available' : 'Not set');
    console.log('Mailgun Domain:', process.env.MAILGUN_DOMAIN);
    console.log('Mailgun From Email:', process.env.MAILGUN_FROM_EMAIL);

    // Email to send the test to
    const testEmail = process.argv[2] || 'test@example.com';
    
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Construct reset URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    // Testing the email sending
    const result = await sendPasswordResetEmail({
      firstName: 'Test',
      email: testEmail,
      resetToken: token,
      resetUrl: resetUrl
    });
    
    if (result.success) {
      console.log(`Password reset email sent successfully to ${testEmail}`);
      console.log('Reset URL:', resetUrl);
    } else {
      console.error('Failed to send password reset email:', result.error);
      if (result.isSandboxAuthError) {
        console.error('This appears to be a sandbox authorization error. The recipient email may not be authorized in your Mailgun sandbox account.');
      }
    }
    
    // Test storing and validating token
    const userId = await storage.storePasswordResetToken(testEmail, token, expiresAt);
    console.log('Token stored for user ID:', userId || 'Not stored (user not found)');
    
    if (userId) {
      // Test validating the token
      const validatedUserId = await storage.validatePasswordResetToken(token);
      console.log('Validated user ID:', validatedUserId || 'Token invalid or expired');
      
      // If validation was successful, test again to make sure it was consumed
      const revalidateUserId = await storage.validatePasswordResetToken(token);
      console.log('Re-validation result:', revalidateUserId || 'Token was properly consumed (expected)');
    }
    
  } catch (error) {
    console.error('Error in password reset test:', error);
  }
}

testPasswordReset();