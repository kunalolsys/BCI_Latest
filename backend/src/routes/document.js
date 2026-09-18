const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/auth');
const { uploadDocument, getTaskDocuments, deleteDocument, downloadDocument } = require('../controllers/documentController');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get taskId from request params
    const taskId = req.params.taskId;
    // Create unique filename with taskId and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${taskId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',           // jpeg
    'image/png',            // png
    'application/pdf',      // pdf
    'application/msword',   // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX, XLS, and XLSX files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload document
router.post('/upload/task/:taskId', authenticateJWT, upload.single('document'), uploadDocument);

// Get all documents for a task
router.get('/upload/task/:taskId', authenticateJWT, getTaskDocuments);

// Delete a document
router.delete('/upload/task/:taskId/:documentId', authenticateJWT, deleteDocument);

// Download a document
router.get('/upload/task/download/:documentPath', authenticateJWT, downloadDocument);

module.exports = router; 