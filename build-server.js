#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate build version
function generateBuildVersion() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `build-${timestamp}-${randomSuffix}`;
}

async function buildServer() {
  try {
    const buildVersion = generateBuildVersion();
    console.log('🔨 Building server with proper path mapping...');
    console.log(`📦 Build Version: ${buildVersion}`);
    console.log(`🕐 Build Time: ${new Date().toISOString()}`);
    
    const result = await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'esm',
      outdir: 'dist',
      external: [
        'vite',
        '../vite.config',
        './vite.config',
        'vite.config',
        'vite.config.ts',
        './vite.config.ts',
        '../vite.config.ts',
        // External dependencies that should not be bundled
        'drizzle-orm',
        'drizzle-orm/*',
        'drizzle-orm/postgres-js',
        'drizzle-orm/postgres-js/*',
        'postgres',
        'postgres/*',
        'postgres/src/*',
        'postgres/cjs/*',
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
        // Problematic packages that cause build errors
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp',
        // Add more specific externals
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
        // Development-only files
        './vite',
        '../vite',
        'vite'
      ],
      alias: {
        '@shared': path.resolve(__dirname, 'shared'),
        '@': path.resolve(__dirname, 'client/src'),
      },
      sourcemap: false,
      minify: process.env.NODE_ENV === 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.BUILD_VERSION': JSON.stringify(buildVersion),
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      },
      // Handle problematic file types
      loader: {
        '.html': 'text',
        '.toml': 'text',
        '.json': 'json'
      }
    });

    // Create build info file
    const buildInfo = {
      version: buildVersion,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      npmVersion: process.env.npm_config_user_agent || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      postgresFix: 'applied',
      npmUpgrade: '11.5.1'
    };

    fs.writeFileSync(path.join(__dirname, 'dist', 'build-info.json'), JSON.stringify(buildInfo, null, 2));
    
    console.log('✅ Server build completed successfully');
    console.log(`📋 Build Info: ${JSON.stringify(buildInfo, null, 2)}`);
    return result;
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 