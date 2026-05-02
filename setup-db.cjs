const fs = require('fs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env'
});

// Read the SQL file
const sql = fs.readFileSync('./freshdb', 'utf-8');
const refer = fs.readFileSync('./refer_migration.db', 'utf-8');

if (!sql || !refer) {
  console.error('SQL file not found');
  process.exit(1);
}

if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD || !process.env.DB_PORT) {
  console.error('Database configuration not found');
  process.exit(1);
}

if (process.env.DB_NAME !== 'userfiles') {
  console.error('Database name is not userfiles, its is mandatory to have database name as userfiles');
  process.exit(1);
}

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function setupDatabase() {
  try {
    // Connect to the database
    const client = await pool.connect();

    try {
      // Execute the SQL file
      try {
        await client.query(sql);
        console.log('SQL file executed successfully');
      } catch (error) {
        console.log(error);
      }
      try {
        await client.query(refer);
        console.log('Refer SQL file executed successfully');
      } catch (error) {
        console.log(error);
      }
      console.log('Database setup completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();