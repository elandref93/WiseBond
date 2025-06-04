/**
 * Prepare Deployment Script
 * 
 * This script prepares a clean deployment package by:
 * 1. Reading the .deployignore file
 * 2. Creating a deployment directory
 * 3. Copying only the necessary files to the deployment directory
 * 
 * Usage: node scripts/prepare-deployment.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, copyFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const outputDir = join(rootDir, 'deployment');

/**
 * Reads the .deployignore file and returns an array of patterns
 */
function readDeployIgnore() {
  const deployIgnorePath = join(rootDir, '.deployignore');
  if (!existsSync(deployIgnorePath)) {
    console.log('No .deployignore file found, including all files');
    return [];
  }
  
  const content = readFileSync(deployIgnorePath, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * Cleans and creates the output directory
 */
function prepareOutputDirectory() {
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true });
  }
  mkdirSync(outputDir, { recursive: true });
}

/**
 * Gets the list of files to include in the deployment
 * @param {string[]} ignorePatterns - Patterns from .deployignore
 * @returns {string[]} List of file paths to include
 */
function getFilesToInclude(ignorePatterns) {
  const files = [];
  
  function walkDir(dir) {
    let items;
    try {
      items = readdirSync(dir);
    } catch (error) {
      // Skip directories that can't be read (system files, broken symlinks, etc.)
      return;
    }
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const relativePath = relative(rootDir, fullPath);
      
      // Skip system directories and hidden files
      if (relativePath.startsWith('.config') || relativePath.startsWith('.cache') || 
          item.startsWith('.') || relativePath.includes('node_modules')) {
        continue;
      }
      
      // Check if this path should be ignored
      const shouldIgnore = ignorePatterns.some(pattern => {
        if (pattern.endsWith('/')) {
          return relativePath.startsWith(pattern) || relativePath === pattern.slice(0, -1);
        }
        return relativePath === pattern || relativePath.includes(pattern);
      });
      
      if (shouldIgnore) {
        continue;
      }
      
      let stat;
      try {
        stat = statSync(fullPath);
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        files.push(relativePath);
      }
    }
  }
  
  walkDir(rootDir);
  return files;
}

/**
 * Copies files to the output directory
 * @param {string[]} files - List of files to copy
 */
function copyFilesToOutput(files) {
  for (const file of files) {
    const srcPath = join(rootDir, file);
    const destPath = join(outputDir, file);
    
    // Create directory if it doesn't exist
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    copyFileSync(srcPath, destPath);
  }
}

/**
 * Prepares production-ready package.json and updates package-lock.json
 */
function preparePackageJson() {
  const packageJsonPath = join(rootDir, 'package.json');
  const deployPackageJsonPath = join(outputDir, 'package.json');
  
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Add Azure-specific configuration
    packageJson.engines = {
      node: ">=20.0.0",
      npm: ">=10.0.0"
    };
    
    // Add postinstall script for Azure
    if (!packageJson.scripts.postinstall) {
      packageJson.scripts.postinstall = "npm run build";
    }
    
    writeFileSync(deployPackageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Prepared production package.json');
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Preparing deployment package...');
  
  const ignorePatterns = readDeployIgnore();
  console.log(`📋 Found ${ignorePatterns.length} ignore patterns`);
  
  prepareOutputDirectory();
  console.log('🗂️  Cleaned deployment directory');
  
  const filesToInclude = getFilesToInclude(ignorePatterns);
  console.log(`📁 Found ${filesToInclude.length} files to include`);
  
  copyFilesToOutput(filesToInclude);
  console.log('📋 Copied files to deployment directory');
  
  preparePackageJson();
  
  console.log(`✅ Deployment package ready in: ${outputDir}`);
  console.log('📦 Ready for ZIP deployment to Azure App Service');
}

main();