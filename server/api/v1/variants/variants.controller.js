const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const { generateVariantId } = require('../../../utils/id-generator');
const logger = require('../../../utils/logger');

/**
 * Get all variants for a product
 * @route GET /api/v1/products/:productId/variants
 */
const getVariantsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const db = await getDatabaseConnection('catalog');

    // Check if product exists
    const productResult = await db.execute({
      sql: 'SELECT id FROM products WHERE id = ? AND is_active = 1',
      args: [productId]
    });

    if (productResult.rows.length === 0) {
      throw generateNotFoundError('Product not found');
    }

    const result = await db.execute({
      sql: 'SELECT * FROM variants WHERE product_id = ? ORDER BY created_at ASC',
      args: [productId]
    });

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get variant by ID
 * @route GET /api/v1/variants/:id
 */
const getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('catalog');

    const result = await db.execute({
      sql: 'SELECT v.*, p.name as product_name FROM variants v JOIN products p ON v.product_id = p.id WHERE v.id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      throw generateNotFoundError('Variant not found');
    }

    const variant = result.rows[0];

    res.status(200).json({
      success: true,
      data: variant
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching variant:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new variant for a product
 * @route POST /api/v1/products/:productId/variants
 */
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, size, weight, price, stock_count } = req.body;

    // Validate required fields
    if (!sku || !size || !weight || price === undefined || stock_count === undefined) {
      throw generateValidationError('SKU, size, weight, price, and stock_count are required');
    }

    // Validate price and stock_count are non-negative
    if (price < 0) {
      throw generateValidationError('Price must be non-negative');
    }
    if (stock_count < 0) {
      throw generateValidationError('Stock count must be non-negative');
    }

    const db = await getDatabaseConnection('catalog');

    // Check if product exists
    const productResult = await db.execute({
      sql: 'SELECT id FROM products WHERE id = ? AND is_active = 1',
      args: [productId]
    });

    if (productResult.rows.length === 0) {
      throw generateNotFoundError('Product not found');
    }

    // Check if SKU already exists
    const skuResult = await db.execute({
      sql: 'SELECT id FROM variants WHERE sku = ?',
      args: [sku]
    });

    if (skuResult.rows.length > 0) {
      throw generateValidationError('SKU already exists');
    }

    const variantId = generateVariantId();

    await db.execute({
      sql: `
        INSERT INTO variants (id, product_id, sku, size, weight, price, stock_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [variantId, productId, sku, size, weight, price, stock_count]
    });

    logger.info(`Variant created: ${variantId} for product: ${productId}`);

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: {
        id: variantId,
        product_id: productId,
        sku,
        size,
        weight,
        price,
        stock_count
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error creating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update variant
 * @route PUT /api/v1/variants/:id
 */
const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, size, weight, price, stock_count } = req.body;

    const db = await getDatabaseConnection('catalog');

    // Check if variant exists
    const variantResult = await db.execute({
      sql: 'SELECT id FROM variants WHERE id = ?',
      args: [id]
    });

    if (variantResult.rows.length === 0) {
      throw generateNotFoundError('Variant not found');
    }

    // Build update query dynamically
    const updates = [];
    const args = [];

    if (sku !== undefined) {
      // Check if SKU already exists (excluding current variant)
      if (sku !== null && sku !== '') {
        const skuCheckResult = await db.execute({
          sql: 'SELECT id FROM variants WHERE sku = ? AND id != ?',
          args: [sku, id]
        });

        if (skuCheckResult.rows.length > 0) {
          throw generateValidationError('SKU already exists');
        }
      }

      updates.push('sku = ?');
      args.push(sku);
    }

    if (size !== undefined) {
      updates.push('size = ?');
      args.push(size);
    }

    if (weight !== undefined) {
      updates.push('weight = ?');
      args.push(weight);
    }

    if (price !== undefined) {
      if (price < 0) {
        throw generateValidationError('Price must be non-negative');
      }
      updates.push('price = ?');
      args.push(price);
    }

    if (stock_count !== undefined) {
      if (stock_count < 0) {
        throw generateValidationError('Stock count must be non-negative');
      }
      updates.push('stock_count = ?');
      args.push(stock_count);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE variants SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    logger.info(`Variant updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error updating variant:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete variant
 * @route DELETE /api/v1/variants/:id
 */
const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('catalog');

    // Check if variant exists
    const variantResult = await db.execute({
      sql: 'SELECT id FROM variants WHERE id = ?',
      args: [id]
    });

    if (variantResult.rows.length === 0) {
      throw generateNotFoundError('Variant not found');
    }

    await db.execute({
      sql: 'DELETE FROM variants WHERE id = ?',
      args: [id]
    });

    logger.info(`Variant deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getVariantsByProductId,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant
};

