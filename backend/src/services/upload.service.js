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

// File filter to check file types
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOC files are allowed.'));
  }
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
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const type = req.body.type || file.fieldname || 'documents';
  return `${baseUrl}/uploads/${type}/${file.filename}`;
};

export default upload;