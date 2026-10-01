const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const logger = require('../../../utils/logger');

/**
 * Get delivery locations with filtering
 * @route GET /api/v1/delivery-locations
 */
const getLocations = async (req, res) => {
  try {
    const { serviceableOnly, limit, offset } = req.query;

    let sql = 'SELECT * FROM available_pincodes';
    const args = [];
    const conditions = [];

    // Add filtering conditions
    if (serviceableOnly !== undefined) {
      conditions.push('is_serviceable = ?');
      args.push(serviceableOnly === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY pincode';

    // Add pagination
    if (limit !== undefined) {
      sql += ' LIMIT ?';
      args.push(parseInt(limit));
    }

    if (offset !== undefined) {
      sql += ' OFFSET ?';
      args.push(parseInt(offset));
    }

    const db = await getDatabaseConnection('availablePincodes');
    const result = await db.execute({ sql, args });

    // Format for frontend compatibility
    const locations = result.rows.map(location => ({
      pincode: location.pincode,
      area: location.area || '',
      city: location.city || '',
      state: location.state || '',
      isServiceable: location.is_serviceable === 1
    }));

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching delivery locations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get delivery location by pincode
 * @route GET /api/v1/delivery-locations/:pincode
 */
const getLocationByPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      throw generateValidationError('Invalid pincode format');
    }

    const db = await getDatabaseConnection('availablePincodes');
    const result = await db.execute({
      sql: 'SELECT * FROM available_pincodes WHERE pincode = ?',
      args: [pincode]
    });

    if (result.rows.length === 0) {
      throw generateNotFoundError('Delivery location not found');
    }

    const location = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        pincode: location.pincode,
        area: location.area || '',
        city: location.city || '',
        state: location.state || '',
        isServiceable: location.is_serviceable === 1
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching delivery location by pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Search delivery locations by area/city/state
 * @route GET /api/v1/delivery-locations/search
 */
const searchLocations = async (req, res) => {
  try {
    const { q, limit, offset } = req.query;

    if (!q) {
      throw generateValidationError('Search query is required');
    }

    let sql = `
      SELECT * FROM available_pincodes
      WHERE area LIKE ?
         OR city LIKE ?
         OR state LIKE ?
    `;
    const args = [`%${q}%`, `%${q}%`, `%${q}%`];

    // Add pagination
    if (limit !== undefined) {
      sql += ' LIMIT ?';
      args.push(parseInt(limit));
    }

    if (offset !== undefined) {
      sql += ' OFFSET ?';
      args.push(parseInt(offset));
    }

    const db = await getDatabaseConnection('availablePincodes');
    const result = await db.execute({ sql, args });

    // Format for frontend compatibility
    const locations = result.rows.map(location => ({
      pincode: location.pincode,
      area: location.area || '',
      city: location.city || '',
      state: location.state || '',
      isServiceable: location.is_serviceable === 1
    }));

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error searching delivery locations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Reverse geocode latitude/longitude to get location details
 * @route POST /api/v1/delivery-locations/reverse-geocode
 */
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw generateValidationError('Latitude and longitude must be numbers');
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      throw generateValidationError('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw generateValidationError('Longitude must be between -180 and 180 degrees');
    }

    // In a real implementation, you would call a geocoding service (e.g., Google Maps)
    // and then validate the resulting pincode against the database.
    // Since we don't have a reverse geocoding provider configured in this environment,
    // we return a clear message indicating that pincode search is required instead.

    // Check if reverse geocoding is configured (in a real app, this would come from env vars)
    const reverseGeocodingEnabled = false; // Set to true when provider is configured

    if (!reverseGeocodingEnabled) {
      return res.status(200).json({
        success: false,
        code: 'LOCATION_VERIFICATION_UNAVAILABLE',
        message: 'We detected your location but could not verify delivery availability. Search by pincode instead.'
      });
    }

    // If reverse geocoding was enabled, we would:
    // 1. Call the geocoding service to get a pincode from the coordinates
    // 2. Validate that pincode against our database
    // 3. Return whether it's serviceable

    // For demonstration purposes in this environment, we'll simulate what would happen
    // if we had a provider that returned a specific pincode

    // Simulate getting a pincode from coordinates (this would come from the geocoding service)
    // In reality, you'd replace this with actual geocoding service call
    const simulatedPincodeFromCoordinates = '700065'; // Example: Dumdum

    // Verify the pincode against our database
    const db = await getDatabaseConnection('availablePincodes');
    const result = await db.execute({
      sql: 'SELECT * FROM available_pincodes WHERE pincode = ?',
      args: [simulatedPincodeFromCoordinates]
    });

    if (result.rows.length === 0) {
      // Pincode not found in our database
      return res.status(200).json({
        success: false,
        code: 'LOCATION_NOT_FOUND',
        message: 'The location detected could not be found in our service database. Please search by pincode instead.'
      });
    }

    const location = result.rows[0];

    // Never mark an unavailable pincode as deliverable
    res.status(200).json({
      success: true,
      data: {
        pincode: location.pincode,
        area: location.area || '',
        city: location.city || '',
        state: location.state || '',
        isServiceable: location.is_serviceable === 1,
        latitude: location.latitude,
        longitude: location.longitude
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error reverse geocoding location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getLocations,
  getLocationByPincode,
  searchLocations,
  reverseGeocode
};