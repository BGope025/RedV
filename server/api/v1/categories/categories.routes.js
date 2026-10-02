const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/auth.middleware');
const { getAllCategories } = require('./categories.controller');

// Public routes - categories don't require authentication
router.get('/', getAllCategories);

module.exports = router;


