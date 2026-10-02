/**
 * Generate a clean order ID in the format: #RV-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateOrderId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `#RV-${randomNum}`;
};

/**
 * Generate a clean product ID in the format: PRD-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateProductId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `PRD-${randomNum}`;
};

/**
 * Generate a clean variant ID in the format: VAR-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateVariantId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `VAR-${randomNum}`;
};

/**
 * Generate a clean user ID in the format: USR-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateUserId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `USR-${randomNum}`;
};

/**
 * Generate a clean UI ID in the format: UI-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateUiId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `UI-${randomNum}`;
};

/**
 * Generate a clean campaign ID in the format: CAMP-XXXX
 * Where XXXX is a random 4-digit number
 */
const generateCampaignId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `CAMP-${randomNum}`;
};

/**
 * Generate cart snapshot from cart items
 * This creates an immutable snapshot of the cart at checkout time
 * @param {Array} cartItems - Array of cart items from frontend
 * @param {object} catalogDb - Database connection for catalog
 * @returns {Promise<Array>} Enhanced cart items with product details
 */
const generateCartSnapshot = async (cartItems, catalogDb) => {
  const snapshot = [];

  for (const item of cartItems) {
    const { productId, variantId, quantity } = item;

    // Get product and variant details from catalog
    const result = await catalogDb.execute({
      sql: `
        SELECT p.name as product_name, v.sku, v.size, v.weight, v.price
        FROM products p
        JOIN variants v ON p.id = v.product_id
        WHERE p.id = ? AND v.id = ?
      `,
      args: [productId, variantId]
    });

    if (result.rows.length === 0) {
      throw new Error(`Product or variant not found: ${productId}/${variantId}`);
    }

    const variantDetails = result.rows[0];

    snapshot.push({
      productId,
      variantId,
      name: variantDetails.product_name,
      sku: variantDetails.sku,
      size: variantDetails.size,
      weight: variantDetails.weight,
      price: parseFloat(variantDetails.price),
      quantity: quantity
    });
  }

  return snapshot;
};

module.exports = {
  generateOrderId,
  generateProductId,
  generateVariantId,
  generateUserId,
  generateUiId,
  generateCampaignId,
  generateCartSnapshot
};