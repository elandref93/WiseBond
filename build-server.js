#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildServer() {
  try {
    console.log('🔨 Building server with proper path mapping...');
    
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
        // Add other externals as needed
      ],
      alias: {
        '@shared': path.resolve(__dirname, 'shared'),
        '@': path.resolve(__dirname, 'client/src'),
      },
      sourcemap: false,
      minify: process.env.NODE_ENV === 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    });

    console.log('✅ Server build completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 