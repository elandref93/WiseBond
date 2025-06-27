#!/usr/bin/env node

/**
 * Simple script to start the server using npx tsx
 * This works around the issue where tsx is not directly available in PATH
 */

import { spawn } from 'child_process';

const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, terminating server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, terminating server...');
  serverProcess.kill('SIGTERM');
});