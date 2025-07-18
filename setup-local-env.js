#!/usr/bin/env node

/**
 * Local Environment Setup Script
 * 
 * This script helps you set up API keys for local development testing.
 * It creates a .env.local file that is ignored by git.
 * 
 * Usage: node setup-local-env.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupLocalEnv() {
  console.log('🔧 WiseBond Local Environment Setup');
  console.log('====================================\n');
  
  console.log('This script will help you set up API keys for local development.');
  console.log('The .env.local file will be created and ignored by git.\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📧 Mailgun Configuration (for email services):');
  console.log('   Get your API key from: https://app.mailgun.com/app/account/security/api_keys\n');
  
  const mailgunApiKey = await question('Mailgun API Key: ');
  const mailgunDomain = await question('Mailgun Domain (default: wisebond.co.za): ') || 'wisebond.co.za';
  const mailgunFromEmail = await question('From Email (default: postmaster@wisebond.co.za): ') || 'postmaster@wisebond.co.za';

  console.log('\n🗺️  Google Maps Configuration (for address autocomplete):');
  console.log('   Get your API key from: https://console.cloud.google.com/apis/credentials\n');
  
  const googleMapsApiKey = await question('Google Maps API Key: ');

  console.log('\n🔐 Session Secret (for user sessions):');
  const sessionSecret = await question('Session Secret (default: dev-secret-key): ') || 'dev-secret-key';

  // Create .env.local content
  const envContent = `# WiseBond Local Development Environment
# This file is ignored by git and should not be committed

# Mailgun Email Service
MAILGUN_API_KEY=${mailgunApiKey}
MAILGUN_DOMAIN=${mailgunDomain}
MAILGUN_FROM_EMAIL=${mailgunFromEmail}

# Google Maps API
GOOGLE_MAPS_API_KEY=${googleMapsApiKey}
VITE_GOOGLE_MAPS_API_KEY=${googleMapsApiKey}

# Session Management
SESSION_SECRET=${sessionSecret}

# Development Settings
NODE_ENV=development
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test email functionality');
    console.log('3. Test Google Maps integration');
    console.log('\n⚠️  Remember: Never commit API keys to version control!');
    
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled.');
  rl.close();
  process.exit(0);
});

setupLocalEnv().catch(console.error); 