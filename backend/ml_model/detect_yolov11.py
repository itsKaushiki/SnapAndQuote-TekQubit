import torch
import argparse
import json
from pathlib import Path
import sys
import cv2
import numpy as np

# YOLOv11 Detection Script using Ultralytics YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[WARNING] Ultralytics YOLO not available. Install with: pip install ultralytics")

def load_class_mapping(class_map_file):
    """Load class mapping from JSON file"""
    try:
        with open(class_map_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load class mapping: {e}")
        return {}

def detect_yolov11(weights_path, source_path, conf_threshold=0.25, fallback_conf=0.05):
    """
    Run YOLOv11 detection with fallback confidence levels
    """
    if not YOLO_AVAILABLE:
        raise ImportError("Ultralytics YOLO package not available")
    
    try:
        # Load YOLOv11 model
        # Ultralytics YOLO can accept model names (e.g., 'yolo11n.pt') and will download automatically
        print(f"[DEBUG] Loading YOLOv11 model from: {weights_path}")
        # Ultralytics will automatically download pretrained models if the file doesn't exist
        model = YOLO(weights_path)
        
        # Load class mapping
        class_map_file = Path(__file__).parent / "class_map.json"
        class_mapping = load_class_mapping(class_map_file)
        
        # First detection pass with normal confidence
        print(f"[DEBUG] First pass conf={conf_threshold}")
        start_time = time.time()
        results = model(source_path, conf=conf_threshold, verbose=False)
        first_pass_time = time.time() - start_time
        print(f"[DEBUG] First pass conf={conf_threshold} took {first_pass_time:.3f}s")
        
        # Process results
        detections = []
        detected_parts = set()
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls.item())
                    confidence = box.conf.item()
                    xyxy = box.xyxy[0].cpu().numpy().tolist()  # [x1, y1, x2, y2]
                    
                    # Map class ID to part name
                    original_name = str(class_id)
                    part_name = class_mapping.get(original_name, f"unknown_{class_id}")
                    
                    detections.append({
                        "class_id": class_id,
                        "original_name": original_name,
                        "name": part_name,
                        "confidence": confidence,
                        "box_xyxy": xyxy
                    })
                    detected_parts.add(part_name)
        
        # If no detections with normal confidence, try fallback
        if not detections:
            print(f"[DEBUG] Fallback pass conf={fallback_conf}")
            start_time = time.time()
            results = model(source_path, conf=fallback_conf, verbose=False)
            fallback_time = time.time() - start_time
            print(f"[DEBUG] Fallback pass conf={fallback_conf} took {fallback_time:.3f}s")
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls.item())
                        confidence = box.conf.item()
                        xyxy = box.xyxy[0].cpu().numpy().tolist()
                        
                        original_name = str(class_id)
                        part_name = class_mapping.get(original_name, f"unknown_{class_id}")
                        
                        detections.append({
                            "class_id": class_id,
                            "original_name": original_name,
                            "name": part_name,
                            "confidence": confidence,
                            "box_xyxy": xyxy
                        })
                        detected_parts.add(part_name)
            
            confidence_used = fallback_conf
        else:
            confidence_used = conf_threshold
        
        parts_list = list(detected_parts)
        print(f"[DEBUG] Detected parts: {parts_list}")
        
        # Return results in expected format
        return {
            "parts": parts_list,
            "detections": detections,
            "confidence_used": confidence_used,
            "image": source_path
        }
        
    except Exception as e:
        print(f"[ERROR] YOLOv11 detection failed: {e}")
        raise

def main():
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, required=True, help='Model weights path')
    parser.add_argument('source', type=str, help='Source image path')
    parser.add_argument('--conf', type=float, default=0.25, help='Confidence threshold')
    args = parser.parse_args()
    
    try:
        # Run detection
        results = detect_yolov11(args.weights, args.source, args.conf)
        
        # Output results as JSON
        print(json.dumps(results))
        
    except Exception as e:
        print(f"[ERROR] Detection failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    import time
    main()