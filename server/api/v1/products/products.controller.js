const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const logger = require('../../../utils/logger');
const { generateProductId } = require('../../../utils/id-generator');

/**
 * Get all products
 * @route GET /api/v1/products
 */
const getAllProducts = async (req, res) => {
  try {
    const db = await getDatabaseConnection('catalog');

    const result = await db.execute({
      sql: "SELECT p.*, v.id as variant_id, v.sku, v.size, v.weight, v.price, v.stock_count FROM products p LEFT JOIN variants v ON p.id = v.product_id WHERE p.is_active = 1 ORDER BY p.created_at DESC",
      args: []
    });

    // Group variants by product
    const productsMap = new Map();

    result.rows.forEach(row => {
      const productId = row.id;
      if (!productsMap.has(productId)) {
        productsMap.set(productId, {
          id: productId,
          name: row.name,
          description: row.description,
          category: row.category,
          image_url: row.image_url,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          variants: []
        });
      }

      // Add variant if it exists
      if (row.variant_id) {
        productsMap.get(productId).variants.push({
          id: row.variant_id,
          sku: row.sku,
          size: row.size,
          weight: row.weight,
          price: row.price,
          stock_count: row.stock_count
        });
      }
    });

    const products = Array.from(productsMap.values());

    res.status(200).json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('catalog');

    // Get product
    const productResult = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ? AND is_active = 1',
      args: [id]
    });

    if (productResult.rows.length === 0) {
      throw generateNotFoundError('Product not found');
    }

    const product = productResult.rows[0];

    // Get variants
    const variantsResult = await db.execute({
      sql: 'SELECT * FROM variants WHERE product_id = ?',
      args: [id]
    });

    const productWithVariants = {
      ...product,
      variants: variantsResult.rows
    };

    res.status(200).json({
      success: true,
      data: productWithVariants
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new product
 * @route POST /api/v1/products
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, category, image_url } = req.body;

    // Validate required fields
    if (!name || !description || !category) {
      throw generateValidationError('Name, description, and category are required');
    }

    const db = await getDatabaseConnection('catalog');
    const productId = generateProductId();

    await db.execute({
      sql: `
        INSERT INTO products (id, name, description, category, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `,
      args: [productId, name, description, category, image_url || null]
    });

    logger.info(`Product created: ${productId}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: productId,
        name,
        description,
        category,
        image_url: image_url || null,
        is_active: true
      }
    });
  } catch (error) {
    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update product
 * @route PUT /api/v1/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, image_url, is_active } = req.body;

    const db = await getDatabaseConnection('catalog');

    // Check if product exists
    const productResult = await db.execute({
      sql: 'SELECT id FROM products WHERE id = ?',
      args: [id]
    });

    if (productResult.rows.length === 0) {
      throw generateNotFoundError('Product not found');
    }

    // Build update query dynamically
    const updates = [];
    const args = [];

    if (name !== undefined) {
      updates.push('name = ?');
      args.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      args.push(description);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      args.push(category);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      args.push(image_url);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      args.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    logger.info(`Product updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.type === 'validation-error') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete product
 * @route DELETE /api/v1/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabaseConnection('catalog');

    // Check if product exists
    const productResult = await db.execute({
      sql: 'SELECT id FROM products WHERE id = ?',
      args: [id]
    });

    if (productResult.rows.length === 0) {
      throw generateNotFoundError('Product not found');
    }

    // Soft delete - set is_active to 0
    await db.execute({
      sql: 'UPDATE products SET is_active = 0 WHERE id = ?',
      args: [id]
    });

    logger.info(`Product deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.type === 'not-found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

