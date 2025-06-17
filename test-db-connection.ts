import { testDatabaseConnection } from './server/db.js';

async function main() {
  console.log('Testing database connection...');
  try {
    const result = await testDatabaseConnection();
    console.log('Connection test result:', result);
    process.exit(result ? 0 : 1);
  } catch (error) {
    console.error('Error testing database:', error);
    process.exit(1);
  }
}

main();