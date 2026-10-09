// A URL this server will actually serve/accept as "uploaded": either our own
// local /uploads/... path, or an absolute https:// URL (e.g. Cloudinary).
// Centralized so every upload-url check stays in sync with how uploads are
// actually stored (storage.service.js returns a Cloudinary secure_url when
// that provider is active, which is never a bare relative path).
function isUploadedUrl(v) {
  return typeof v === 'string' && v.length < 500 && (/^\/?[\w\-./]+$/.test(v) || /^https:\/\//.test(v));
}

module.exports = { isUploadedUrl };
