"""
Measurement Service
Fuses depth map + segmentation masks to produce metric bounding boxes.

Pipeline:
  1. Get depth map (ZoeDepth) — values in metres
  2. Get object masks (YOLO)
  3. For each object: extract depth within mask → median depth
  4. Compute real-world size via pinhole camera model
  5. Apply user calibration if available
"""

import numpy as np
from PIL import Image
from dataclasses import dataclass
from typing import Optional
import logging

from backend.models.depth_estimator import depth_estimator
from backend.models.object_detector import object_detector, DetectedObject

logger = logging.getLogger(__name__)


@dataclass
class MeasuredObject:
    """An object with estimated real-world dimensions."""

    name: str
    confidence: float
    # Position in room (metres from origin)
    x: float
    y: float
    # Real-world dimensions (metres)
    width: float
    depth: float
    height: float
    # Median depth from camera (metres)
    distance: float
    # Original pixel bbox
    bbox: dict

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "confidence": round(self.confidence, 3),
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "width": round(self.width, 2),
            "depth": round(self.depth, 2),
            "height": round(self.height, 2),
            "distance": round(self.distance, 2),
            "bbox": self.bbox,
        }


@dataclass
class RoomMeasurement:
    """Complete measurement result for a room image."""

    # Estimated room dimensions (metres)
    room_width: float
    room_length: float
    room_height: float
    # Measured objects
    objects: list[MeasuredObject]
    # Pixel-to-metre scale (from calibration or estimation)
    scale: float  # metres per pixel at reference depth
    # Image dimensions
    image_width: int
    image_height: int
    # Computed area and confidence
    confidence: float = 0.0  # 0-1, based on depth map quality

    @property
    def room_area_sqm(self) -> float:
        return self.room_width * self.room_length

    @property
    def room_area_sqft(self) -> float:
        return self.room_area_sqm * 10.764

    @property
    def wall_area_sqm(self) -> float:
        perimeter = 2 * (self.room_width + self.room_length)
        return perimeter * self.room_height

    @property
    def wall_area_sqft(self) -> float:
        return self.wall_area_sqm * 10.764

    def to_dict(self) -> dict:
        return {
            "room": {
                "width": round(self.room_width, 2),
                "length": round(self.room_length, 2),
                "height": round(self.room_height, 2),
                "area_sqm": round(self.room_area_sqm, 1),
                "area_sqft": round(self.room_area_sqft, 1),
                "wall_area_sqm": round(self.wall_area_sqm, 1),
                "wall_area_sqft": round(self.wall_area_sqft, 1),
            },
            "objects": [obj.to_dict() for obj in self.objects],
            "scale": round(self.scale, 6),
            "image_width": self.image_width,
            "image_height": self.image_height,
            "confidence": round(self.confidence, 2),
        }


# ─── Default camera intrinsics ───────────────────────────────
# Typical smartphone: ~4mm focal length, ~1/2.55" sensor
# For a 4000px wide image with 26mm equivalent focal length:
#   focal_px ≈ (image_width / sensor_width_mm) * focal_mm
# We use a reasonable default and allow calibration to override.
DEFAULT_FOV_DEG = 70  # typical smartphone horizontal FOV


def estimate_focal_length_px(image_width: int, fov_deg: float = DEFAULT_FOV_DEG) -> float:
    """Estimate focal length in pixels from horizontal field of view."""
    import math
    return image_width / (2 * math.tan(math.radians(fov_deg / 2)))


def extract_focal_from_exif(image: Image.Image) -> Optional[float]:
    """Try to extract focal length from EXIF data."""
    try:
        exif = image._getexif()
        if exif is None:
            return None

        # EXIF tag 37386 = FocalLength
        focal_mm = None
        if 37386 in exif:
            val = exif[37386]
            if isinstance(val, tuple):
                focal_mm = val[0] / val[1]  # rational number
            else:
                focal_mm = float(val)

        if focal_mm is None:
            return None

        # Convert mm to pixels:
        # Assume 1/2.55" sensor width ≈ 6.17mm (common smartphone)
        sensor_width_mm = 6.17
        focal_px = (image.width / sensor_width_mm) * focal_mm
        return focal_px

    except Exception:
        return None


def measure_objects(
    image: Image.Image,
    calibration_scale: Optional[float] = None,
    ceiling_height_m: float = 2.8,
) -> RoomMeasurement:
    """
    Full measurement pipeline:
    image → depth + detection → metric bounding boxes.

    Args:
        image: PIL Image of the room
        calibration_scale: If provided, metres-per-pixel at 1m depth
        ceiling_height_m: Known or assumed ceiling height (metres)

    Returns:
        RoomMeasurement with all measured objects and room dimensions
    """
    img_w, img_h = image.size

    # Step 1: Depth estimation
    logger.info("Running depth estimation...")
    depth_map = depth_estimator.estimate_depth(image)

    # Step 2: Object detection + segmentation
    logger.info("Running object detection...")
    detections = object_detector.detect_objects(image)

    # Step 3: Determine scale
    focal_px = extract_focal_from_exif(image)
    if focal_px is None:
        focal_px = estimate_focal_length_px(img_w)
        logger.info(f"Using estimated focal length: {focal_px:.1f} px")
    else:
        logger.info(f"Using EXIF focal length: {focal_px:.1f} px")

    # Step 4: Measure each detected object
    measured: list[MeasuredObject] = []

    for det in detections:
        # Get depth within mask (or bbox if no mask)
        if det.mask is not None:
            mask_region = depth_map[det.mask > 0]
        else:
            y1, y2 = det.bbox["y1"], det.bbox["y2"]
            x1, x2 = det.bbox["x1"], det.bbox["x2"]
            # Clamp to image bounds
            y1 = max(0, min(y1, depth_map.shape[0] - 1))
            y2 = max(0, min(y2, depth_map.shape[0]))
            x1 = max(0, min(x1, depth_map.shape[1] - 1))
            x2 = max(0, min(x2, depth_map.shape[1]))
            mask_region = depth_map[y1:y2, x1:x2].flatten()

        if len(mask_region) == 0:
            continue

        # Median depth (more robust than mean)
        avg_depth = float(np.median(mask_region))
        if avg_depth <= 0:
            avg_depth = 1.0  # fallback

        # Compute real-world dimensions via pinhole model
        # real_size = (pixel_size × depth) / focal_length
        real_width = (det.pixel_width * avg_depth) / focal_px
        real_height = (det.pixel_height * avg_depth) / focal_px

        # Apply calibration correction if available
        if calibration_scale is not None:
            correction = calibration_scale
            real_width *= correction
            real_height *= correction

        # Estimate depth (front-to-back) from width and object type
        real_depth = _estimate_object_depth(det.name, real_width, real_height)

        # Estimate position in room (simplified top-down projection)
        # x position: proportional to bbox centre along image width
        bbox_cx = (det.bbox["x1"] + det.bbox["x2"]) / 2
        bbox_cy = (det.bbox["y1"] + det.bbox["y2"]) / 2

        # Map pixel position to room coordinates (will be refined by calibration)
        x_ratio = bbox_cx / img_w
        y_ratio = bbox_cy / img_h

        measured.append(
            MeasuredObject(
                name=det.name,
                confidence=det.confidence,
                x=0,  # placeholder — set after room dims known
                y=0,
                width=round(real_width, 2),
                depth=round(real_depth, 2),
                height=round(real_height, 2),
                distance=round(avg_depth, 2),
                bbox=det.bbox,
            )
        )

    # Step 5: Estimate room dimensions
    # Use depth map edges to estimate room width and length
    room_width, room_length = _estimate_room_dimensions(
        depth_map, focal_px, img_w, img_h, ceiling_height_m
    )

    # Step 6: Assign positions to objects in room coordinates
    for obj, det in zip(measured, detections):
        bbox_cx = (det.bbox["x1"] + det.bbox["x2"]) / 2
        bbox_cy = (det.bbox["y1"] + det.bbox["y2"]) / 2

        # Map to room coordinates
        obj.x = round((bbox_cx / img_w) * room_width - obj.width / 2, 2)
        obj.y = round((bbox_cy / img_h) * room_length - obj.depth / 2, 2)

        # Clamp to room bounds
        obj.x = max(0, min(obj.x, room_width - obj.width))
        obj.y = max(0, min(obj.y, room_length - obj.depth))

    # Compute scale
    scale = room_width / img_w if img_w > 0 else 0.001

    # Compute confidence based on depth map variance
    depth_variance = float(np.var(depth_map))
    # Low variance (uniform depth) = possibly bad scan, high variance = good 3D info
    # Normalize: variance > 2.0 → high confidence, < 0.3 → low
    confidence = min(1.0, max(0.0, (depth_variance - 0.1) / 2.5))

    return RoomMeasurement(
        room_width=round(room_width, 2),
        room_length=round(room_length, 2),
        room_height=ceiling_height_m,
        objects=measured,
        scale=scale,
        image_width=img_w,
        image_height=img_h,
        confidence=round(confidence, 2),
    )


def _estimate_object_depth(name: str, width: float, height: float) -> float:
    """Heuristic: estimate front-to-back depth of an object from its name and measured width/height."""
    name_lower = name.lower()

    # Furniture depth ratios (depth relative to width)
    depth_ratios = {
        "couch": 0.45,
        "bed": 1.2,
        "dining table": 0.6,
        "chair": 0.5,
        "tv": 0.05,
        "refrigerator": 0.65,
        "oven": 0.7,
        "microwave": 0.5,
        "sink": 0.5,
        "toilet": 0.7,
        "potted plant": 1.0,
        "laptop": 0.7,
        "book": 0.02,
        "clock": 0.05,
        "vase": 1.0,
        "bottle": 1.0,
    }

    for key, ratio in depth_ratios.items():
        if key in name_lower:
            return round(width * ratio, 2)

    # Default: depth ≈ 60% of width
    return round(width * 0.6, 2)


def _estimate_room_dimensions(
    depth_map: np.ndarray,
    focal_px: float,
    img_w: int,
    img_h: int,
    ceiling_height_m: float,
) -> tuple[float, float]:
    """
    Estimate room width and length from the depth map.

    Uses the back wall depth and camera geometry:
        real_width = (image_width × back_wall_depth) / focal_length
    """
    # Sample the middle 60% of the depth map for the back wall
    h, w = depth_map.shape
    mid_y_start = int(h * 0.3)
    mid_y_end = int(h * 0.5)
    mid_x_start = int(w * 0.2)
    mid_x_end = int(w * 0.8)

    back_region = depth_map[mid_y_start:mid_y_end, mid_x_start:mid_x_end]
    if back_region.size == 0:
        return (4.0, 5.0)  # fallback

    back_wall_depth = float(np.percentile(back_region, 80))  # ~80th percentile
    if back_wall_depth <= 0:
        back_wall_depth = 3.0

    # Room width from FOV geometry
    room_width = (img_w * back_wall_depth) / focal_px

    # Room length: camera-to-back-wall distance IS the room length.
    # Use the larger of back wall depth and floor far depth.
    floor_region = depth_map[int(h * 0.7):, :]  # bottom 30%
    if floor_region.size > 0:
        floor_far_depth = float(np.percentile(floor_region, 90))
    else:
        floor_far_depth = back_wall_depth
    room_length = max(back_wall_depth, floor_far_depth)

    # Cross-validate: room length should be reasonable relative to width
    if room_length < room_width * 0.4:
        room_length = room_width * 1.0  # assume roughly square

    # Sanity bounds (typical Indian rooms: 2.5m–8m)
    room_width = max(2.0, min(room_width, 12.0))
    room_length = max(2.5, min(room_length, 15.0))

    return (round(room_width, 2), round(room_length, 2))
