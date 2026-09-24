const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['TURSO_CATALOG_URL', 'TURSO_CATALOG_AUTH_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file');
  process.exit(1);
}

// Read schema and seed files
let schema = '';
let seedData = '';

try {
  schema = fs.readFileSync('./database/catalog-db/schema.sql', 'utf8');
} catch (error) {
  console.error('Error reading schema file:', error.message);
  process.exit(1);
}

try {
  seedData = fs.readFileSync('./database/catalog-db/seed.sql', 'utf8');
} catch (error) {
  console.error('Error reading seed file:', error.message);
  // Seed data is optional, so we'll continue with just schema
  console.log('Continuing with schema only (no seed data)');
  seedData = '';
}

// Initialize Turso client
const client = createClient({
  url: process.env.TURSO_CATALOG_URL,
  authToken: process.env.TURSO_CATALOG_AUTH_TOKEN
});

async function pushSchema() {
  try {
    console.log('Pushing schema to Turso catalog database...');

    // Split schema into individual statements and execute them
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    for (const statement of statements) {
      if (statement.trim()) {
        await client.execute(statement.trim());
      }
    }

    console.log('Schema pushed successfully!');

    // Optional: Seed data
    if (seedData.trim()) {
      console.log('Seeding initial data...');
      const seedStatements = seedData.split(';').filter(stmt => stmt.trim() !== '');
      for (const statement of seedStatements) {
        if (statement.trim()) {
          await client.execute(statement.trim());
        }
      }
      console.log('Data seeded successfully!');
    } else {
      console.log('No seed data to process');
    }

    console.log('Catalog database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing to Turso:', error);
    process.exit(1);
  }
}

pushSchema();