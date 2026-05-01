const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const envSetup = require('./set-env.cjs');

// Parse arguments
const args = process.argv.slice(2);

// Check if dev or prod is provided
const env = args.find(arg => arg === 'dev' || arg === 'prod') || 'dev';
envSetup.init(env);

// Filter out the env arg to get the actual user details
const userArgs = args.filter(arg => arg !== 'dev' && arg !== 'prod');

if (userArgs.length < 3) {
  console.log("Usage: node register-admin.cjs [dev|prod] <FullName> <Email> <Password>");
  console.log("Example: node register-admin.cjs dev \"John Doe\" john@example.com mysecurepassword");
  process.exit(1);
}

const [fullName, email, password] = userArgs;

async function registerAdmin() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    const client = await pool.connect();
    try {
      console.log(`Checking if ${email} exists...`);
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        console.error(`❌ Error: User with email ${email} already exists (ID: ${existing.rows[0].id}).`);
        process.exit(1);
      }

      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      console.log('Creating admin user...');
      const result = await client.query(
        'INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [fullName, email, hashedPassword]
      );
      
      console.log(`✅ Admin user registered successfully!`);
      console.log(`Name: ${fullName}`);
      console.log(`Email: ${email}`);
      console.log(`ID: ${result.rows[0].id}`);
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error registering admin:", error.message);
  } finally {
    await pool.end();
  }
}

registerAdmin();
