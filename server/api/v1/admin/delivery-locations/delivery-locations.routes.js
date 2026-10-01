const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/auth.middleware');
const {
  getAllLocations,
  updateAvailability
} = require('./delivery-locations.controller');

// Admin routes - all protected
router.get('/', protect, getAllLocations);
router.patch('/:pincode/availability', protect, updateAvailability);

module.exports = router;