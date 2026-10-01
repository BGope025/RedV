const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const { authenticateCustomer } = require('../../../middleware/customer-auth.middleware');
const {
  createOrder,
  getOrderById,
  approveOrder,
  getUserOrders,
  getAllOrders,
  deleteOrder
} = require('./orders.controller');

// Public routes (for checkout) - now protected by customer auth
router.post('/checkout', authenticateCustomer, createOrder);

// Protected routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));
router.get('/', getAllOrders); // Get all orders with filtering/pagination
router.delete('/:id', deleteOrder); // Archive/delete order
router.patch('/:id/approve', approveOrder);

// User routes
router.get('/customer/orders', authenticateCustomer, getUserOrders);
router.get('/:id', getOrderById);

module.exports = router;

