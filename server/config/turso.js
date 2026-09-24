const { createClient } = require('@libsql/client');
const { catalogDbUrl, catalogDbAuthToken, ordersDbUrl, ordersDbAuthToken } = require('./env');
const path = require('path');

// Database clients
let catalogDb = null;
let ordersDb = null;

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

    console.log('Database connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
};

/**
 * Get database connection by name
 * @param {string} dbName - Either 'catalog' or 'orders'
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
    default:
      throw new Error(`Invalid database name: ${dbName}`);
  }
};

module.exports = {
  initializeDatabaseConnections,
  getDatabaseConnection
};