const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');

// The credentials will be loaded from env vars if present
// For local testing without valid credentials, we'll simulate the upload.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'simulated_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'simulated_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'simulated_secret',
});

const uploadToCloudinary = (fileBuffer, folder = 'trustvault/documents', originalname = 'document.pdf') => {
  return new Promise((resolve, reject) => {
    // If we're running without real credentials, return simulated data
    if (process.env.CLOUDINARY_CLOUD_NAME === undefined) {
      const ext = path.extname(originalname) || '.pdf';
      const filename = `doc_${Date.now()}${ext}`;
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      
      fs.writeFileSync(path.join(uploadsDir, filename), fileBuffer);
      
      console.log(`[SIMULATED CLOUDINARY UPLOAD] Saved locally to ${filename}`);
      
      return resolve({
        secure_url: `http://localhost:5000/uploads/${filename}`,
        public_id: filename
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto detects image or raw (pdf)
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (process.env.CLOUDINARY_CLOUD_NAME === undefined) {
    console.log(`[SIMULATED CLOUDINARY DELETE] Deleting ${publicId}`);
    return true;
  }
  
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
