const express = require('express');
const router = express.Router();
const { login, logout } = require('./auth.controller');

// Auth routes
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;