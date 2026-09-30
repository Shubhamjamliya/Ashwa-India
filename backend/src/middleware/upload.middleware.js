const multer = require('multer');

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];

function fileFilter(req, file, cb) {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PNG, JPG, WEBP or ICO are allowed.'));
  }
  cb(null, true);
}

// Memory storage: files stay as a buffer so the storage service can process
// (resize/convert) them and send the result to local disk or Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload };
