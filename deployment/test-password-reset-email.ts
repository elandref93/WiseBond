// Simple script to test sending a password reset email
import { sendPasswordResetEmail } from "./server/email";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function sendTestPasswordResetEmail() {
  console.log("Sending test password reset email...");
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? "Available" : "Missing"}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || "Missing"}`);
  console.log(`Mailgun From Email: ${process.env.MAILGUN_FROM_EMAIL || "Missing"}`);
  
  try {
    const recipientEmail = "elandrefourie18@gmail.com";
    const firstName = "Elandre";
    const resetToken = "abc123def456";
    const resetUrl = `https://wisebond.co.za/reset-password?token=${resetToken}`;
    
    // Send a password reset email with the random variation
    const result = await sendPasswordResetEmail({
      firstName,
      email: recipientEmail,
      resetToken,
      resetUrl
    });
    
    if (result.success) {
      console.log(`Password reset email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`Failed to send password reset email: ${result.error}`);
      
      if (result.isSandboxAuthError) {
        console.warn("This appears to be a sandbox authorization error. Make sure your recipient email is authorized in the Mailgun sandbox domain.");
      }
    }
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}

sendTestPasswordResetEmail();