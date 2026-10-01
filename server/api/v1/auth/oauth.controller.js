const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { getDatabaseConnection } = require('../../../config/turso');
const logger = require('../../../utils/logger');

// Retrieve from environment or use a placeholder if not set
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Google OAuth login endpoint for admin panel
 * @route POST /api/v1/auth/oauth/google
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Google ID token
    // If GOOGLE_CLIENT_ID is not set in env, it skips audience validation (for demo purposes)
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID : undefined, 
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;

    // Authorize admin emails. For production, define ADMIN_EMAILS in .env (comma separated)
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@redveg.com').split(',').map(e => e.trim());
    
    if (!adminEmails.includes(email)) {
      logger.warn(`Unauthorized OAuth attempt with email: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    // Get database connection
    const db = await getDatabaseConnection('orders'); 

    // Find user by email (used as username here)
    const userResult = await db.execute({
      sql: 'SELECT id, username, role FROM users WHERE username = ?',
      args: [email]
    });

    let user;

    if (userResult.rows.length === 0) {
      // If admin user doesn't exist yet, auto-provision their account
      const userId = require('crypto').randomUUID();
      await db.execute({
        sql: 'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
        // Use a dummy password hash since they use OAuth
        args: [userId, email, 'oauth_provider_managed', 'admin']
      });
      user = { id: userId, username: email, role: 'admin' };
      logger.info(`Auto-provisioned new admin OAuth user: ${email}`);
    } else {
      user = userResult.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
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

    logger.info(`OAuth User ${user.username} logged in successfully`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token // Return token in body as well
      }
    });
  } catch (error) {
    logger.error('OAuth login error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token or authentication failed'
    });
  }
};

module.exports = { googleLogin };
