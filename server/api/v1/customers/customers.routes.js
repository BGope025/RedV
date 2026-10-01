const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile } = require('./customers.controller');
const { authenticateCustomer } = require('../../../middleware/customer-auth.middleware');

// Public routes
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Protected routes
router.get('/profile', authenticateCustomer, getCustomerProfile);

module.exports = router;
