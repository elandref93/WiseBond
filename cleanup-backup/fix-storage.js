// Quick fix script to replace all 'db.' references with proper database connection
import fs from 'fs';

const filePath = 'server/storage.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all instances where db is used without being defined
content = content.replace(/await db\./g, 'await (await getDatabase()).');
content = content.replace(/\bdb\./g, '(await getDatabase()).');

// Fix specific patterns for SQL queries
content = content.replace(/await withRetry\(\(\) => db\.execute/g, 'await withRetry(async () => (await getDatabase()).execute');

fs.writeFileSync(filePath, content);
console.log('Fixed database references in storage.ts');