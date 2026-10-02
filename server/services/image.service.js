const { cloudinary: cloudinaryConfig } = require('../config/env');
const { initializeCloudinary } = require('../config/cloudflare');
const logger = require('../utils/logger');

/**
 * Initialize Cloudinary
 */
let cloudinaryInstance = null;

const getCloudinaryInstance = () => {
  if (!cloudinaryInstance) {
    cloudinaryInstance = initializeCloudinary();
  }
  return cloudinaryInstance;
};

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} folder - The folder (path) under which to store the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Object>} Upload result with URL and key
 */
const uploadToCloudinary = async (fileBuffer, folder, mimeType) => {
  try {
    const cloudinary = getCloudinaryInstance();

    // Generate a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}/${timestamp}-${randomSuffix}`;

    // Determine file extension based on mimeType
    let extension = '';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      extension = 'jpg';
    } else if (mimeType === 'image/png') {
      extension = 'png';
    } else if (mimeType === 'image/webp') {
      extension = 'webp';
    } else {
      // Default to jpg for unknown image types
      extension = 'jpg';
    }

    const publicId = `${filename}.${extension}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
      {
        public_id: publicId,
        resource_type: 'auto',
        // Optional: Set transformations, format, etc.
        format: extension,
        quality: 'auto',
        fetch_format: 'auto'
      }
    );

    logger.info(`File uploaded to Cloudinary: ${publicId}`);

    return {
      success: true,
      url: result.secure_url,
      key: publicId, // Using publicId as the key for consistency
      etag: result.etag || result.signature // Cloudinary provides etag or signature
    };
  } catch (error) {
    logger.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary
};