// Test script to manually set environment variables
// Run this before starting the server to use test credentials

import { spawn } from 'child_process';
import readline from 'readline';
import dotenv from 'dotenv';

// Load any existing values from .env file
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getUserInput(prompt, defaultValue = '') {
  return new Promise((resolve) => {
    const promptText = defaultValue 
      ? `${prompt} (default: ${defaultValue}): `
      : `${prompt}: `;
      
    rl.question(promptText, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

async function setTestEnvironment() {
  console.log('⚙️  Environment Variable Setup');
  console.log('-----------------------------');
  
  console.log('\n📧 Mailgun Configuration:');
  const mailgunApiKey = await getUserInput('Mailgun API Key');
  const mailgunDomain = await getUserInput('Mailgun Domain', 'wisebond.co.za');
  const mailgunFromEmail = await getUserInput('Mailgun From Email', `postmaster@${mailgunDomain}`);
  
  console.log('\n🗺️  Google Maps Configuration:');
  const googleMapsApiKey = await getUserInput('Google Maps API Key');
  
  // Set the environment variables
  process.env.MAILGUN_API_KEY = mailgunApiKey;
  process.env.MAILGUN_DOMAIN = mailgunDomain;
  process.env.MAILGUN_FROM_EMAIL = mailgunFromEmail;
  process.env.GOOGLE_MAPS_API_KEY = googleMapsApiKey;
  process.env.VITE_GOOGLE_MAPS_API_KEY = googleMapsApiKey;

  console.log('\n✅ Environment variables set in memory');
  console.log('\nWould you like to:');
  console.log('1. Start the development server with these values');
  console.log('2. Just exit (variables will be lost when script ends)');
  console.log('3. Update the .env file with these values');
  
  const choice = await getUserInput('Enter your choice (1-3)', '1');
  
  if (choice === '1') {
    console.log('\n🚀 Starting the application...');
    rl.close();
    
    // Start the server with the environment variables set
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: process.env
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  } 
  else if (choice === '3') {
    console.log('\n💾 Updating .env file...');
    // In a real implementation, this would write to the .env file
    console.log('Note: This functionality is not implemented to avoid overwriting your actual .env file.');
    console.log('Please manually update your .env file if needed.');
    rl.close();
  }
  else {
    console.log('\n👋 Exiting. Environment variables were not saved permanently.');
    rl.close();
  }
}

// Run the script
setTestEnvironment();