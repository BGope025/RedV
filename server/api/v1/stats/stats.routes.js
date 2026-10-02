const express = require('express');
const router = express.Router();
const { getStats, getRevenueStats } = require('./stats.controller');

// Mount routes
router.get('/', getStats);
router.get('/revenue', getRevenueStats);

module.exports = router;
