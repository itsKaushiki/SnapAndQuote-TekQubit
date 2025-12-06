const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { generateSideBySidePDF } = require('../utils/pdfGenerator');

// POST /api/reports/side-by-side
// Optional body: { filenames: ['file1.jpg', 'file2.jpg'], includeAnnotated: true }
router.post('/side-by-side', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const { filenames, includeAnnotated } = req.body || {};

    let filesToUse = [];
    if (Array.isArray(filenames) && filenames.length) {
      filesToUse = filenames.filter(fn => fs.existsSync(path.join(uploadsDir, fn)));
    } else {
      // use all images in uploads directory
      filesToUse = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    }

    // Build entries; we do not have persistent metadata so infer from filename
    const entries = filesToUse.map((fn) => {
      const meta = { filename: fn };
      // If files are named like timestamp-name_model_year.ext, try to parse
      const base = fn.replace(/^(\d+-)?/, '').replace(/\.(jpg|jpeg|png)$/i, '');
      const parts = base.split('-');
      if (parts.length >= 1) {
        meta.carInfo = { name: parts[0] || '', model: parts[1] || '', year: parts[2] || '' };
      }
      // If includeAnnotated true, look for a similarly named annotated file
      if (includeAnnotated) {
        const annotatedCandidate = fn.replace(/(\.[^.]+)$/, '-annotated$1');
        if (fs.existsSync(path.join(uploadsDir, annotatedCandidate))) {
          meta.annotatedFilename = annotatedCandidate;
        }
      }
      return meta;
    });

    const pdfPath = await generateSideBySidePDF(entries);
    const relPath = path.relative(path.join(__dirname, '..'), pdfPath);
    res.json({ pdfPath: relPath, absolutePath: pdfPath });
  } catch (err) {
    console.error('Error generating side-by-side PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
