const path = require('path');

function toAbsolutePath(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return path.isAbsolute(normalized) ? path.normalize(normalized) : path.normalize(path.resolve(process.cwd(), normalized));
}

// NODE_ENV-based default when UPLOAD_DIR/UPLOAD_PATH aren't explicitly set:
// development -> backend/uploads, production -> /var/www/uploads.
function defaultUploadRoot() {
  return process.env.NODE_ENV === 'production'
    ? '/var/www/uploads'
    : path.join(process.cwd(), 'uploads');
}

// Single source of truth for where files live on disk. Every piece of code that
// saves or serves uploads must go through this — never hardcode 'uploads' elsewhere.
function resolveUploadRoot() {
  return toAbsolutePath(process.env.UPLOAD_DIR) || toAbsolutePath(process.env.UPLOAD_PATH) || defaultUploadRoot();
}

// Files are stored flat, directly under the upload root — no per-entity subfolders.
function getUploadPublicUrl(fileName) {
  const safeFileName = String(fileName || '').trim();
  if (!safeFileName) throw new Error('fileName is required');
  return `/uploads/${safeFileName}`;
}

module.exports = { resolveUploadRoot, getUploadPublicUrl };
