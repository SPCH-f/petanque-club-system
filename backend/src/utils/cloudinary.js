const cloudinary = require('cloudinary').v2;

// Configure Cloudinary only if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:      process.env.CLOUDINARY_API_KEY,
    api_secret:   process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `petanque/${folder}` },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload raw file (like .docx templates) to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @param {string} originalName 
 * @returns {Promise<string>} Secure URL of the uploaded raw file
 */
const uploadRawToCloudinary = (fileBuffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    // Generate clean filename
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: `petanque/${folder}`,
        resource_type: 'raw',
        public_id: cleanName
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadToCloudinary,
  uploadRawToCloudinary,
  cloudinary
};
