"""
Calibration Service
Lets users mark two points on a known reference (door frame, floor tile)
and enter the real-world distance, producing a pixel-to-metre scale factor.
"""

import math
import numpy as np
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class CalibrationResult:
    """Result of a user calibration."""

    pixel_distance: float  # distance between the two points in pixels
    real_distance_m: float  # user-provided real-world distance (metres)
    metre_per_pixel: float  # scale factor
    correction_factor: float  # multiplier to apply to depth-based measurements

    def to_dict(self) -> dict:
        return {
            "pixel_distance": round(self.pixel_distance, 2),
            "real_distance_m": round(self.real_distance_m, 3),
            "metre_per_pixel": round(self.metre_per_pixel, 6),
            "correction_factor": round(self.correction_factor, 4),
        }


# ─── In-memory session store ────────────────────────────────
# In production, use Redis or a database. For local dev, dict is fine.
_calibrations: dict[str, CalibrationResult] = {}


def calibrate(
    point1: tuple[int, int],
    point2: tuple[int, int],
    real_distance_m: float,
    depth_at_reference: Optional[float] = None,
    focal_px: Optional[float] = None,
    session_id: str = "default",
) -> CalibrationResult:
    """
    Compute pixel-to-metre scale from two user-marked points.

    Args:
        point1: (x1, y1) pixel coords of the first calibration point
        point2: (x2, y2) pixel coords of the second calibration point
        real_distance_m: real-world distance between the two points (metres)
        depth_at_reference: median depth (m) at the calibration region from ZoeDepth
        focal_px: focal length in pixels (for correction factor computation)
        session_id: session key for storing calibration

    Returns:
        CalibrationResult with scale and correction factor
    """
    dx = point2[0] - point1[0]
    dy = point2[1] - point1[1]
    pixel_distance = math.sqrt(dx * dx + dy * dy)

    if pixel_distance < 1:
        raise ValueError("Calibration points are too close together")

    if real_distance_m <= 0:
        raise ValueError("Real distance must be positive")

    metre_per_pixel = real_distance_m / pixel_distance

    # Compute correction factor for depth-based measurements
    # If we have the depth value at the reference location:
    #   expected_real = (pixel_distance * depth) / focal_px
    #   correction = real_distance_m / expected_real
    correction_factor = 1.0
    if depth_at_reference is not None and focal_px is not None and focal_px > 0:
        expected_real = (pixel_distance * depth_at_reference) / focal_px
        if expected_real > 0:
            correction_factor = real_distance_m / expected_real
            logger.info(
                f"Calibration correction factor: {correction_factor:.3f} "
                f"(expected {expected_real:.2f}m, actual {real_distance_m:.2f}m)"
            )

    result = CalibrationResult(
        pixel_distance=pixel_distance,
        real_distance_m=real_distance_m,
        metre_per_pixel=metre_per_pixel,
        correction_factor=correction_factor,
    )

    # Store for this session
    _calibrations[session_id] = result
    logger.info(f"Calibration stored for session '{session_id}': {metre_per_pixel:.6f} m/px")

    return result


def get_calibration(session_id: str = "default") -> Optional[CalibrationResult]:
    """Retrieve a stored calibration for a session."""
    return _calibrations.get(session_id)


def clear_calibration(session_id: str = "default"):
    """Clear stored calibration for a session."""
    _calibrations.pop(session_id, None)
