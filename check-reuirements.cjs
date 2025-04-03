const { execSync } = require("child_process");
const packageJson = require("./package.json");
const { Pool } = require("pg");
const {compareVersions} = require("compare-versions");

const checks = {
  nodeVersion: {
    required: "18.0.0",
    check: () => {
      const version = execSync("node --version").toString().trim();
      return { version, valid: compareVersions(version, checks.nodeVersion.required) >= 0 };
    },
  },
  npmVersion: {
    required: "8.0.0",
    check: () => {
      const version = execSync("npm --version").toString().trim();
      return { version, valid: compareVersions(version, checks.npmVersion.required) >= 0 };
    },
  },
  environment: {
    required: [
      "PORT",
      "DB_USER",
      "DB_HOST",
      "DB_NAME",
      "DB_PASSWORD",
      "DB_PORT",
      "JWT_SECRET",
      "BASE_URL",
      "VITE_API_BASE_URL",
    ],
    check: () => {
      const missing = [];
      const invalid = [];
      const values = {};

      checks.environment.required.forEach((varName) => {
        const value = process.env[varName];
        values[varName] = value;

        if (!value) {
          missing.push(varName);
        } else {
          // Basic validation for some variables
          if (
            varName === "PORT" &&
            (isNaN(value) || value < 1 || value > 65535)
          ) {
            invalid.push(`${varName} (invalid port number)`);
          }
          if (
            varName === "DB_PORT" &&
            (isNaN(value) || value < 1 || value > 65535)
          ) {
            invalid.push(`${varName} (invalid port number)`);
          }
          if (varName === "JWT_SECRET" && value.length < 8) {
            invalid.push(
              `${varName} (too short, should be at least 8 characters)`
            );
          }
        }
      });

      return { missing, invalid, values };
    },
  },
  database: {
    check: async () => {
      try {
        const pool = new Pool({
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: parseInt(process.env.DB_PORT),
        });

        // Check database connection
        await pool.query("SELECT 1");

        // Check if userfiles database exists
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM pg_database 
            WHERE datname = 'userfiles'
          )
        `);

        const exists = result.rows[0].exists;

        await pool.end();
        return { exists, valid: exists };
      } catch (error) {
        console.error("Database connection error:", error.message);
        return { exists: false, valid: false };
      }
    },
  },
};

const runChecks = async () => {
  console.log("Running application requirements check...\n");

  // Node.js version check
  const nodeCheck = checks.nodeVersion.check();
  console.log(`Node.js version: ${nodeCheck.version}`);
  if (!nodeCheck.valid) {
    console.error(
      `Error: Node.js version ${checks.nodeVersion.required} or higher is required`
    );
  }

  // npm version check
  const npmCheck = checks.npmVersion.check();
  console.log(`npm version: ${npmCheck.version}`);
  if (!npmCheck.valid) {
    console.error(
      `Error: npm version ${checks.npmVersion.required} or higher is required`
    );
  }

  // Environment variables check
  const envCheck = checks.environment.check();
  if (envCheck.missing.length > 0) {
    console.error("\nMissing environment variables:");
    envCheck.missing.forEach((varName) => console.error(`- ${varName}`));
  }

  if (envCheck.invalid.length > 0) {
    console.error("\nInvalid environment variables:");
    envCheck.invalid.forEach((varName) => console.error(`- ${varName}`));
  }

  // Database check
  const dbCheck = await checks.database.check();
  console.log("\nDatabase check:");
  if (dbCheck.valid) {
    console.log("✅ Database connection successful");
    console.log("✅ userfiles database exists");
  } else {
    console.error("❌ Database connection failed");
    if (!dbCheck.exists) {
      console.error("❌ userfiles database does not exist");
    }
  }

  // Summary
  console.log("\nSummary:");
  const hasErrors =
    !nodeCheck.valid ||
    !npmCheck.valid ||
    envCheck.missing.length > 0 ||
    envCheck.invalid.length > 0 ||
    !dbCheck.valid;

  if (hasErrors) {
    console.error("❌ Requirements check failed. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log("✅ All requirements met! Your application is ready to run.");
  }
};

exports.check = async () => {
  await runChecks();
  return true;
};
