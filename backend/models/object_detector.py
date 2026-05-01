"""
YOLOv8-seg Object Detector
Loads YOLOv8m-seg for indoor object detection and instance segmentation.
"""

import numpy as np
from PIL import Image
from typing import Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class DetectedObject:
    """A single detected object with bounding box and segmentation mask."""

    name: str
    confidence: float
    bbox: dict  # {"x1": int, "y1": int, "x2": int, "y2": int} in pixels
    pixel_width: int
    pixel_height: int
    mask: Optional[np.ndarray] = field(default=None, repr=False)  # (H, W) binary

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "confidence": round(self.confidence, 3),
            "bbox": self.bbox,
            "pixel_width": self.pixel_width,
            "pixel_height": self.pixel_height,
        }


# Indoor / furniture COCO classes we care about
INDOOR_CLASSES = {
    "chair", "couch", "potted plant", "bed", "dining table",
    "toilet", "tv", "laptop", "refrigerator", "oven", "sink",
    "microwave", "toaster", "book", "clock", "vase",
    "bottle", "cup", "bowl", "cell phone", "mouse",
    "keyboard", "remote", "suitcase", "backpack",
}


class ObjectDetector:
    """Singleton YOLOv8-seg wrapper."""

    _instance: Optional["ObjectDetector"] = None
    _model = None
    _is_loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        """Load YOLOv8m-seg. Downloads weights on first run (~50MB)."""
        if self._is_loaded:
            return

        logger.info("Loading YOLOv8m-seg model...")

        try:
            from ultralytics import YOLO
            import torch

            # Temporary fix for PyTorch 2.6 weights_only=True default breaking older ultralytics
            _original_load = torch.load
            def _custom_load(*args, **kwargs):
                kwargs.setdefault("weights_only", False)
                return _original_load(*args, **kwargs)
            
            torch.load = _custom_load
            self._model = YOLO("yolov8m-seg.pt")
            torch.load = _original_load # restore it

            self._is_loaded = True
            logger.info("YOLOv8m-seg loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8-seg: {e}")
            raise RuntimeError("Could not load YOLOv8-seg") from e

    def detect_objects(
        self,
        image: Image.Image,
        confidence_threshold: float = 0.35,
        indoor_only: bool = True,
    ) -> list[DetectedObject]:
        """
        Run detection + segmentation on a PIL image.

        Returns list of DetectedObject sorted by confidence (descending).
        """
        if not self._is_loaded:
            self.load_model()

        image_rgb = image.convert("RGB")
        img_w, img_h = image_rgb.size

        results = self._model(
            image_rgb,
            conf=confidence_threshold,
            verbose=False,
        )

        detected: list[DetectedObject] = []

        for result in results:
            if result.boxes is None:
                continue

            boxes = result.boxes
            masks = result.masks  # may be None if no masks

            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i])
                cls_name = self._model.names[cls_id]
                conf = float(boxes.conf[i])

                if indoor_only and cls_name not in INDOOR_CLASSES:
                    continue

                # Bounding box (xyxy)
                x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)

                # Segmentation mask
                mask_np = None
                if masks is not None and i < len(masks.data):
                    mask_tensor = masks.data[i]
                    mask_resized = (
                        mask_tensor.cpu().numpy()
                    )
                    # Resize mask to original image size if needed
                    if mask_resized.shape != (img_h, img_w):
                        import cv2
                        mask_resized = cv2.resize(
                            mask_resized.astype(np.float32),
                            (img_w, img_h),
                            interpolation=cv2.INTER_NEAREST,
                        )
                    mask_np = (mask_resized > 0.5).astype(np.uint8)

                detected.append(
                    DetectedObject(
                        name=cls_name,
                        confidence=conf,
                        bbox={
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                        },
                        pixel_width=int(x2 - x1),
                        pixel_height=int(y2 - y1),
                        mask=mask_np,
                    )
                )

        # Sort by confidence
        detected.sort(key=lambda d: d.confidence, reverse=True)

        logger.info(f"Detected {len(detected)} indoor objects")
        return detected

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded


# Module-level singleton
object_detector = ObjectDetector()
