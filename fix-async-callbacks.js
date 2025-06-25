// Fix async callback issues in storage.ts
import fs from 'fs';

const filePath = 'server/storage.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix withRetry callbacks that need to be async
content = content.replace(/await withRetry\(\(\) => \(await getDatabase\(\)\)\./g, 'await withRetry(async () => (await getDatabase()).');

// Fix other async callback patterns
content = content.replace(/await withRetry\(\(\) => db\./g, 'await withRetry(async () => db.');

fs.writeFileSync(filePath, content);
console.log('Fixed async callback issues in storage.ts');