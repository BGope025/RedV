const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const logger = require('../../../utils/logger');

/**
 * Get active banners/UI elements
 * @route GET /api/v1/ui/banners
 */
const getBanners = async (req, res) => {
  try {
    const db = await getDatabaseConnection('catalog');

    const result = await db.execute({
      sql: 'SELECT * FROM ui_settings WHERE type = \"banner\" AND is_active = 1 ORDER BY display_order ASC'
    });

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update banner/UI element
 * @route PUT /api/v1/ui/banners/:id
 */
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, link_url, display_order, is_active } = req.body;

    const db = await getDatabaseConnection('catalog');

    // Check if banner exists
    const bannerResult = await db.execute({
      sql: 'SELECT id FROM ui_settings WHERE id = ? AND type = \"banner\"',
      args: [id]
    });

    if (bannerResult.rows.length === 0) {
      throw generateNotFoundError('Banner not found');
    }

    // Build update query dynamically
    const updates = [];
    const args = [];

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      args.push(image_url);
    }

    if (link_url !== undefined) {
      updates.push('link_url = ?');
      args.push(link_url);
    }

    if (display_order !== undefined) {
      updates.push('display_order = ?');
      args.push(display_order);
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
      sql: `UPDATE ui_settings SET ${updates.join(', ')} WHERE id = ? AND type = \"banner\"`,
      args
    });

    logger.info(`Banner updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully'
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

    logger.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getBanners,
  updateBanner
};