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

<<<<<<< HEAD
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, copyFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const outputDir = join(rootDir, 'deployment');
=======
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
>>>>>>> 7515b1daa9a4499fa565e3cb59b82d43ebc73a56

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
  for (const file of files) {
    const srcPath = join(rootDir, file);
    const destPath = join(outputDir, file);
    
    // Create directory if it doesn't exist
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
<<<<<<< HEAD
    copyFileSync(srcPath, destPath);
  }
=======
    // Copy the file
    // copyRecursiveSync(sourcePath, outputPath);
    fs.copyFileSync(sourcePath, outputPath);
  });
>>>>>>> 7515b1daa9a4499fa565e3cb59b82d43ebc73a56
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
<<<<<<< HEAD
=======

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Remove devDependencies and scripts
  delete packageJson.devDependencies;
  
  // Keep only necessary scripts
  const necessaryScripts = {
    start: packageJson.scripts.serve,
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
>>>>>>> 7515b1daa9a4499fa565e3cb59b82d43ebc73a56
}

/**
 * Main function
 */
function main() {
<<<<<<< HEAD
  console.log('🚀 Preparing deployment package...');
  
  const ignorePatterns = readDeployIgnore();
  console.log(`📋 Found ${ignorePatterns.length} ignore patterns`);
=======
  console.log("Source Dir -> ", SOURCE_DIR)
  console.log("Deployment Dir -> ", OUTPUT_DIR)
  console.log("Ignore File -> ", DEPLOYIGNORE_FILE)
  console.log('Starting deployment preparation...');

  console.log('Running React build...on -> ', SOURCE_DIR);
  execSync('npm run build', { stdio: 'inherit' });
  
  // const ignorePatterns = readDeployIgnore();
  // console.log(`Read ${ignorePatterns.length} ignore patterns from .deployignore`);
>>>>>>> 7515b1daa9a4499fa565e3cb59b82d43ebc73a56
  
  prepareOutputDirectory();
  console.log('🗂️  Cleaned deployment directory');
  
<<<<<<< HEAD
  const filesToInclude = getFilesToInclude(ignorePatterns);
  console.log(`📁 Found ${filesToInclude.length} files to include`);
=======
  // const filesToInclude = getFilesToInclude(ignorePatterns);
  const filesToInclude = getAllFiles(SOURCE_DIR);
  console.log(`Found ${filesToInclude.length} files to include in deployment`);
>>>>>>> 7515b1daa9a4499fa565e3cb59b82d43ebc73a56
  
  copyFilesToOutput(filesToInclude);
  console.log('📋 Copied files to deployment directory');
  
  preparePackageJson();
  
  console.log(`✅ Deployment package ready in: ${outputDir}`);
  console.log('📦 Ready for ZIP deployment to Azure App Service');
}

main();