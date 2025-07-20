#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixRoutesStorage() {
  const routesPath = path.join(__dirname, 'server/routes.ts');
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Find all async route handlers that use storage
  const routeHandlerRegex = /app\.(get|post|put|delete)\([^{]*\{[^}]*async[^}]*\([^)]*\)[^{]*=>[^{]*\{([^}]|{[^}]*})*storage\./g;
  
  // Replace storage references with const storage = await getStorage();
  content = content.replace(/(\s+)(await\s+storage\.)/g, (match, indent, storageCall) => {
    return `${indent}const storage = await getStorage();\n${indent}${storageCall}`;
  });
  
  // Remove duplicate storage declarations
  content = content.replace(/(\s+const storage = await getStorage\(\);\s*)+/g, (match) => {
    return match.split('\n')[0] + '\n';
  });
  
  fs.writeFileSync(routesPath, content);
  console.log('✓ Fixed storage references in routes.ts');
}

try {
  fixRoutesStorage();
} catch (error) {
  console.error('Error fixing routes:', error);
}