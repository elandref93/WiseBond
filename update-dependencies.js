/**
 * Helper script to update package.json and package-lock.json with the latest versions
 * of the dependencies that were flagged as vulnerable by GitHub.
 * 
 * Run with: node update-dependencies.js
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const packageJsonPath = './package.json';
const packageLockJsonPath = './package-lock.json';

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Packages to update with their secure versions
const packagesToUpdate = {
  'lodash.pick': '4.4.0',
  'drizzle-kit': '0.30.4',
  'html-pdf-node': '1.0.8',
  'vite': '5.4.17'
};

// Update the dependencies in package.json
let updated = false;
for (const [pkg, version] of Object.entries(packagesToUpdate)) {
  if (packageJson.dependencies && packageJson.dependencies[pkg]) {
    packageJson.dependencies[pkg] = `^${version}`;
    updated = true;
    console.log(`Updated ${pkg} to ^${version} in dependencies`);
  } else if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
    packageJson.devDependencies[pkg] = `^${version}`;
    updated = true;
    console.log(`Updated ${pkg} to ^${version} in devDependencies`);
  } else {
    console.log(`Package ${pkg} not found in package.json`);
  }
}

if (updated) {
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json file');
  
  try {
    // Update npm-shrinkwrap.json or package-lock.json
    console.log('Running npm install to update package-lock.json...');
    console.log('This may take a few minutes...');
    await execPromise('npm install --package-lock-only');
    console.log('Successfully updated package-lock.json');
  } catch (error) {
    console.error('Error updating package-lock.json:', error.message);
  }
} else {
  console.log('No updates were needed.');
}