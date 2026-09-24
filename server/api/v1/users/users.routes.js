const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  getUserProfile,
  updateUserProfile
} = require('./users.controller');

// Protected routes
router.use(protect);

// User can only access their own profile
router.get('/:userId', getUserProfile);
router.put('/:userId', updateUserProfile);

module.exports = router;