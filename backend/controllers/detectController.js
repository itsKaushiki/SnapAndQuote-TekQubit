const path = require('path');
const { spawn } = require('child_process');

exports.detectDamage = (req, res) => {
  try {
    const { filename, useYolov11 } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const projectRoot = path.join(__dirname, '..');
    const imagePath = path.join(projectRoot, 'uploads', filename);
    
    // Choose detection script based on preference
    const yolov11Script = path.join(projectRoot, 'ml_model', 'detect_yolov11.py');
    const yolov5Script = path.join(projectRoot, 'ml_model', 'detect_ultra.py');
    const yolov5CustomScript = path.join(projectRoot, 'ml_model', 'detect_custom.py');
    
    // Determine which script to use (prefer YOLOv11 if available)
    let scriptPath = yolov5CustomScript; // default fallback
    let modelType = 'YOLOv5-custom';
    
    const fs = require('fs');
    
    if (useYolov11 !== false && fs.existsSync(yolov11Script)) {
      scriptPath = yolov11Script;
      modelType = 'YOLOv11';
    } else if (fs.existsSync(yolov5Script)) {
      scriptPath = yolov5Script;
      modelType = 'YOLOv5-ultra';
    }
    
    // For YOLOv11, try yolo11n.pt first, then fallback to best.pt
    let weightsPath = path.join(projectRoot, 'ml_model', 'weights', 'best.pt');
    if (modelType === 'YOLOv11') {
      const yolov11Weights = path.join(projectRoot, 'ml_model', 'weights', 'yolo11n.pt');
      if (fs.existsSync(yolov11Weights)) {
        weightsPath = yolov11Weights;
      }
    }

    console.log(`🔎 Running ${modelType} detection with:`, { 
      scriptPath, 
      weightsPath, 
      imagePath, 
      exists: {
        script: fs.existsSync(scriptPath),
        weights: fs.existsSync(weightsPath),
        image: fs.existsSync(imagePath)
      }
    });

    // Spawn python with absolute paths
    const python = spawn('python', [
      scriptPath,
      '--weights', weightsPath,
      imagePath
    ], {
      cwd: projectRoot, // ensure relative imports inside script work
      env: process.env
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    python.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutBuffer += text;
      console.log('🐍 detect stdout chunk:', text.trim());
    });

    python.stderr.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;
      console.error('🐍 detect stderr chunk:', text.trim());
    });

    python.on('error', (err) => {
      console.error('❌ Failed to start python process:', err);
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Python script failed with exit code: ${code}`);
        return res.status(500).json({ 
          message: 'Damage detection process failed',
          exitCode: code,
          stderr: stderrBuffer.split('\n').slice(-5) // last lines for debugging
        });
      }

      // Find the last JSON-looking line in stdout
      const lines = stdoutBuffer.split(/\r?\n/).filter(l => l.trim());
      let jsonLine = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('{') && lines[i].trim().endsWith('}')) {
          jsonLine = lines[i].trim();
          break;
        }
      }

      if (!jsonLine) {
        console.error('❌ No JSON output found in python stdout');
        return res.status(500).json({ 
            message: 'No detection output produced',
            rawStdout: stdoutBuffer.split('\n').slice(-10) 
        });
      }

      try {
        const parsed = JSON.parse(jsonLine);
        const parts = Array.isArray(parsed.parts) ? parsed.parts : [];
        const detections = Array.isArray(parsed.detections) ? parsed.detections : [];
        const confidence_used = parsed.confidence_used;
        console.log(`✅ ${modelType} Detection success. Parts:`, parts, 'Detections count:', detections.length, 'Confidence used:', confidence_used);
        return res.json({ parts, detections, confidence_used, modelType });
      } catch (err) {
        console.error('❌ JSON parse error on detection output:', err, 'Line:', jsonLine);
        return res.status(500).json({ 
          message: 'Failed to parse detection output',
          jsonLine
        });
      }
    });
  } catch (error) {
    console.error('Detection controller error (unexpected):', error);
    res.status(500).json({ message: 'Detection failed (unexpected error)' });
  }
};
