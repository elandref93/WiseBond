import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';

console.log('Starting test...');

try {
  // Create a PostgreSQL session store
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const PgSessionStore = connectPg(session);
  const sessionStore = new PgSessionStore({ 
    pool, 
    createTableIfMissing: true,
    tableName: 'sessions'
  });
  
  console.log('Session store created successfully!');
} catch (error) {
  console.error('Error creating session store:', error);
}