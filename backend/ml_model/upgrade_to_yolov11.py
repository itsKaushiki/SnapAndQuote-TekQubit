# YOLOv11 Installation and Setup Script
# Run this script to upgrade from YOLOv5 to YOLOv11

import subprocess
import sys
import os
from pathlib import Path
import json

def run_command(command, description):
    """Run a shell command with error handling"""
    print(f"🚀 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr.strip()}")
        return False

def install_dependencies():
    """Install YOLOv11 dependencies"""
    print("📦 Installing YOLOv11 dependencies...")
    
    # Install ultralytics (YOLOv11)
    commands = [
        ("pip install ultralytics", "Installing Ultralytics YOLO package"),
        ("pip install opencv-python", "Installing OpenCV"),
        ("pip install pillow", "Installing Pillow for image processing"),
        ("pip install numpy", "Installing NumPy"),
        ("pip install torch torchvision", "Installing PyTorch")
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            print(f"⚠️  Warning: {description} failed, but continuing...")
    
def download_yolov11_weights():
    """Download pre-trained YOLOv11 weights"""
    print("⬇️  Downloading YOLOv11 weights...")
    
    # Create weights directory if it doesn't exist
    weights_dir = Path(__file__).parent / "weights"
    weights_dir.mkdir(exist_ok=True)
    
    # Download YOLOv11 weights (we'll use YOLOv11n for speed, but you can use larger models)
    weights_commands = [
        ("python -c \"from ultralytics import YOLO; YOLO('yolo11n.pt').export()\"", "Downloading YOLOv11n weights"),
        ("python -c \"from ultralytics import YOLO; YOLO('yolo11s.pt').export()\"", "Downloading YOLOv11s weights (optional)")
    ]
    
    for command, description in weights_commands:
        if not run_command(command, description):
            print(f"⚠️  {description} failed, you may need to download weights manually")

def test_installation():
    """Test YOLOv11 installation"""
    print("🧪 Testing YOLOv11 installation...")
    
    test_code = '''
import sys
try:
    from ultralytics import YOLO
    print("✅ Ultralytics YOLO imported successfully")
    
    # Test loading a model
    model = YOLO("yolo11n.pt")
    print("✅ YOLOv11 model loaded successfully")
    
    print("🎉 YOLOv11 installation test passed!")
    sys.exit(0)
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error testing YOLOv11: {e}")
    sys.exit(1)
'''
    
    if run_command(f'python -c "{test_code}"', "Testing YOLOv11 installation"):
        return True
    else:
        print("❌ YOLOv11 installation test failed")
        return False

def update_backend_controller():
    """Update the detect controller to use YOLOv11"""
    print("🔧 Updating backend detection controller...")
    
    controller_path = Path(__file__).parent.parent / "controllers" / "detectController.js"
    
    if not controller_path.exists():
        print("⚠️  Detection controller not found, skipping update")
        return
    
    try:
        with open(controller_path, 'r') as f:
            content = f.read()
        
        # Replace detect_custom.py with detect_yolov11.py
        updated_content = content.replace('detect_custom.py', 'detect_yolov11.py')
        
        with open(controller_path, 'w') as f:
            f.write(updated_content)
        
        print("✅ Backend controller updated to use YOLOv11")
        
    except Exception as e:
        print(f"❌ Failed to update backend controller: {e}")

def main():
    print("🔄 YOLOv5 to YOLOv11 Upgrade Script")
    print("=" * 50)
    
    # Step 1: Install dependencies
    install_dependencies()
    
    # Step 2: Download weights
    download_yolov11_weights()
    
    # Step 3: Test installation
    if test_installation():
        print("\n✅ YOLOv11 installation successful!")
    else:
        print("\n❌ YOLOv11 installation failed. Please check errors above.")
        return False
    
    # Step 4: Update backend controller
    update_backend_controller()
    
    print("\n🎉 YOLOv5 to YOLOv11 upgrade completed!")
    print("📝 Next steps:")
    print("   1. Restart your backend server")
    print("   2. Test car damage detection with the new YOLOv11 model")
    print("   3. Compare accuracy improvements")
    
    return True

if __name__ == "__main__":
    main()