// Simple script to test sending a welcome email
const { sendWelcomeEmail } = require("./server/email");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

async function sendTestWelcomeEmail() {
  console.log("Sending test welcome email...");
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? "Available" : "Missing"}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || "Missing"}`);
  console.log(`Mailgun From Email: ${process.env.MAILGUN_FROM_EMAIL || "Missing"}`);
  
  try {
    const recipientEmail = "elandrefourie18@gmail.com";
    const firstName = "Elandre";
    
    const result = await sendWelcomeEmail({
      firstName,
      email: recipientEmail
    });
    
    if (result.success) {
      console.log(`Welcome email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`Failed to send welcome email: ${result.error}`);
      
      if (result.isSandboxAuthError) {
        console.warn("This appears to be a sandbox authorization error. Make sure your recipient email is authorized in the Mailgun sandbox domain.");
      }
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

sendTestWelcomeEmail();