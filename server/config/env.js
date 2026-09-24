const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TURSO_CATALOG_URL',
  'TURSO_CATALOG_AUTH_TOKEN',
  'TURSO_ORDERS_URL',
  'TURSO_ORDERS_AUTH_TOKEN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Turso Catalog DB
  catalogDbUrl: process.env.TURSO_CATALOG_URL,
  catalogDbAuthToken: process.env.TURSO_CATALOG_AUTH_TOKEN,

  // Turso Orders DB
  ordersDbUrl: process.env.TURSO_ORDERS_URL,
  ordersDbAuthToken: process.env.TURSO_ORDERS_AUTH_TOKEN,

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Bcrypt
  saltRounds: parseInt(process.env.SALT_ROUNDS) || 10,

  // File upload limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB) || 5, // MB

  // Node-cron
  archiveCronTime: process.env.ARCHIVE_CRON_TIME || '0 0 * * *' // Daily at midnight
};