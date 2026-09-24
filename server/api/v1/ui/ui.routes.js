const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  getBanners,
  updateBanner
} = require('./ui.controller');

// Public routes
router.get('/banners', getBanners);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.put('/banners/:id', updateBanner);

module.exports = router;