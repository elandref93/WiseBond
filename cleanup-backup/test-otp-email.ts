// Simple script to test sending an OTP verification email
import { sendVerificationEmail } from "./server/email";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function sendTestOTPEmail() {
  console.log("Sending test OTP verification email...");
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? "Available" : "Missing"}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || "Missing"}`);
  console.log(`Mailgun From Email: ${process.env.MAILGUN_FROM_EMAIL || "Missing"}`);
  
  try {
    const recipientEmail = "elandrefourie18@gmail.com";
    const firstName = "Elandre";
    const otp = "123456"; // Test OTP code
    
    const result = await sendVerificationEmail({
      firstName,
      email: recipientEmail,
      verificationCode: otp
    });
    
    if (result.success) {
      console.log(`OTP verification email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`Failed to send OTP verification email: ${result.error}`);
      
      if (result.isSandboxAuthError) {
        console.warn("This appears to be a sandbox authorization error. Make sure your recipient email is authorized in the Mailgun sandbox domain.");
      }
    }
  } catch (error) {
    console.error("Error sending OTP verification email:", error);
  }
}

sendTestOTPEmail();