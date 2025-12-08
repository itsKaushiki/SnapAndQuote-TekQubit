const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

exports.analyzeAudio = (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const projectRoot = path.join(__dirname, '..');
    const audioPath = path.join(projectRoot, 'uploads', filename);
    
    // Check if audio file exists
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    // Path to detection script
    const scriptPath = path.join(projectRoot, 'ml_model', 'detect_audio.py');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({ message: 'Audio detection script not found' });
    }

    // Model path - check multiple locations
    const possibleModelPaths = [
      path.join(projectRoot, 'ml_model', 'weights', 'toycar_anomaly_detector_improved.h5'),
      path.join(projectRoot, 'toycar_anomaly_detector_improved.h5'),
      path.join(projectRoot, '..', 'toycar_anomaly_detector_improved.h5'),
    ];
    
    let modelPath = null;
    for (const modelPathOption of possibleModelPaths) {
      if (fs.existsSync(modelPathOption)) {
        modelPath = modelPathOption;
        break;
      }
    }

    if (!modelPath) {
      return res.status(500).json({ 
        message: 'Model file not found. Please ensure toycar_anomaly_detector_improved.h5 is in the project root or backend/ml_model/weights/',
        searched: possibleModelPaths
      });
    }

    console.log(`🔊 Running audio analysis with:`, { 
      scriptPath, 
      modelPath, 
      audioPath,
      exists: {
        script: fs.existsSync(scriptPath),
        model: fs.existsSync(modelPath),
        audio: fs.existsSync(audioPath)
      }
    });

    // Spawn python process
    const python = spawn('python', [
      scriptPath,
      audioPath,
      '--model', modelPath,
      '--feature-type', 'multiple'
    ], {
      cwd: projectRoot,
      env: process.env
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    python.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutBuffer += text;
      console.log('🐍 audio stdout chunk:', text.trim());
    });

    python.stderr.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;
      console.error('🐍 audio stderr chunk:', text.trim());
    });

    python.on('error', (err) => {
      console.error('❌ Failed to start python process:', err);
      return res.status(500).json({ 
        message: 'Failed to start audio analysis process',
        error: err.message
      });
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Python script failed with exit code: ${code}`);
        return res.status(500).json({ 
          message: 'Audio analysis process failed',
          exitCode: code,
          stderr: stderrBuffer.split('\n').slice(-10) // last lines for debugging
        });
      }

      // Parse JSON output
      try {
        // Find the last JSON-looking line in stdout
        const lines = stdoutBuffer.split(/\r?\n/).filter(l => l.trim());
        let jsonLine = null;
        for (let i = lines.length - 1; i >= 0; i--) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            jsonLine = trimmed;
            break;
          }
        }

        if (!jsonLine) {
          console.error('❌ No JSON output found in python stdout');
          return res.status(500).json({ 
            message: 'No analysis output produced',
            rawStdout: stdoutBuffer.split('\n').slice(-10) 
          });
        }

        const parsed = JSON.parse(jsonLine);
        
        // Check for error in response
        if (parsed.error) {
          return res.status(500).json({ 
            message: 'Audio analysis error',
            error: parsed.error
          });
        }

        // Format response for frontend
        const response = {
          classification: parsed.class,
          score: parsed.score,
          confidence: parsed.confidence,
          probability_normal: parsed.probability_normal,
          probability_anomalous: parsed.probability_anomalous,
          isAnomalous: parsed.prediction === 1,
          uncertain: parsed.uncertain || false  // Include uncertainty flag from threshold-based approach
        };

        console.log(`✅ Audio analysis success. Result:`, response);
        return res.json(response);

      } catch (err) {
        console.error('❌ JSON parse error on audio analysis output:', err);
        return res.status(500).json({ 
          message: 'Failed to parse analysis output',
          rawStdout: stdoutBuffer.split('\n').slice(-10)
        });
      }
    });
  } catch (error) {
    console.error('Audio controller error (unexpected):', error);
    res.status(500).json({ message: 'Audio analysis failed (unexpected error)' });
  }
};

