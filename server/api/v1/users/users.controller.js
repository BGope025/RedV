const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const { hashPassword } = require('../../../utils/password.utils');
const logger = require('../../../utils/logger');

/**
 * Get user profile
 * @route GET /api/v1/users/:userId
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDatabaseConnection('orders');

    // Users can only access their own profile unless they're admin
    if (req.params.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await db.execute({
      sql: 'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
      args: [userId]
    });

    if (result.rows.length === 0) {
      throw generateNotFoundError('User not found');
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/:userId
 */
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, phone, password } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.params.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const db = await getDatabaseConnection('orders');

    // Check if user exists
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      throw generateNotFoundError('User not found');
    }

    // Build update query dynamically
    const updates = [];
    const args = [];

    if (email !== undefined) {
      updates.push('email = ?');
      args.push(email);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      args.push(phone);
    }

    if (password !== undefined) {
      if (password.length < 6) {
        throw generateValidationError('Password must be at least 6 characters');
      }
      const hashedPassword = await hashPassword(password);
      updates.push('password_hash = ?');
      args.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    args.push(userId);

    await db.execute({
      sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    logger.info(`User profile updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};