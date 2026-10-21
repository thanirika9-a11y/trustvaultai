const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary if credentials are present
const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] Real credentials detected — uploads will go to Cloudinary');
} else {
  console.log('[Cloudinary] No credentials — uploads will be stored as Base64 in MongoDB');
}

/**
 * Upload a file buffer.
 * - If Cloudinary credentials exist  → upload to Cloudinary
 * - Otherwise                        → encode as Base64 data URI and return it
 *   so the caller can store it directly in MongoDB (works on any cloud server).
 */
const uploadToCloudinary = (fileBuffer, folder = 'trustvault/documents', originalname = 'document.pdf') => {
  return new Promise((resolve, reject) => {
    if (!hasCloudinary) {
      // ── Base64 fallback ──────────────────────────────────────────
      // Detect MIME type from filename extension
      const ext = (originalname || '').split('.').pop().toLowerCase();
      const mimeMap = {
        pdf:  'application/pdf',
        png:  'image/png',
        jpg:  'image/jpeg',
        jpeg: 'image/jpeg',
        gif:  'image/gif',
        webp: 'image/webp',
      };
      const mime = mimeMap[ext] || 'application/octet-stream';
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      const publicId = `local_${Date.now()}_${originalname}`;

      console.log(`[Base64 Storage] Stored "${originalname}" (${Math.round(fileBuffer.length / 1024)} KB) in MongoDB`);
      return resolve({
        secure_url: dataUri,
        public_id: publicId,
      });
    }

    // ── Real Cloudinary upload ───────────────────────────────────────
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!hasCloudinary || (publicId && publicId.startsWith('local_'))) {
    console.log(`[Storage] Skipping delete for "${publicId}" (Base64/local mode)`);
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

module.exports = { uploadToCloudinary, deleteFromCloudinary, hasCloudinary };
