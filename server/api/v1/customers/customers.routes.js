const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile, getAllCustomers } = require('./customers.controller');
const { authenticateCustomer } = require('../../../middleware/customer-auth.middleware');
const { protect, authorize } = require('../../../middleware/auth.middleware');

// Public routes
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Protected routes
router.get('/profile', authenticateCustomer, getCustomerProfile);
router.get('/', protect, authorize('admin'), getAllCustomers);

module.exports = router;
