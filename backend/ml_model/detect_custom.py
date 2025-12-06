import torch
import argparse
import json
from pathlib import Path
import sys

# ✅ Ensure yolov5 and its parent are first on sys.path so that `models`, `utils` resolve
current_dir = Path(__file__).resolve().parent
yolo_dir = current_dir / 'yolov5'

# Insert at position 0 instead of append to prioritize over any globally installed packages
if str(yolo_dir) not in sys.path:
    sys.path.insert(0, str(yolo_dir))
parent_dir = yolo_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

print(f"[detect_custom] sys.path configured. yolov5 dir: {yolo_dir}")

from models.experimental import attempt_load
from utils.datasets import LoadImages
from utils.general import non_max_suppression, scale_coords
from utils.torch_utils import select_device

# 🧠 Add safe globals for Ultralytics model
# NOTE: Removed prior add_safe_globals usage. Passing strings to add_safe_globals caused
# PyTorch's weights-only unpickler to iterate over a string object and raise
# AttributeError ('str' object has no attribute __module__). If you truly need to
# authorize custom classes, import the actual class object and pass that object, e.g.:
#   from ultralytics.nn.tasks import DetectionModel
#   add_safe_globals([DetectionModel])
# For this checkpoint we attempt normal load without extending safe globals.

# Parse args
parser = argparse.ArgumentParser()
parser.add_argument('--weights', type=str, required=True)
parser.add_argument('source', type=str)
opt = parser.parse_args()

# Setup
device = select_device('cpu')
imgsz = 640

# ✅ Load YOLOv5 model using attempt_load; fallback to manual extraction if needed
load_err = None
model = None
names = {}
try:
    model = attempt_load(opt.weights, map_location=device)
    names = model.names if hasattr(model, 'names') else {}
except Exception as e:
    load_err = e
    print(f"[detect_custom] attempt_load failed: {e}; trying manual torch.load fallback", file=sys.stderr)
    try:
        ckpt = torch.load(opt.weights, map_location=device)
        # ckpt may be dict with 'model' key
        if isinstance(ckpt, dict) and 'model' in ckpt:
            model = ckpt['model']
            if hasattr(model, 'float'):
                model.float().eval()
            names = getattr(model, 'names', {}) or getattr(getattr(model, 'model', {}), 'names', {})
        else:
            # last resort assume loaded object is already the model
            model = ckpt
            if hasattr(model, 'eval'):
                model.eval()
            names = getattr(model, 'names', {})
    except Exception as e2:
        print(f"[detect_custom] FATAL: fallback load failed: {e2}", file=sys.stderr)
        raise e2

if model is None:
    raise RuntimeError(f"Failed to load model. attempt_load error: {load_err}")

if not names:
    # If class names missing, create index-based mapping
    try:
        nc = getattr(model, 'nc', None) or getattr(getattr(model, 'model', {}), 'nc', None) or 0
        names = {i: f'class_{i}' for i in range(int(nc))}
    except Exception:
        names = {}

# Load image
dataset = LoadImages(opt.source, img_size=imgsz)

# Detection
for path, img, im0s, vid_cap in dataset:
    # img: numpy with shape (3, h, w) from LoadImages already letterboxed
    img_tensor = torch.from_numpy(img).to(device)
    img_tensor = img_tensor.float() / 255.0
    if img_tensor.ndimension() == 3:
        img_tensor = img_tensor.unsqueeze(0)

    with torch.no_grad():
        pred = model(img_tensor, augment=False)[0]
    pred = non_max_suppression(pred, 0.25, 0.45)

    result_parts = []
    for det in pred:
        if det is not None and len(det):
            det[:, :4] = scale_coords(img_tensor.shape[2:], det[:, :4], im0s.shape).round()
            for *xyxy, conf, cls in det:
                idx = int(cls.item() if hasattr(cls, 'item') else int(cls))
                part_name = names.get(idx, f'class_{idx}') if isinstance(names, dict) else names[idx] if isinstance(names, (list, tuple)) and idx < len(names) else str(idx)
                result_parts.append(part_name)

    print(json.dumps({"parts": result_parts}))
