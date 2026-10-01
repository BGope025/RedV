const { createClient } = require('@libsql/client');
const { catalogDbUrl, catalogDbAuthToken, ordersDbUrl, ordersDbAuthToken, customerDbUrl, customerDbAuthToken } = require('./env');
const path = require('path');

// Database clients
let catalogDb = null;
let ordersDb = null;
let customerDb = null;

/**
 * Initialize database connections
 */
const initializeDatabaseConnections = () => {
  try {
    const dataPath = process.env.DATA_PATH || process.cwd();

    // Catalog database connection
    const finalCatalogUrl = catalogDbUrl || `file:${path.join(dataPath, 'catalog.db')}`;
    catalogDb = createClient({
      url: finalCatalogUrl,
      ...(catalogDbAuthToken && { authToken: catalogDbAuthToken })
    });

    // Orders database connection
    const finalOrdersUrl = ordersDbUrl || `file:${path.join(dataPath, 'orders.db')}`;
    ordersDb = createClient({
      url: finalOrdersUrl,
      ...(ordersDbAuthToken && { authToken: ordersDbAuthToken })
    });

    // Customers database connection
    const finalCustomerUrl = customerDbUrl || `file:${path.join(dataPath, 'customer.db')}`;
    customerDb = createClient({
      url: finalCustomerUrl,
      ...(customerDbAuthToken && { authToken: customerDbAuthToken })
    });

    // Initialize database schema
    initializeSchema();

    console.log('Database connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
};

/**
 * Initialize database schema: create tables if they don't exist, and migrate if needed.
 */
const initializeSchema = async () => {
  try {
    // Create settings table if not exists
    if (catalogDb) {
      await catalogDb.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          type TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default header-theme setting if it doesn't exist
      await catalogDb.execute(`
        INSERT OR IGNORE INTO settings (type, value, created_at, updated_at)
        VALUES ('header-theme', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }

    // Create campaigns table if not exists
    if (catalogDb) {
      await catalogDb.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          occasion TEXT NOT NULL,
          placement TEXT NOT NULL,
          label TEXT,
          message TEXT,
          ctaLabel TEXT,
          destinationType TEXT,
          destinationValue TEXT,
          startsAt DATETIME NOT NULL,
          endsAt DATETIME NOT NULL,
          timezone TEXT DEFAULT 'UTC',
          priority INTEGER DEFAULT 0,
          backgroundColor TEXT,
          foregroundColor TEXT,
          accentColor TEXT,
          buttonColor TEXT,
          buttonTextColor TEXT,
          desktopImageUrl TEXT,
          mobileImageUrl TEXT,
          posterImageUrl TEXT,
          altText TEXT,
          targetLocations TEXT, -- JSON array of location IDs
          targetDevice TEXT DEFAULT 'all',
          analyticsCampaignId TEXT,
          status TEXT DEFAULT 'draft',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Create delivery_locations table if not exists
    if (catalogDb) {
      await catalogDb.execute(`
        CREATE TABLE IF NOT EXISTS delivery_locations (
          pincode TEXT PRIMARY KEY,
          area TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          is_servicealbe INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Create customers table if not exists
    if (customerDb) {
      await customerDb.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          customer_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          password TEXT NOT NULL,
          phone_no TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Migrate orders table: add customer_id and order_date if they don't exist
    if (ordersDb) {
      // Check if customer_id column exists
      const customerIdExists = await ordersDb.execute(`
        SELECT COUNT(*) as count FROM pragma_table_info('orders') WHERE name = 'customer_id'
      `);
      if (customerIdExists.rows[0].count === 0) {
        await ordersDb.execute(`
          ALTER TABLE orders ADD COLUMN customer_id TEXT
        `);
      }

      // Check if order_date column exists
      const orderDateExists = await ordersDb.execute(`
        SELECT COUNT(*) as count FROM pragma_table_info('orders') WHERE name = 'order_date'
      `);
      if (orderDateExists.rows[0].count === 0) {
        await ordersDb.execute(`
          ALTER TABLE orders ADD COLUMN order_date DATETIME DEFAULT CURRENT_TIMESTAMP
        `);
      }
    }
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
};

/**
 * Get database connection by name
 * @param {string} dbName - Either 'catalog', 'orders', or 'customer'
 * @returns {object} Database client
 */
const getDatabaseConnection = async (dbName) => {
  switch (dbName) {
    case 'catalog':
      if (!catalogDb) {
        throw new Error('Catalog database not initialized');
      }
      return catalogDb;
    case 'orders':
      if (!ordersDb) {
        throw new Error('Orders database not initialized');
      }
      return ordersDb;
    case 'customer':
      if (!customerDb) {
        throw new Error('Customer database not initialized');
      }
      return customerDb;
    default:
      throw new Error(`Invalid database name: ${dbName}`);
  }
};

module.exports = {
  initializeDatabaseConnections,
  getDatabaseConnection
};