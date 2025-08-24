import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create subdirectory based on file type
    let subDir = 'documents';
    if (req.body.type) {
      subDir = req.body.type;
    } else if (file.fieldname) {
      subDir = file.fieldname;
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename with original extension
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const newFilename = `${uniqueId}${fileExt}`;
    cb(null, newFilename);
  }
});

// Build allowed extensions list (configurable via ALLOWED_UPLOAD_EXTS env, comma-separated)
const DEFAULT_ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.doc', '.docx'];
const envExts = (process.env.ALLOWED_UPLOAD_EXTS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)
  .map(e => (e.startsWith('.') ? e : `.${e}`));
const ALLOWED_EXTENSIONS = envExts.length ? envExts : DEFAULT_ALLOWED_EXTS;
// Basic mimetype allow list derived from common types (fallback to extension check)
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// File filter to check file types
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(fileExt) || ALLOWED_MIME_PREFIXES.some(p => mime === p || mime.startsWith(p.replace(/\/$/, '')))) {
    return cb(null, true);
  }
  cb(new Error(`Invalid file type (${fileExt || mime}). Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
};

// Create multer upload object with 5MB file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Helper to get file URL
export const getFileUrl = (file, req) => {
  let baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  // If baseUrl already ends with /api, prefer root for static file (auth-free)
  if (/\/api\/?$/.test(baseUrl)) {
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
  }
  const type = req.body.type || file.fieldname || 'documents';
  return `${baseUrl}/uploads/${type}/${file.filename}`;
};

export default upload;