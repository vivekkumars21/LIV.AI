import logging
import sys
import os

# Ensure the backend module is resolvable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO)

print("--- Pre-downloading AI Models ---")
print("This may take several minutes depending on your internet connection...")

print("\n1. Loading YOLOv8m-seg (Object Detector)...")
from backend.models.object_detector import object_detector
object_detector.load_model()
print("   YOLOv8m-seg is ready.")

print("\n2. Loading ZoeD_NK (Depth Estimator via Torch Hub)...")
from backend.models.depth_estimator import depth_estimator
depth_estimator.load_model()
print("   ZoeDepth is ready.")

print("\nAll models pre-downloaded successfully!")
