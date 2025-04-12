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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const SOURCE_DIR = '.';
const OUTPUT_DIR = './deployment';
const DEPLOYIGNORE_FILE = '.deployignore';

/**
 * Reads the .deployignore file and returns an array of patterns
 */
function readDeployIgnore() {
  if (!fs.existsSync(DEPLOYIGNORE_FILE)) {
    console.error(`.deployignore file not found at ${DEPLOYIGNORE_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(DEPLOYIGNORE_FILE, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * Cleans and creates the output directory
 */
function prepareOutputDirectory() {
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log(`Cleaning existing output directory: ${OUTPUT_DIR}`);
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  
  console.log(`Creating output directory: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Gets the list of files to include in the deployment
 * @param {string[]} ignorePatterns - Patterns from .deployignore
 * @returns {string[]} List of file paths to include
 */
function getFilesToInclude(ignorePatterns) {
  // Create a temporary .gitignore-like file for deployment
  const tempIgnoreFile = '.temp-deployignore';
  fs.writeFileSync(tempIgnoreFile, ignorePatterns.join('\n'));
  
  try {
    // Get all files that would be included in git (respecting .gitignore)
    // and then exclude files matching patterns in our temporary ignore file
    const result = execSync(`git ls-files | grep -v -f ${tempIgnoreFile}`, { encoding: 'utf8' });
    
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting files:', error.message);
    return [];
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempIgnoreFile)) {
      fs.unlinkSync(tempIgnoreFile);
    }
  }
}

/**
 * Copies files to the output directory
 * @param {string[]} files - List of files to copy
 */
function copyFilesToOutput(files) {
  console.log(`Copying ${files.length} files to ${OUTPUT_DIR}`);
  
  files.forEach(file => {
    const sourcePath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, outputPath);
  });
}

/**
 * Prepares production-ready package.json and updates package-lock.json
 */
function preparePackageJson() {
  if (!fs.existsSync('package.json')) {
    console.error('package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Remove devDependencies and scripts
  delete packageJson.devDependencies;
  
  // Keep only necessary scripts
  const necessaryScripts = {
    start: packageJson.scripts.start,
    build: packageJson.scripts.build
  };
  
  packageJson.scripts = necessaryScripts;
  
  // Write the cleaned package.json to the output directory
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Handle package-lock.json if it exists
  if (fs.existsSync('package-lock.json')) {
    console.log('Copying package-lock.json to deployment directory');
    fs.copyFileSync('package-lock.json', path.join(OUTPUT_DIR, 'package-lock.json'));
  } else {
    console.warn('Warning: package-lock.json not found');
  }
  
  console.log('Prepared production package.json and synchronized package-lock.json');
}

/**
 * Main function
 */
function main() {
  console.log('Starting deployment preparation...');
  
  const ignorePatterns = readDeployIgnore();
  console.log(`Read ${ignorePatterns.length} ignore patterns from .deployignore`);
  
  prepareOutputDirectory();
  
  const filesToInclude = getFilesToInclude(ignorePatterns);
  console.log(`Found ${filesToInclude.length} files to include in deployment`);
  
  copyFilesToOutput(filesToInclude);
  
  preparePackageJson();
  
  console.log('Deployment preparation completed! Output directory:', OUTPUT_DIR);
}

// Run the script
main();