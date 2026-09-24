const { getDatabaseConnection } = require('../../../config/turso');
const { generateOrderId, generateCartSnapshot } = require('../../../utils/id-generator');
const { generateNotFoundError, generateValidationError, generateOutOfStockError } = require('../../../utils/error-classes');
const { executeCrossDbSaga } = require('../../../services/db-saga.service');
const { generateWhatsAppMessage } = require('../../../services/whatsapp.service');
const logger = require('../../../utils/logger');

/**
 * Create new order (checkout)
 * @route POST /api/v1/orders/checkout
 */
const createOrder = async (req, res) => {
  let orderId = null;
  try {
    const { userId, cartItems, customerInfo } = req.body;

    // Validate required fields
    if (!userId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw generateValidationError('User ID and cart items are required');
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (!item.productId || !item.variantId || !item.quantity || item.quantity <= 0) {
        throw generateValidationError('Invalid cart item format');
      }
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.phone) {
      throw generateValidationError('Customer name and phone number are required');
    }

    const catalogDb = await getDatabaseConnection('catalog');
    const ordersDb = await getDatabaseConnection('orders');

    // Generate order ID
    orderId = generateOrderId();

    // Create cart snapshot (immutable copy of cart data at time of checkout)
    const cartSnapshot = await generateCartSnapshot(cartItems, catalogDb);

    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartSnapshot) {
      totalAmount += item.price * item.quantity;
    }

    // Create pending order in ordersDb
    await ordersDb.execute({
      sql: `
        INSERT INTO orders (
          id, user_id, cart_snapshot, total_amount, customer_name,
          customer_phone, customer_address, status, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)
      `,
      args: [
        orderId,
        userId,
        JSON.stringify(cartSnapshot),
        totalAmount,
        customerInfo.name,
        customerInfo.phone,
        customerInfo.address || '',
        'pending'
      ]
    });

    logger.info(`Order created: ${orderId} for user ${userId}`);

    // Generate WhatsApp message for customer
    const whatsappMessage = generateWhatsAppMessage({
      orderId,
      customerName: customerInfo.name,
      cartItems: cartSnapshot,
      totalAmount
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        status: 'pending',
        whatsappMessage,
        totalAmount
      }
    });
  } catch (error) {
    // If order was created but something failed later, we might need to clean up
    if (orderId) {
      try {
        const ordersDb = await getDatabaseConnection('orders');
        await ordersDb.execute({
          sql: 'DELETE FROM orders WHERE id = ?',
          args: [orderId]
        });
      } catch (cleanupError) {
        logger.error(`Error cleaning up order ${orderId}:`, cleanupError);
      }
    }

    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/v1/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('orders');

    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND is_archived = 0',
      args: [id]
    });

    if (result.rows.length === 0) {
      throw generateNotFoundError('Order not found');
    }

    const order = result.rows[0];
    // Parse cart snapshot from JSON
    order.cart_snapshot = JSON.parse(order.cart_snapshot);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Approve order (Admin only) - executes cross-DB saga
 * @route PATCH /api/v1/orders/:id/approve
 */
const approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId; // From auth middleware

    logger.info(`Admin ${adminId} attempting to approve order ${id}`);

    // Execute the cross-DB saga
    const result = await executeCrossDbSaga(id, adminId);

    res.status(200).json({
      success: true,
      message: 'Order approved successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error approving order:', error);

    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'out-of-stock') {
      return res.status(409).json({
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

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's order history
 * @route GET /api/v1/orders/user/:userId/orders
 */
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDatabaseConnection('orders');

    // Only show non-archived orders (last 30 days)
    const result = await db.execute({
      sql: `
        SELECT id, total_amount, customer_name, status, created_at
        FROM orders
        WHERE user_id = ? AND is_archived = 0
        ORDER BY created_at DESC
      `,
      args: [userId]
    });

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  approveOrder,
  getUserOrders
};