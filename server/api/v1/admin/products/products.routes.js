const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../../middleware/auth.middleware');
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant
} = require('../../products/products.controller');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAdminProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/variants', createVariant);

module.exports = router;
