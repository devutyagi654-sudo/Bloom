const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Check if Cloudinary is configured (accepts CLOUDINARY_URL or discrete variables)
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
  console.log('[CLOUDINARY] Cloudinary integrated and configured.');
} else {
  console.log('[CLOUDINARY] Cloudinary not configured. Uploads will fall back to local disk storage.');
}

/**
 * Uploads a local file to Cloudinary and deletes the temp file.
 * Falls back to returning null if Cloudinary is not configured.
 * @param {string} filePath Local path of the file
 * @param {string} folder Target folder name on Cloudinary
 * @returns {Promise<string|null>} Cloudinary secure URL, or null if fallback
 */
const uploadToCloudinary = async (filePath, folder = 'bloom') => {
  if (!isCloudinaryConfigured) {
    return null;
  }
  
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`[CLOUDINARY] File path does not exist: ${filePath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, { folder });
    // Remove local file after successful upload to save disk space
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`[CLOUDINARY] Failed to delete local temp file: ${filePath}`, err);
    }
    return result.secure_url;
  } catch (error) {
    console.error('[CLOUDINARY] Cloud upload failed:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  isCloudinaryConfigured
};
