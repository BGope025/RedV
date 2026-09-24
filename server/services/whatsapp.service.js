/**
 * Generate WhatsApp message for order confirmation
 * Formats a pre-filled message that the user can send to the admin via WhatsApp
 *
 * @param {Object} params - WhatsApp message parameters
 * @param {string} params.orderId - The order ID
 * @param {string} params.customerName - Customer's name
 * @param {Array} params.cartItems - Array of cart items with product details
 * @param {number} params.totalAmount - Total order amount
 * @returns {string} URL-encoded WhatsApp message
 */
const generateWhatsAppMessage = ({ orderId, customerName, cartItems, totalAmount }) => {
  // Admin phone number (should come from environment variables in production)
  const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+1234567890';

  // Format the message
  let message = `*New RedVeg Order* 🐟🍗\n\n`;
  message += `*Order ID:* ${orderId}\n`;
  message += `*Customer:* ${customerName}\n\n`;
  message += `*Items:*\n`;

  cartItems.forEach((item, index) => {
    message += `${index + 1}. ${item.name || 'Product'} (${item.size || 'N/A'})`;
    if (item.weight) {
      message += ` - ${item.weight}`;
    }
    message += ` × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}`;
    message += `\n`;
  });

  message += `\n*Total Amount:* ${totalAmount.toFixed(2)}`;
  message += `\n\n*Status:* Pending Payment`;
  message += `\n\nPlease confirm payment and approve the order in the admin panel.`;

  // URL encode for WhatsApp
  const encodedMessage = encodeURIComponent(message);

  // Return WhatsApp URL
  return `https://wa.me/${adminPhoneNumber.replace(/\+/g, '')}?text=${encodedMessage}`;
};

module.exports = {
  generateWhatsAppMessage
};