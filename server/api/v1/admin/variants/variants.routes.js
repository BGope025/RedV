const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../../middleware/auth.middleware');
const {
  updateVariant,
  deleteVariant
} = require('../../products/products.controller');

router.use(protect);
router.use(authorize('admin'));

router.put('/:id', updateVariant);
router.delete('/:id', deleteVariant);

module.exports = router;
