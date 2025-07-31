#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildServer() {
  try {
    console.log('🔨 Building server...');
    
    const result = await build({
      entryPoints: ['server/index.ts'],
      bundle: true, // Bundle but exclude problematic modules
      platform: 'node',
      target: 'node22',
      format: 'esm',
      outdir: 'dist',
      external: [
        // All external dependencies
        'vite',
        '../vite.config',
        './vite.config',
        'vite.config',
        'vite.config.ts',
        './vite.config.ts',
        '../vite.config.ts',
        './vite',
        '../vite',
        'vite',
        'nanoid',
        'zod-validation-error',
        // Runtime dependencies
        'drizzle-orm',
        'postgres',
        'postgres/cjs/src/index.js',
        'express',
        'express-session',
        'passport',
        'passport-local',
        'bcrypt',
        'dotenv',
        'connect-pg-simple',
        'helmet',
        'cors',
        'compression',
        'mailgun.js',
        'axios',
        'zod',
        'pdf-lib',
        'puppeteer',
        'ws',
        '@azure/identity',
        '@azure/keyvault-secrets',
        'handlebars',
        'date-fns',
        'form-data',
        'http-errors',
        'path-to-regexp',
        // Database drivers
        'pg',
        'mysql2',
        'sqlite3',
        'better-sqlite3',
        'oracledb',
        'mssql',
        'tedious',
        'pg-native',
        'mysql',
        'mysql2/promise',
        // Problematic packages
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp'
      ],
      sourcemap: false,
      minify: process.env.NODE_ENV === 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      }
    });

    console.log('✅ Server build completed successfully');
    
    // Verify the build output
    const indexPath = path.join(__dirname, 'dist', 'index.js');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log(`✅ dist/index.js exists (${stats.size} bytes)`);
    } else {
      console.error('❌ dist/index.js not found after build');
      process.exit(1);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 