const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
   cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Just handle file upload, return file info
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Extract car info from form data
    const { name, model, year } = req.body;
    
    if (!name || !model || !year) {
      return res.status(400).json({ message: 'Car name, model, and year are required' });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      carInfo: { name, model, year }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Audio file upload endpoint
router.post('/audio', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    res.json({
      message: 'Audio file uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ message: 'Audio file upload failed' });
  }
});

module.exports = router;
