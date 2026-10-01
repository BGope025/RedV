const { createClient } = require('@libsql/client');
const {
  catalogDbUrl,
  catalogDbAuthToken,
  ordersDbUrl,
  ordersDbAuthToken,
  customerDbUrl,
  customerDbAuthToken,
  availablePincodesDbUrl,
  availablePincodesDbAuthToken
} = require('./env');
const path = require('path');

// Database clients
let catalogDb = null;
let ordersDb = null;
let customerDb = null;
let availablePincodesDb = null;

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

    // Available Pincodes database connection
    const finalAvailablePincodesUrl = availablePincodesDbUrl || `file:${path.join(dataPath, 'available-pincodes.db')}`;
    availablePincodesDb = createClient({
      url: finalAvailablePincodesUrl,
      ...(availablePincodesDbAuthToken && { authToken: availablePincodesDbAuthToken })
    });

    // Initialize database schema
    // initializeSchema(); // Disabled to prevent hrana client deadlock on startup

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
      try {
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
      } catch (err) {
        console.error('Error initializing settings schema:', err);
      }
    }

    // Create campaigns table if not exists
    if (catalogDb) {
      try {
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
      } catch (err) {
        console.error('Error initializing campaigns schema:', err);
      }
    }

    // Create delivery_locations table if not exists
    if (catalogDb) {
      try {
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
      } catch (err) {
        console.error('Error initializing delivery_locations schema:', err);
      }
    }

    // Create customers table if not exists
    if (customerDb) {
      try {
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
      } catch (err) {
        console.error('Error initializing customers schema:', err);
      }
    }

    // Create available_pincodes table if not exists
    if (availablePincodesDb) {
      try {
        await availablePincodesDb.execute(`
          CREATE TABLE IF NOT EXISTS available_pincodes (
            pincode TEXT PRIMARY KEY,
            area TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            is_serviceable INTEGER NOT NULL DEFAULT 1 CHECK (is_serviceable IN (0, 1)),
            latitude REAL,
            longitude REAL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes for better query performance
        await availablePincodesDb.execute(`
          CREATE INDEX IF NOT EXISTS idx_available_pincodes_is_serviceable ON available_pincodes(is_serviceable);
        `);
        await availablePincodesDb.execute(`
          CREATE INDEX IF NOT EXISTS idx_available_pincodes_city ON available_pincodes(city);
        `);
        await availablePincodesDb.execute(`
          CREATE INDEX IF NOT EXISTS idx_available_pincodes_state ON available_pincodes(state);
        `);
      } catch (err) {
        console.error('Error initializing available_pincodes schema:', err);
      }
    }

    // Migrate orders table: add customer_id and order_date if they don't exist
    if (ordersDb) {
      try {
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
      } catch (err) {
        console.error('Error initializing orders schema:', err);
      }
    }
  } catch (error) {
    console.error('Failed to initialize database schema (global catch):', error);
  }
};

/**
 * Get database connection by name
 * @param {string} dbName - Either 'catalog', 'orders', 'customer', or 'availablePincodes'
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
    case 'availablePincodes':
      if (!availablePincodesDb) {
        throw new Error('Available Pincodes database not initialized');
      }
      return availablePincodesDb;
    default:
      throw new Error(`Invalid database name: ${dbName}`);
  }
};

module.exports = {
  initializeDatabaseConnections,
  getDatabaseConnection
};