import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Interface for email calculation data
interface CalculationResult {
  type: string;
  displayResults: Array<{
    label: string;
    value: string;
    tooltip?: string;
  }>;
  [key: string]: any;
}

// Interface for email parameters
interface EmailParams {
  to: string;
  from: string; // The from email must be a valid address
  subject: string;
  text?: string;
  html?: string;
}

// Interface for calculation email data
interface CalculationEmailData {
  firstName: string;
  lastName: string;
  email: string;
  calculationType: string;
  calculationData: CalculationResult;
}

// Interface for verification email data
interface VerificationEmailData {
  firstName: string;
  email: string;
  verificationCode: string;
}

// Interface for welcome email data
interface WelcomeEmailData {
  firstName: string;
  email: string;
}

// Interface for password reset email data
interface PasswordResetEmailData {
  firstName: string;
  email: string;
  resetToken: string;
  resetUrl: string;
}

// Initialize Mailgun
const mailgun = new Mailgun(FormData);

/**
 * Send an email using Mailgun
 * @param params Email parameters including recipient, subject, etc.
 * @returns Promise resolving to object with success status and error details
 */
export async function sendEmail(params: EmailParams): Promise<{success: boolean, error?: string, isSandboxAuthError?: boolean}> {
  // Keys should be loaded from Azure Key Vault via environment variables
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  
  // Log what's available (without revealing sensitive values)
  console.log('Mailgun Configuration Status:');
  console.log(`- API Key: ${apiKey ? 'Available' : 'Missing'}`);
  console.log(`- Domain: ${domain || 'Missing'}`);
  console.log(`- From Email: ${fromEmail || 'Missing'}`);
  
  // Check if required configuration is available
  if (!apiKey || !domain) {
    return {
      success: false, 
      error: 'Missing Mailgun configuration. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.'
    };
  }

  const mg = mailgun.client({ username: 'api', key: apiKey });
  
  try {
    // Create the message data
    const messageData = {
      from: params.from || fromEmail || 'noreply@example.com',
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || ''
    };
    
    // Send the message
    await mg.messages.create(domain, messageData);
    return { success: true };
  } catch (error: any) {
    console.error('Mailgun Error:', error);
    
    // Check if this is a sandbox domain authorization error
    const isSandboxAuthError = error.message && (
      error.message.includes('not authorized') || 
      error.message.includes('has not been authorized') ||
      error.message.includes('sandbox')
    );
    
    return { 
      success: false, 
      error: error.message || 'Unknown error sending email',
      isSandboxAuthError
    };
  }
}

/**
 * Format calculation results as HTML for email
 * @param data Calculation data and user information
 * @returns HTML string for email body
 */
function formatCalculationEmailHtml(data: CalculationEmailData): string {
  // Extract display results into a HTML format
  const resultsHtml = data.calculationData.displayResults
    .map(result => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${result.label}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${result.value}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${getCalculatorTitle(data.calculationType)} Results</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://wisebond.co.za/logo.png" alt="WiseBond Logo" style="max-width: 200px;">
        </div>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #1a3d6c; margin-top: 0;">Your Calculation Results</h1>
          <p>Hello ${data.firstName},</p>
          <p>Thank you for using our ${getCalculatorTitle(data.calculationType)}. Here are your results:</p>
        </div>
        
        <div style="border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <div style="background-color: #1a3d6c; color: white; padding: 12px 20px;">
            <h2 style="margin: 0; font-size: 18px;">${getCalculatorTitle(data.calculationType)} Results</h2>
          </div>
          <div style="padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${resultsHtml}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1a3d6c; margin-top: 0;">Next Steps</h3>
          <p>Want to explore more of our financial tools?</p>
          <ul>
            <li>Try our other calculators</li>
            <li>Speak with one of our consultants for personalized advice</li>
            <li>Apply for pre-approval to streamline your home buying process</li>
          </ul>
          <p>
            <a href="https://wisebond.co.za/calculators" style="display: inline-block; background-color: #1a3d6c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Explore More Tools
            </a>
          </p>
        </div>
        
        <div style="text-align: center; color: #666666; font-size: 12px; margin-top: 30px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} WiseBond. All rights reserved.</p>
          <p>
            <a href="https://wisebond.co.za/privacy" style="color: #1a3d6c; text-decoration: none;">Privacy Policy</a> | 
            <a href="https://wisebond.co.za/terms" style="color: #1a3d6c; text-decoration: none;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format calculation results as plain text for email
 * @param data Calculation data and user information
 * @returns Plain text string for email body
 */
function formatCalculationEmailText(data: CalculationEmailData): string {
  // Extract display results into a text format
  const resultsText = data.calculationData.displayResults
    .map(result => `${result.label}: ${result.value}`)
    .join('\n');

  return `
Your ${getCalculatorTitle(data.calculationType)} Results

Hello ${data.firstName},

Thank you for using our ${getCalculatorTitle(data.calculationType)}. Here are your results:

--- ${getCalculatorTitle(data.calculationType)} Results ---
${resultsText}
---

Next Steps:
- Try our other calculators
- Speak with one of our consultants for personalized advice
- Apply for pre-approval to streamline your home buying process

Visit https://wisebond.co.za/calculators to explore more tools.

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} WiseBond. All rights reserved.
  `;
}

/**
 * Send calculation results via email
 * @param data Calculation data and user information
 * @returns Promise resolving to object with success status and error details
 */
export async function sendCalculationEmail(data: CalculationEmailData): Promise<{success: boolean, error?: string, isSandboxAuthError?: boolean}> {
  const calculatorTitle = getCalculatorTitle(data.calculationType);
  
  return await sendEmail({
    to: data.email,
    from: process.env.MAILGUN_FROM_EMAIL || 'noreply@example.com',
    subject: `Your ${calculatorTitle} Results from WiseBond`,
    text: formatCalculationEmailText(data),
    html: formatCalculationEmailHtml(data)
  });
}

/**
 * Format verification email as HTML
 * @param data Verification data
 * @param variation The variation number (1 or 2)
 * @returns HTML string for email body
 */
function formatVerificationEmailHtml(data: VerificationEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #ffffff; background-color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo-white.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #444444; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin-top: 0; text-align: center;">Verify Your Email</h1>
            <p>Hello ${data.firstName},</p>
            <p>Thank you for creating an account with WiseBond. Please use the verification code below to complete your registration:</p>
            
            <div style="background-color: #555555; padding: 15px; border-radius: 5px; text-align: center; margin: 30px 0; letter-spacing: 5px; font-size: 24px; font-weight: bold;">
              ${data.verificationCode}
            </div>
            
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not sign up for a WiseBond account, please ignore this email or contact our support team.</p>
          </div>
          
          <div style="text-align: center; color: #999999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} WiseBond. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #cccccc; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #cccccc; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 30px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h1 style="color: #1a3d6c; margin-top: 0; text-align: center;">Almost There!</h1>
            <p>Hi ${data.firstName},</p>
            <p>You're one step away from accessing personalized home loan services. Enter this verification code to activate your account:</p>
            
            <div style="background-color: #1a3d6c; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 30px 0; letter-spacing: 5px; font-size: 24px; font-weight: bold;">
              ${data.verificationCode}
            </div>
            
            <p style="font-size: 13px; color: #666666;">This code is valid for 15 minutes. For security reasons, please don't share this code with anyone.</p>
          </div>
          
          <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1a3d6c; margin-top: 0;">Why verify your email?</h3>
            <p>Email verification helps us:</p>
            <ul>
              <li>Secure your account</li>
              <li>Send you important updates about your home loan journey</li>
              <li>Provide personalized financial calculations and advice</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #666666; font-size: 12px; margin-top: 30px;">
            <p>If you didn't create an account with Wise Bond, please disregard this email.</p>
            <p>&copy; ${new Date().getFullYear()} Wise Bond (Pty) Ltd. Registration No: 2025/291726/07. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #1a3d6c; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #1a3d6c; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Format verification email as plain text
 * @param data Verification data
 * @param variation The variation number (1 or 2)
 * @returns Plain text string for email body
 */
function formatVerificationEmailText(data: VerificationEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
VERIFY YOUR EMAIL

Hello ${data.firstName},

Thank you for creating an account with WiseBond. Please use the verification code below to complete your registration:

${data.verificationCode}

This code will expire in 15 minutes.

If you did not sign up for a WiseBond account, please ignore this email or contact our support team.

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  } else {
    return `
YOUR VERIFICATION CODE

Hi ${data.firstName},

You're one step away from accessing personalized home loan services. Enter this verification code to activate your account:

${data.verificationCode}

This code is valid for 15 minutes. For security reasons, please don't share this code with anyone.

Why verify your email?
Email verification helps us:
- Secure your account
- Send you important updates about your home loan journey
- Provide personalized financial calculations and advice

If you didn't create an account with WiseBond, please disregard this email.
© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  }
}

/**
 * Send verification email
 * @param data Verification data including user's name, email, and OTP code
 * @returns Promise resolving to object with success status and error details
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<{success: boolean, error?: string, isSandboxAuthError?: boolean}> {
  // Randomly select variation 1 or 2
  const variation = Math.random() < 0.5 ? 1 : 2;
  
  return await sendEmail({
    to: data.email,
    from: process.env.MAILGUN_FROM_EMAIL || 'verification@wisebond.co.za',
    subject: variation === 1 ? 'Verify Your Email - WiseBond' : 'Your Verification Code from WiseBond',
    text: formatVerificationEmailText(data, variation),
    html: formatVerificationEmailHtml(data, variation)
  });
}

/**
 * Format welcome email as HTML - with two variations
 * @param data Welcome data
 * @param variation The variation number (1 or 2)
 * @returns HTML string for email body
 */
function formatWelcomeEmailHtml(data: WelcomeEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome aboard!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #ffffff; background-color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo-white.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #444444; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin-top: 0; text-align: center;">Welcome aboard!</h1>
            <p>Hello ${data.firstName},</p>
            <p>Thank you for joining WiseBond! Your account has been successfully activated, and you now have access to all our home loan tools and services.</p>
            
            <div style="background-color: #555555; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <h3 style="color: #ffffff; margin-top: 0;">What's next?</h3>
              <ul style="color: #ffffff;">
                <li>Explore our range of calculators to understand your home loan options</li>
                <li>Start saving your calculation results for future reference</li>
                <li>Apply for a home loan pre-approval to strengthen your property offer</li>
              </ul>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://wisebond.co.za/calculators" style="display: inline-block; background-color: #1a3d6c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Start Exploring
                </a>
              </div>
            </div>
            
            <p>If you have any questions, our team is here to help. Just reply to this email or contact our support team.</p>
          </div>
          
          <div style="text-align: center; color: #999999; font-size: 12px; margin-top: 30px;">
            <p>&copy; ${new Date().getFullYear()} WiseBond. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #cccccc; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #cccccc; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your journey begins now!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 30px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h1 style="color: #1a3d6c; margin-top: 0; text-align: center;">Your journey begins now!</h1>
            <p>Hi ${data.firstName},</p>
            <p>Your account is all set up and ready to go! We're excited to help you navigate the home loan process with ease and confidence.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <img src="https://wisebond.co.za/welcome-graphic.png" alt="Welcome" style="max-width: 100%; border-radius: 8px;">
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1a3d6c; border-bottom: 2px solid #1a3d6c; padding-bottom: 10px;">Discover WiseBond Tools</h2>
            
            <div style="display: flex; margin-bottom: 20px;">
              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-right: 10px; flex: 1;">
                <h3 style="color: #1a3d6c; margin-top: 0;">Financial Calculators</h3>
                <p>Explore our suite of calculators to understand your buying power and loan options.</p>
                <a href="https://wisebond.co.za/calculators" style="color: #1a3d6c; text-decoration: none; font-weight: bold;">Try Now →</a>
              </div>
              
              <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-left: 10px; flex: 1;">
                <h3 style="color: #1a3d6c; margin-top: 0;">Home Loan Applications</h3>
                <p>Ready to buy? Start your application process with guided assistance.</p>
                <a href="https://wisebond.co.za/apply" style="color: #1a3d6c; text-decoration: none; font-weight: bold;">Get Started →</a>
              </div>
            </div>
          </div>
          
          <div style="background-color: #1a3d6c; color: white; border-radius: 8px; padding: 20px; text-align: center;">
            <h3 style="margin-top: 0;">Need assistance?</h3>
            <p>Our team of experts is ready to help you with any questions you may have.</p>
            <a href="mailto:support@wisebond.co.za" style="display: inline-block; background-color: white; color: #1a3d6c; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Contact Us
            </a>
          </div>
          
          <div style="text-align: center; color: #666666; font-size: 12px; margin-top: 30px;">
            <p>&copy; ${new Date().getFullYear()} Wise Bond (Pty) Ltd. Registration No: 2025/291726/07. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #1a3d6c; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #1a3d6c; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Format welcome email as plain text - with two variations
 * @param data Welcome data
 * @param variation The variation number (1 or 2)
 * @returns Plain text string for email body
 */
function formatWelcomeEmailText(data: WelcomeEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
WELCOME ABOARD!

Hello ${data.firstName},

Thank you for joining WiseBond! Your account has been successfully activated, and you now have access to all our home loan tools and services.

What's next?
- Explore our range of calculators to understand your home loan options
- Start saving your calculation results for future reference
- Apply for a home loan pre-approval to strengthen your property offer

Visit https://wisebond.co.za/calculators to start exploring.

If you have any questions, our team is here to help. Just reply to this email or contact our support team.

© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  } else {
    return `
YOUR JOURNEY BEGINS NOW!

Hi ${data.firstName},

Your account is all set up and ready to go! We're excited to help you navigate the home loan process with ease and confidence.

Discover WiseBond Tools:

Financial Calculators
Explore our suite of calculators to understand your buying power and loan options.
Try Now: https://wisebond.co.za/calculators

Home Loan Applications
Ready to buy? Start your application process with guided assistance.
Get Started: https://wisebond.co.za/apply

Need assistance?
Our team of experts is ready to help you with any questions you may have.
Contact us at support@wisebond.co.za

© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  }
}

/**
 * Send welcome email to a newly verified user
 * @param data Welcome email data
 * @returns Promise resolving to object with success status and error details
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{success: boolean, error?: string, isSandboxAuthError?: boolean}> {
  // Randomly select variation 1 or 2
  const variation = Math.random() < 0.5 ? 1 : 2;
  
  return await sendEmail({
    to: data.email,
    from: process.env.MAILGUN_FROM_EMAIL || 'welcome@wisebond.co.za',
    subject: variation === 1 ? 'Welcome aboard! Your WiseBond account is active' : 'Your journey begins now! Welcome to WiseBond',
    text: formatWelcomeEmailText(data, variation),
    html: formatWelcomeEmailHtml(data, variation)
  });
}

/**
 * Format password reset email as HTML - with two variations
 * @param data Password reset data
 * @param variation The variation number (1 or 2)
 * @returns HTML string for email body
 */
function formatPasswordResetEmailHtml(data: PasswordResetEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #ffffff; background-color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo-white.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #444444; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin-top: 0; text-align: center;">Reset Your Password</h1>
            <p>Hello ${data.firstName},</p>
            <p>We received a request to reset your password for your WiseBond account. Please click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="display: inline-block; background-color: #1a3d6c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
          </div>
          
          <div style="text-align: center; color: #999999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} WiseBond. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #cccccc; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #cccccc; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://wisebond.co.za/logo.png" alt="WiseBond Logo" style="max-width: 200px;">
          </div>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 30px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h1 style="color: #1a3d6c; margin-top: 0; text-align: center;">Password Reset Request</h1>
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset the password for your WiseBond account. To proceed with this request, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="display: inline-block; background-color: #1a3d6c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Create New Password
              </a>
            </div>
            
            <p style="font-size: 13px; color: #666666;">For security, this link is only valid for the next hour and can only be used once.</p>
          </div>
          
          <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1a3d6c; margin-top: 0;">Security Tips</h3>
            <ul>
              <li>Create a strong password that includes uppercase and lowercase letters, numbers, and special characters</li>
              <li>Never share your password with anyone</li>
              <li>Use a unique password for your WiseBond account</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #666666; font-size: 12px; margin-top: 30px;">
            <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Wise Bond (Pty) Ltd. Registration No: 2025/291726/07. All rights reserved.</p>
            <p>
              <a href="https://wisebond.co.za/privacy" style="color: #1a3d6c; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://wisebond.co.za/terms" style="color: #1a3d6c; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Format password reset email as plain text - with two variations
 * @param data Password reset data
 * @param variation The variation number (1 or 2)
 * @returns Plain text string for email body
 */
function formatPasswordResetEmailText(data: PasswordResetEmailData, variation: 1 | 2): string {
  if (variation === 1) {
    return `
RESET YOUR PASSWORD

Hello ${data.firstName},

We received a request to reset your password for your WiseBond account. Please use the link below to create a new password:

${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact our support team if you have concerns.

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  } else {
    return `
PASSWORD RESET REQUEST

Hi ${data.firstName},

We received a request to reset the password for your WiseBond account. To proceed with this request, please click the link below:

${data.resetUrl}

For security, this link is only valid for the next hour and can only be used once.

Security Tips:
- Create a strong password that includes uppercase and lowercase letters, numbers, and special characters
- Never share your password with anyone
- Use a unique password for your WiseBond account

If you didn't request a password reset, please ignore this email or contact our support team.
© ${new Date().getFullYear()} WiseBond. All rights reserved.
    `;
  }
}

/**
 * Send password reset email
 * @param data Password reset data including user's name, email, and reset token/URL
 * @returns Promise resolving to object with success status and error details
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{success: boolean, error?: string, isSandboxAuthError?: boolean}> {
  // Randomly select variation 1 or 2
  const variation = Math.random() < 0.5 ? 1 : 2;
  
  return await sendEmail({
    to: data.email,
    from: process.env.MAILGUN_FROM_EMAIL || 'security@wisebond.co.za',
    subject: variation === 1 ? 'Reset Your WiseBond Password' : 'WiseBond Password Reset Request',
    text: formatPasswordResetEmailText(data, variation),
    html: formatPasswordResetEmailHtml(data, variation)
  });
}

/**
 * Get a user-friendly title for a calculator type
 * @param type - The calculator type identifier
 * @returns A formatted title
 */
function getCalculatorTitle(type: string): string {
  switch (type) {
    case 'bond':
    case 'bond-repayment':
      return 'Bond Repayment Calculator';
    case 'affordability':
      return 'Affordability Calculator';
    case 'deposit-savings':
      return 'Deposit Savings Calculator';
    case 'transfer-costs':
      return 'Transfer Costs Calculator';  
    case 'additional-payment':
      return 'Additional Payment Calculator';
    case 'amortization':
      return 'Amortization Calculator';
    default:
      return 'Calculator';
  }
}