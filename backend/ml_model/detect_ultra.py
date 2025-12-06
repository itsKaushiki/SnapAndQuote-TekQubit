import sys, json, time
from pathlib import Path

# Attempt to load class mapping JSON if present next to this script
CLASS_MAP = None
try:
    cm_path = Path(__file__).parent / 'class_map.json'
    if cm_path.exists():
        with open(cm_path, 'r', encoding='utf-8') as f:
            CLASS_MAP = json.load(f)
except Exception as e:
    print(f"[DEBUG] Failed to load class_map.json: {e}", file=sys.stderr)

try:
    from ultralytics import YOLO
except ImportError:
    print("Ultralytics not installed. Run: pip install ultralytics", file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 3:
    print("Usage: python detect_ultra.py <weights> <image_path> [confidence]", file=sys.stderr)
    sys.exit(1)

weights = sys.argv[1]
image = sys.argv[2]
user_conf = None
if len(sys.argv) >= 4:
    try:
        user_conf = float(sys.argv[3])
    except ValueError:
        print(f"Invalid confidence value provided: {sys.argv[3]}", file=sys.stderr)

if not Path(weights).exists():
    print(f"Weights file not found: {weights}", file=sys.stderr)
    sys.exit(2)

if not Path(image).exists():
    print(f"Image file not found: {image}", file=sys.stderr)
    sys.exit(3)

model = YOLO(weights)

initial_conf = user_conf if user_conf is not None else 0.25
attempts = []

def run_prediction(conf):
    start = time.time()
    results = model.predict(
        image,
        imgsz=640,
        conf=conf,
        verbose=False
    )
    duration = time.time() - start
    return results, duration

results, dur = run_prediction(initial_conf)
print(f"[DEBUG] First pass conf={initial_conf} took {dur:.3f}s", file=sys.stderr)

# If no detections, attempt a lower confidence (auto fallback) unless user explicitly set a very low one already
total_boxes = sum(len(r.boxes) for r in results)
if total_boxes == 0 and (user_conf is None or initial_conf > 0.06):
    fallback_conf = 0.05
    results, dur2 = run_prediction(fallback_conf)
    print(f"[DEBUG] Fallback pass conf={fallback_conf} took {dur2:.3f}s", file=sys.stderr)
    used_conf = fallback_conf
else:
    used_conf = initial_conf

detections = []
parts = []
for r_i, r in enumerate(results):
    names_map = r.names
    for b_i, box in enumerate(r.boxes):
        cls_id = int(box.cls.item())
        name = names_map.get(cls_id, f"class_{cls_id}")
        conf = float(box.conf.item()) if hasattr(box, 'conf') else None
        # xyxy coordinates
        if hasattr(box, 'xyxy'):
            xyxy = box.xyxy[0].tolist()
        else:
            xyxy = None
        mapped_name = CLASS_MAP.get(str(cls_id), name) if CLASS_MAP else name
        det_obj = {
            "class_id": cls_id,
            "original_name": name,
            "name": mapped_name,
            "confidence": conf,
            "box_xyxy": xyxy
        }
        detections.append(det_obj)
        parts.append(mapped_name)

# Deduplicate parts preserving order
parts = list(dict.fromkeys(parts))

if not parts:
    print("[DEBUG] No parts detected after all passes", file=sys.stderr)
else:
    print(f"[DEBUG] Detected parts: {parts}", file=sys.stderr)

output = {
    "parts": parts,
    "detections": detections,
    "confidence_used": used_conf,
    "image": image
}
print(json.dumps(output))
