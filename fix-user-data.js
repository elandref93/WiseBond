// This script will help us identify the exact location of the problem
// in storage.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'server', 'storage.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Find the line numbers of the problematic section
let lineNumbers = [];
let foundCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Convert to User type with null values for co-applicant fields') && 
      lines[i+1].includes('const user = {') &&
      lines[i+2].includes('...userData,')) {
    
    lineNumbers.push(i);
    foundCount++;
    
    // Find the end of the block
    let j = i + 3;
    while (j < lines.length && !lines[j].includes('};')) {
      j++;
    }
    
    if (j < lines.length) {
      lineNumbers.push(j);
    }
  }
}

console.log(`Found ${foundCount} occurrences of the pattern.`);
console.log('Line numbers:', lineNumbers);

// Output line content for verification
lineNumbers.forEach(line => {
  console.log(`Line ${line}: ${lines[line]}`);
});