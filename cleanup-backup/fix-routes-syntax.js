import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixRoutesSyntax() {
  const routesPath = path.join(__dirname, 'server/routes.ts');
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Fix malformed storage declarations - remove duplicated "const storage = await getStorage();"
  content = content.replace(/(\s+)(const\s+[^=]*=\s+)?const storage = await getStorage\(\);\s*await storage\./g, 
    (match, indent, existingVar) => {
      if (existingVar) {
        // Already has a variable declaration, just fix the await
        return `${indent}${existingVar}await storage.`;
      } else {
        // Need storage declaration
        return `${indent}const storage = await getStorage();\n${indent}await storage.`;
      }
    }
  );
  
  // Fix lines where storage declaration got merged with variable assignment
  content = content.replace(/const\s+(\w+)\s*=\s*const storage = await getStorage\(\);\s*await storage\.([^(]+\([^)]*\));/g,
    'const storage = await getStorage();\n      const $1 = await storage.$2;'
  );
  
  // Remove duplicate storage declarations in same scope
  content = content.replace(/(const storage = await getStorage\(\);\s*){2,}/g, 'const storage = await getStorage();\n      ');
  
  // Fix missing method implementations by using correct method names
  content = content.replace(/storage\.verifyUser\(/g, 'storage.verifyPassword(');
  content = content.replace(/storage\.getUser\(/g, 'storage.getUserById(');
  
  fs.writeFileSync(routesPath, content);
  console.log('✓ Fixed routes syntax errors');
}

try {
  fixRoutesSyntax();
} catch (error) {
  console.error('Error fixing routes:', error);
}