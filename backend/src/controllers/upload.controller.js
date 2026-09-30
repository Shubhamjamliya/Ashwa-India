const { uploadImageBuffer } = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');

// Generic reusable image upload — any authenticated actor can use this to get
// back a portable /uploads/... (or Cloudinary) URL, then attach it to whatever
// entity they're creating/editing (horse photos, product photos, profile pic...).
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const width = Number(req.body?.width) || undefined;
  const height = Number(req.body?.height) || undefined;

  const result = await uploadImageBuffer(req.file.buffer, {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  });

  res.status(200).json({ message: 'Image uploaded successfully', ...result });
});
