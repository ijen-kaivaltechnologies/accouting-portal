const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envFileMapping = {
  dev: ".env.dev",
  prod: ".env",
};

const envMapping = {
  dev: "development",
  prod: "production",
};

exports.init = (env = "dev") => {
  const envFile = envFileMapping[env];
  const envPath = path.resolve(__dirname, envFile);

  if (!fs.existsSync(envPath)) {
    console.error(`Environment file ${envPath} not found`);
    process.exit(1);
  }

  // Load environment variables
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });

  // Set NODE_ENV
  process.env.NODE_ENV = envMapping[env];

  console.log(`Environment set to ${env}`);
  console.log("Loaded environment variables:");
};
