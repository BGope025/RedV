const express = require('express');
const router = express.Router();
const { login, logout, validate } = require('./auth.controller');
const { googleLogin } = require('./oauth.controller');

// Auth routes
router.post('/login', login);
router.post('/oauth/google', googleLogin);
router.post('/logout', logout);
router.get('/validate', validate); // Validate token

module.exports = router;