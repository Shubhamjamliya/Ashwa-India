const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { resolveUploadRoot, getUploadPublicUrl } = require('../utils/uploadPaths');
const { uploadBuffer: cloudinaryUploadBuffer, destroy: cloudinaryDestroy } = require('../utils/cloudinary');

const UPLOAD_BASE_DIR = resolveUploadRoot();
fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });

function randomId() {
  return crypto.randomBytes(4).toString('hex');
}

async function getUploadProvider() {
  const SystemSettings = require('../models/SystemSettings'); // lazy require avoids circular init
  const settings = await SystemSettings.findOne({ key: 'singleton' });
  return settings?.developerSettings?.imageUploadProvider || 'local';
}

// Resizes + converts to webp, then saves flat under the upload root (local) or
// to Cloudinary (whichever is the active provider). Returns a normalized ref:
// { url, filename?, publicId?, provider }
async function uploadImageBuffer(buffer, { width = 1200, height = 1200, quality = 82 } = {}) {
  if (!buffer) throw new Error('File buffer is required');

  const processed = await sharp(buffer)
    .resize({ width, height, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const provider = await getUploadProvider();

  if (provider === 'cloudinary') {
    const result = await cloudinaryUploadBuffer(processed);
    return { url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' };
  }

  const fileName = `img_${randomId()}.webp`;
  fs.writeFileSync(path.join(UPLOAD_BASE_DIR, fileName), processed);
  return { url: getUploadPublicUrl(fileName), filename: fileName, provider: 'local' };
}

// For non-image files (or images that must keep their original format) — saved
// as-is, flat under the upload root. Cloudinary is only used for images.
function uploadFileBuffer(buffer, originalName, extension) {
  if (!buffer) throw new Error('File buffer is required');
  const ext = extension || path.extname(originalName || '') || '';
  const fileName = `file_${randomId()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_BASE_DIR, fileName), buffer);
  return { url: getUploadPublicUrl(fileName), filename: fileName, provider: 'local' };
}

async function removeUploadedFile(fileRef) {
  if (!fileRef) return;
  if (fileRef.provider === 'cloudinary' && fileRef.publicId) {
    await cloudinaryDestroy(fileRef.publicId);
    return;
  }
  if (fileRef.filename) {
    fs.unlink(path.join(UPLOAD_BASE_DIR, fileRef.filename), () => {}); // best-effort
  }
}

module.exports = { uploadImageBuffer, uploadFileBuffer, removeUploadedFile, getUploadProvider };
