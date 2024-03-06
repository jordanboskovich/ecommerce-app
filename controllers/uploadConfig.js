// Importing required modules and dependencies
import multer from 'multer';
import path from 'path';

// Setting up multer storage configuration
const storage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  // Define filename for uploaded files
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Define file filter function
const fileFilter = (req, file, cb) => {
  // Check file mimetype to allow only jpeg and png images
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    // If file format is not supported, return an error
    cb(new Error('Unsupported file format'), false);
  }
};

// Export multer upload configuration
export const upload = multer({
  storage: storage,
  limits: {
    // Set file size limit to 5MB
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  // Set file filter for supported file formats
  fileFilter: fileFilter
});
