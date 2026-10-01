const { getDatabaseConnection } = require('../../../config/turso');
const { generateValidationError, generateNotFoundError } = require('../../../utils/error-classes');
const { hashPassword } = require('../../../utils/password.utils');
const logger = require('../../../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Generate a sequential customer ID in the format: C0001, C0002, etc.
 * @returns {Promise<string>} Generated customer ID
 */
const generateCustomerId = async () => {
  try {
    const db = await getDatabaseConnection('customer');

    // Use a transaction to prevent race conditions
    await db.execute('BEGIN IMMEDIATE TRANSACTION');

    try {
      // Get the last customer ID
      const result = await db.execute({
        sql: 'SELECT customer_id FROM customers ORDER BY customer_id DESC LIMIT 1'
      });

      let nextId = 'C0001'; // Default for first customer

      if (result.rows.length > 0) {
        const lastId = result.rows[0].customer_id;
        // Extract the numeric part (remove 'C' prefix)
        const lastNumber = parseInt(lastId.substring(1), 10);
        const nextNumber = lastNumber + 1;

        // Format as C followed by 4-digit number with leading zeros
        nextId = `C${nextNumber.toString().padStart(4, '0')}`;
      }

      await db.execute('COMMIT');
      return nextId;
    } catch (error) {
      // Rollback transaction on error
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error generating customer ID:', error);
    throw error;
  }
};

/**
 * Customer registration endpoint
 * @route POST /api/v1/customers/register
 */
const registerCustomer = async (req, res) => {
  try {
    const { name, address, password, phoneNo } = req.body;

    // Validate required fields
    if (!name || !address || !password || !phoneNo) {
      throw generateValidationError('Name, address, password, and phone number are required');
    }

    // Validate password length
    if (password.length < 6) {
      throw generateValidationError('Password must be at least 6 characters');
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.match(phoneNo.replace(/\s/g, ''))) {
      throw generateValidationError('Please enter a valid phone number');
    }

    const db = await getDatabaseConnection('customer');

    // Check if phone number already exists
    const phoneResult = await db.execute({
      sql: 'SELECT customer_id FROM customers WHERE phone_no = ?',
      args: [phoneNo]
    });

    if (phoneResult.rows.length > 0) {
      throw generateValidationError('Phone number already registered');
    }

    // Generate customer ID
    const customerId = await generateCustomerId();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert customer
    await db.execute({
      sql: `
        INSERT INTO customers (customer_id, name, address, password, phone_no)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [customerId, name, address, hashedPassword, phoneNo]
    });

    logger.info(`Customer registered: ${customerId}`);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customerId,
        name,
        address,
        phoneNo
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error registering customer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Customer login endpoint
 * @route POST /api/v1/customers/login
 */
const loginCustomer = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate input
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name and password are required'
      });
    }

    const db = await getDatabaseConnection('customer');

    // Find customer by name
    const customerResult = await db.execute({
      sql: 'SELECT customer_id, name, address, phone_no as phoneNo, password FROM customers WHERE name = ?',
      args: [name]
    });

    if (customerResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const customer = customerResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token (using the same secret as admin)
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        customerId: customer.customer_id,
        name: customer.name,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logger.info(`Customer ${customer.name} logged in successfully`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        customer: {
          customerId: customer.customer_id,
          name: customer.name,
          address: customer.address,
          phoneNo: customer.phoneNo
        }
      }
    });
  } catch (error) {
    logger.error('Error logging in customer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer profile
 * @route GET /api/v1/customers/profile
 */
const getCustomerProfile = async (req, res) => {
  try {
    // We'll get the customer ID from the JWT token (middleware will add it to req.customer)
    const { customerId } = req.customer;

    const db = await getDatabaseConnection('customer');

    const result = await db.execute({
      sql: 'SELECT customer_id, name, address, phone_no as phoneNo, created_at FROM customers WHERE customer_id = ?',
      args: [customerId]
    });

    if (result.rows.length === 0) {
      throw generateNotFoundError('Customer not found');
    }

    const customer = result.rows[0];

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  generateCustomerId
};

