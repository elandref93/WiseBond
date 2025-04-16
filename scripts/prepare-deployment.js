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
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Configuration
const SOURCE_DIR = path.resolve(__dirname, '../dist');
const OUTPUT_DIR = path.resolve(__dirname, '../deployment');
const DEPLOYIGNORE_FILE = path.resolve(__dirname, '../.deployignore');

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

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Remove SOURCE_DIR prefix for consistent relative paths
      const relativePath = path.relative(SOURCE_DIR, fullPath);
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
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
 * Recursively copies files and directories from source to destination.
 * @param {string} sourcePath - The source directory/file path.
 * @param {string} destPath - The destination directory path.
 */
function copyRecursiveSync(sourcePath, destPath) {
  const stats = fs.statSync(sourcePath);

  // If sourcePath is a directory, create the directory at destination and recursively copy contents
  if (stats.isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    const items = fs.readdirSync(sourcePath);
    items.forEach(item => {
      const currentSource = path.join(sourcePath, item);
      const currentDest = path.join(destPath, item);
      copyRecursiveSync(currentSource, currentDest);  // Recursively copy each item
    });
  } else {
    // If it's a file, copy it to the destination
    fs.copyFileSync(sourcePath, destPath);
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
    // copyRecursiveSync(sourcePath, outputPath);
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
  console.log("Source Dir -> ", SOURCE_DIR)
  console.log("Deployment Dir -> ", OUTPUT_DIR)
  console.log("Ignore File -> ", DEPLOYIGNORE_FILE)
  console.log('Starting deployment preparation...');

  console.log('Running React build...on -> ', SOURCE_DIR);
  execSync('npm run build', { stdio: 'inherit' });
  
  // const ignorePatterns = readDeployIgnore();
  // console.log(`Read ${ignorePatterns.length} ignore patterns from .deployignore`);
  
  prepareOutputDirectory();
  
  // const filesToInclude = getFilesToInclude(ignorePatterns);
  const filesToInclude = getAllFiles(SOURCE_DIR);
  console.log(`Found ${filesToInclude.length} files to include in deployment`);
  
  copyFilesToOutput(filesToInclude);
  
  preparePackageJson();
  
  console.log('Deployment preparation completed! Output directory:', OUTPUT_DIR);
}

// Run the script
main();