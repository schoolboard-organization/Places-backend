// Import required modules
const multer = require("multer");
const { v1: uuid } = require("uuid");

// Define allowed MIME types and their corresponding file extensions
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// Configure multer middleware for file upload
const fileUpload = multer({
  // Set maximum file size limit to 500KB
  limits: 500000,

  // Configure storage options
  storage: multer.diskStorage({
    // Set destination folder for uploaded files
    destination: (req, file, callback) => {
      callback(null, "uploads/images");
    },

    // Generate unique filename for uploaded file
    filename: (req, file, callback) => {
      const extension = MIME_TYPE_MAP[file.mimetype];
      // Use UUID to create unique filename
      callback(null, uuid() + "." + extension);
    },
  }),

  // Validate file type before upload
  fileFilter: (req, file, callback) => {
    // Check if the file's MIME type is in the allowed types
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    // If not valid, create an error, otherwise pass null as the error
    let error = isValid ? null : new Error("Invalid MIME type");
    // Pass the error (or null) and the validity status to the callback
    callback(error, isValid);
  },
});

// Export the configured multer middleware
module.exports = fileUpload;
