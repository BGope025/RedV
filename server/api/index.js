const express = require('express');
const router = express.Router();

// Import all v1 route modules
const authRoutes = require('./v1/auth/auth.routes');
const productsRoutes = require('./v1/products/products.routes');
const ordersRoutes = require('./v1/orders/orders.routes');
const usersRoutes = require('./v1/users/users.routes');
const mediaRoutes = require('./v1/media/media.routes');
const uiRoutes = require('./v1/ui/ui.routes');
const healthRoutes = require('./v1/health/health.routes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/users', usersRoutes);
router.use('/media', mediaRoutes);
router.use('/ui', uiRoutes);
router.use('/health', healthRoutes);

module.exports = router;