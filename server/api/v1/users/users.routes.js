const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth.middleware');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('./users.controller');

// User can only access their own profile unless they're admin
router.get('/:userId', getUserProfile);
router.put('/:userId', updateUserProfile);

// Admin only routes for user management
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllUsers); // Get all users
router.post('/', createUser); // Create new user
router.get('/:id', getUserById); // Get specific user by ID
router.put('/:id', updateUser); // Update user
router.delete('/:id', deleteUser); // Delete user

module.exports = router;

