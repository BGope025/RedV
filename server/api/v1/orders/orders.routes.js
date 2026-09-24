const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  createOrder,
  getOrderById,
  approveOrder,
  getUserOrders
} = require('./orders.controller');

// Public routes (for checkout)
router.post('/checkout', createOrder);

// Protected routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));
router.patch('/:id/approve', approveOrder);

// User routes
router.get('/user/:userId/orders', getUserOrders);
router.get('/:id', getOrderById);

module.exports = router;