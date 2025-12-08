#!/usr/bin/env python3
"""
Audio Anomaly Detection Script
Uses the trained ToyCar anomaly detector model to classify audio as normal or anomalous
"""

import os
import sys
import json
import argparse
import numpy as np
import librosa
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import StandardScaler
import joblib
import warnings
warnings.filterwarnings('ignore')

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

# ============================================
# FEATURE EXTRACTION FUNCTIONS
# ============================================

def extract_mfcc_features(audio, sr=16000, n_mfcc=13):
    """Extract MFCC features"""
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    mfcc_mean = np.mean(mfcc, axis=1)
    return mfcc_mean

def extract_multiple_features(audio, sr=16000):
    """Extract multiple audio features (same as training)"""
    features = {}

    # MFCC
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    features['mfcc_mean'] = np.mean(mfcc, axis=1)
    features['mfcc_std'] = np.std(mfcc, axis=1)

    # Spectral features
    spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
    features['spectral_centroid_mean'] = np.mean(spectral_centroids)

    spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
    features['spectral_rolloff_mean'] = np.mean(spectral_rolloff)

    zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
    features['zcr_mean'] = np.mean(zero_crossing_rate)

    # Chroma
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
    features['chroma_mean'] = np.mean(chroma, axis=1)

    # Combine all features
    feature_vector = np.concatenate([
        features['mfcc_mean'],
        features['mfcc_std'],
        [features['spectral_centroid_mean']],
        [features['spectral_rolloff_mean']],
        [features['zcr_mean']],
        features['chroma_mean']
    ])

    return feature_vector

# ============================================
# MAIN INFERENCE FUNCTION
# ============================================

def find_scaler_path(model_path):
    """
    Find scaler.pkl file in the same directory as model or nearby locations
    
    Args:
        model_path: Path to the model file
    
    Returns:
        Path to scaler file or None if not found
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    model_dir = os.path.dirname(os.path.abspath(model_path))
    
    # Check multiple levels up to find workspace root (where scaler.pkl might be)
    # From detect_audio.py: snapnew/snap&quote/snap-quote-AI/backend/ml_model/detect_audio.py
    # Scaler might be at: snapnew/scaler.pkl (4 levels up)
    current = script_dir
    workspace_roots = []
    for _ in range(5):  # Check up to 5 levels up
        workspace_roots.append(current)
        current = os.path.dirname(current)
        if not current or current == os.path.dirname(current):
            break
    
    possible_scaler_paths = [
        os.path.join(model_dir, 'scaler.pkl'),  # Same dir as model
        os.path.join(script_dir, 'scaler.pkl'),
        os.path.join(script_dir, 'weights', 'scaler.pkl'),
        os.path.join(project_root, 'scaler.pkl'),  # Project root
        os.path.join(project_root, 'ml_model', 'weights', 'scaler.pkl'),
        'scaler.pkl',  # Current directory
    ]
    
    # Add workspace root paths
    for root in workspace_roots:
        possible_scaler_paths.append(os.path.join(root, 'scaler.pkl'))
    
    for path in possible_scaler_paths:
        if os.path.exists(path):
            return path
    
    return None

def detect_audio_anomaly(audio_file_path, model_path, feature_type='multiple', sr=16000, scaler_path=None, confidence_threshold=0.7):
    """
    Detect anomaly in audio file (using threshold-based approach from toy_improved.ipynb)
    
    Args:
        audio_file_path: Path to audio file
        model_path: Path to saved model (.h5 file)
        feature_type: Type of features ('multiple' recommended)
        sr: Sample rate for audio loading
        scaler_path: Optional path to scaler.pkl file (auto-detected if None)
        confidence_threshold: Minimum confidence threshold (0-1). Predictions below this 
                              will be marked as 'Uncertain' (default: 0.7)
    
    Returns:
        Dictionary with prediction results including uncertainty handling
    """
    try:
        # Load model
        print(f"[DEBUG] Loading model from {model_path}", file=sys.stderr)
        model = keras.models.load_model(model_path, compile=False)
        print(f"[DEBUG] Model loaded successfully", file=sys.stderr)
        
        # Load scaler (required for proper normalization)
        if scaler_path is None:
            scaler_path = find_scaler_path(model_path)
        
        scaler = None
        if scaler_path and os.path.exists(scaler_path):
            print(f"[DEBUG] Loading scaler from {scaler_path}", file=sys.stderr)
            try:
                scaler = joblib.load(scaler_path)
                print(f"[DEBUG] Scaler loaded successfully", file=sys.stderr)
            except Exception as e:
                print(f"[WARNING] Failed to load scaler: {e}. Using raw features.", file=sys.stderr)
        else:
            print(f"[WARNING] Scaler not found. Searched: {scaler_path}. Using raw features.", file=sys.stderr)
            print(f"[WARNING] This may result in incorrect confidence scores!", file=sys.stderr)
        
        # Load and preprocess audio
        print(f"[DEBUG] Loading audio from {audio_file_path}", file=sys.stderr)
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
        
        audio, _ = librosa.load(audio_file_path, sr=sr, duration=10)
        print(f"[DEBUG] Audio loaded: {len(audio)} samples", file=sys.stderr)
        
        # Extract features
        print(f"[DEBUG] Extracting {feature_type} features", file=sys.stderr)
        if feature_type == 'multiple':
            features = extract_multiple_features(audio, sr=sr)
        elif feature_type == 'mfcc':
            features = extract_mfcc_features(audio, sr=sr)
        else:
            raise ValueError(f"Unknown feature type: {feature_type}")
        
        features = features.reshape(1, -1)  # Add batch dimension
        print(f"[DEBUG] Features shape: {features.shape}", file=sys.stderr)
        
        # Normalize features using scaler (CRITICAL for proper confidence scores)
        if scaler is not None:
            print(f"[DEBUG] Normalizing features with scaler", file=sys.stderr)
            features = scaler.transform(features)
        else:
            print(f"[WARNING] Features not normalized - confidence scores may be unreliable", file=sys.stderr)
        
        # Predict
        print(f"[DEBUG] Running prediction", file=sys.stderr)
        proba = model.predict(features, verbose=0)[0]
        prediction = int(np.argmax(proba))
        
        # Ensure probabilities are valid (not NaN or extreme)
        proba = np.clip(proba, 1e-7, 1.0 - 1e-7)  # Clip to avoid log(0)
        proba = proba / proba.sum()  # Renormalize
        
        confidence = float(max(proba))
        
        # Apply confidence threshold (approach from toy_improved.ipynb)
        # If confidence is below threshold, mark as 'Uncertain'
        if confidence < confidence_threshold:
            result_class = 'Uncertain'
            uncertain = True
        else:
            result_class = 'Anomalous' if prediction == 1 else 'Normal'
            uncertain = False
        
        result = {
            'prediction': prediction,
            'class': result_class,
            'probability_normal': float(proba[0]),
            'probability_anomalous': float(proba[1]),
            'confidence': confidence,
            'uncertain': uncertain,
            'score': int(confidence * 100)  # Health score out of 100
        }
        
        if uncertain:
            print(f"[DEBUG] Prediction: {result['class']} (confidence: {result['confidence']:.2%} < threshold {confidence_threshold:.2%})", file=sys.stderr)
        else:
            print(f"[DEBUG] Prediction: {result['class']} (confidence: {result['confidence']:.2%})", file=sys.stderr)
        return result
        
    except Exception as e:
        print(f"[ERROR] Detection failed: {str(e)}", file=sys.stderr)
        raise

# ============================================
# COMMAND LINE INTERFACE
# ============================================

def main():
    parser = argparse.ArgumentParser(description='Audio Anomaly Detection')
    parser.add_argument('audio_file', type=str, help='Path to audio file')
    parser.add_argument('--model', type=str, 
                       default='toycar_anomaly_detector_improved.h5',
                       help='Path to model file')
    parser.add_argument('--feature-type', type=str, default='multiple',
                       choices=['mfcc', 'multiple'],
                       help='Feature extraction type')
    parser.add_argument('--sr', type=int, default=16000,
                       help='Sample rate for audio loading')
    parser.add_argument('--scaler', type=str, default=None,
                       help='Path to scaler.pkl file (auto-detected if not provided)')
    parser.add_argument('--threshold', type=float, default=0.7,
                       help='Confidence threshold (0-1). Predictions below this will be marked as Uncertain (default: 0.7)')
    
    args = parser.parse_args()
    
    # Resolve model path (check multiple locations)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    possible_model_paths = [
        args.model,  # Absolute or relative to current dir
        os.path.join(script_dir, 'weights', args.model),
        os.path.join(project_root, args.model),
        os.path.join(project_root, 'ml_model', 'weights', args.model),
    ]
    
    model_path = None
    for path in possible_model_paths:
        if os.path.exists(path):
            model_path = path
            break
    
    if not model_path:
        print(json.dumps({
            'error': f'Model file not found. Searched: {possible_model_paths}'
        }))
        sys.exit(1)
    
    try:
        result = detect_audio_anomaly(
            args.audio_file,
            model_path,
            feature_type=args.feature_type,
            sr=args.sr,
            scaler_path=args.scaler,
            confidence_threshold=args.threshold
        )
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()

