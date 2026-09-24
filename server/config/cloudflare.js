const cloudinary = require('cloudinary').v2;
const { cloudinary: cloudinaryConfig } = require('./env');

/**
 * Initialize Cloudinary
 */
const initializeCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: true
    });

    console.log('Cloudinary client initialized successfully');
    return cloudinary;
  } catch (error) {
    console.error('Failed to initialize Cloudinary client:', error);
    throw error;
  }
};

module.exports = {
  initializeCloudinary
};