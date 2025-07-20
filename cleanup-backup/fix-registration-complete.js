#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixStorageImplementation() {
  const storagePath = path.join(__dirname, 'server/storage.ts');
  let content = fs.readFileSync(storagePath, 'utf8');
  
  // Add OTP store property to DatabaseStorage class
  if (!content.includes('private otpStore')) {
    content = content.replace(
      'export class DatabaseStorage implements IStorage {',
      'export class DatabaseStorage implements IStorage {\n  private otpStore = new Map<number, { otp: string; expiresAt: Date }>();'
    );
  }
  
  // Add OTP methods to DatabaseStorage class
  const otpMethods = `
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otpStore.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const stored = this.otpStore.get(userId);
    if (!stored) return false;
    
    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(userId);
      return false;
    }
    
    if (stored.otp === otp) {
      this.otpStore.delete(userId);
      return true;
    }
    
    return false;
  }`;

  // Insert OTP methods after verifyPassword method in DatabaseStorage
  const verifyPasswordEnd = content.indexOf('  }', content.indexOf('async verifyPassword'));
  if (verifyPasswordEnd > -1 && !content.includes('async storeOTP')) {
    content = content.slice(0, verifyPasswordEnd + 3) + otpMethods + content.slice(verifyPasswordEnd + 3);
  }
  
  // Add OTP store to MemStorage class
  if (!content.includes('otps: Map')) {
    content = content.replace(
      'export class MemStorage implements IStorage {',
      'export class MemStorage implements IStorage {\n  otps = new Map<number, { otp: string; expiresAt: Date }>();'
    );
  }

  // Add OTP methods to MemStorage class
  const memOtpMethods = `
  async storeOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    this.otps.set(userId, { otp, expiresAt });
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const stored = this.otps.get(userId);
    if (!stored) return false;
    
    if (new Date() > stored.expiresAt) {
      this.otps.delete(userId);
      return false;
    }
    
    if (stored.otp === otp) {
      this.otps.delete(userId);
      return true;
    }
    
    return false;
  }`;

  // Insert OTP methods after verifyPassword method in MemStorage
  const memVerifyPasswordEnd = content.lastIndexOf('  }', content.lastIndexOf('async verifyPassword'));
  if (memVerifyPasswordEnd > -1 && !content.includes('this.otps.set')) {
    content = content.slice(0, memVerifyPasswordEnd + 3) + memOtpMethods + content.slice(memVerifyPasswordEnd + 3);
  }
  
  fs.writeFileSync(storagePath, content);
  console.log('✓ Added OTP methods to storage implementations');
}

function fixRoutesFile() {
  const routesPath = path.join(__dirname, 'server/routes.ts');
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Replace all `storage.` references with proper await getStorage() pattern
  content = content.replace(
    /(\s+)(const storage = await getStorage\(\);\s+)?(\s*)(await\s+)?storage\./g,
    (match, indent, existingDecl, extraSpace, awaitKeyword) => {
      if (existingDecl) {
        // Storage already declared, just use it
        return `${indent}${awaitKeyword || 'await '}storage.`;
      } else {
        // Need to declare storage first
        return `${indent}const storage = await getStorage();\n${indent}${awaitKeyword || 'await '}storage.`;
      }
    }
  );
  
  // Clean up duplicate storage declarations
  content = content.replace(/(\s+const storage = await getStorage\(\);\s*)+/g, (match) => {
    const lines = match.split('\n');
    return lines[0] + '\n';
  });
  
  fs.writeFileSync(routesPath, content);
  console.log('✓ Fixed storage references in routes.ts');
}

try {
  fixStorageImplementation();
  fixRoutesFile();
  console.log('✓ Registration fix complete - should no longer hang');
} catch (error) {
  console.error('Error fixing registration:', error);
}