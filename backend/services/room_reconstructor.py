"""
Room Reconstruction Service
Converts depth map + segmentation into a simplified 3D room mesh.

Pipeline:
  1. Depth map → 3D point cloud
  2. Detect dominant planes (floor, walls, ceiling)
  3. Generate simplified room geometry (vertices + faces)
  4. Return mesh data for Three.js consumption
"""

import numpy as np
from PIL import Image
from dataclasses import dataclass, field
from typing import Optional
import logging
import math

from backend.models.depth_estimator import depth_estimator
from backend.models.object_detector import object_detector
from backend.services.measurement import (
    estimate_focal_length_px,
    extract_focal_from_exif,
    DEFAULT_FOV_DEG,
)

logger = logging.getLogger(__name__)


@dataclass
class Vec3:
    x: float
    y: float
    z: float

    def to_list(self) -> list:
        return [round(self.x, 3), round(self.y, 3), round(self.z, 3)]


@dataclass
class WallSegment:
    """A wall plane in the reconstructed room."""
    id: str
    vertices: list  # 4 corner positions [[x,y,z], ...]
    normal: list  # [nx, ny, nz]
    width: float
    height: float
    has_window: bool = False
    has_door: bool = False
    uv_coords: list = field(default_factory=list)


@dataclass
class RoomMesh:
    """Complete reconstructed room geometry."""
    # Room dimensions in metres
    width: float
    length: float
    height: float

    # Floor plane
    floor_vertices: list = field(default_factory=list)
    floor_uv: list = field(default_factory=list)

    # Ceiling plane
    ceiling_vertices: list = field(default_factory=list)
    ceiling_uv: list = field(default_factory=list)

    # Walls
    walls: list = field(default_factory=list)  # list of WallSegment

    # Point cloud (subsampled for visualization)
    point_cloud: list = field(default_factory=list)
    point_colors: list = field(default_factory=list)

    # Detected objects with 3D positions
    objects_3d: list = field(default_factory=list)

    # Camera spawn position
    camera_position: list = field(default_factory=list)
    camera_target: list = field(default_factory=list)

    # Original image texture (base64)
    texture_base64: str = ""

    # Depth map stats
    depth_min: float = 0.0
    depth_max: float = 10.0

    def to_dict(self) -> dict:
        return {
            "dimensions": {
                "width": round(self.width, 2),
                "length": round(self.length, 2),
                "height": round(self.height, 2),
            },
            "floor": {
                "vertices": self.floor_vertices,
                "uv": self.floor_uv,
            },
            "ceiling": {
                "vertices": self.ceiling_vertices,
                "uv": self.ceiling_uv,
            },
            "walls": [
                {
                    "id": w.id,
                    "vertices": w.vertices,
                    "normal": w.normal,
                    "width": round(w.width, 2),
                    "height": round(w.height, 2),
                    "has_window": w.has_window,
                    "has_door": w.has_door,
                    "uv": w.uv_coords,
                }
                for w in self.walls
            ],
            "point_cloud": self.point_cloud,
            "point_colors": self.point_colors,
            "objects_3d": self.objects_3d,
            "camera": {
                "position": self.camera_position,
                "target": self.camera_target,
            },
            "depth_range": {
                "min": round(self.depth_min, 2),
                "max": round(self.depth_max, 2),
            },
        }


def depth_to_point_cloud(
    depth_map: np.ndarray,
    image: Image.Image,
    focal_px: float,
    subsample: int = 8,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Convert depth map to 3D point cloud.

    Uses pinhole camera model:
        X = (u - cx) * Z / fx
        Y = (v - cy) * Z / fy
        Z = depth[v, u]

    Args:
        depth_map: (H, W) depth in metres
        image: Original RGB image for colours
        focal_px: Focal length in pixels
        subsample: Take every Nth pixel (for performance)

    Returns:
        points: (N, 3) array of 3D points
        colors: (N, 3) array of RGB colors (0-1)
    """
    h, w = depth_map.shape
    cx, cy = w / 2.0, h / 2.0
    fx = fy = focal_px

    # Create pixel coordinate grids (subsampled)
    us = np.arange(0, w, subsample)
    vs = np.arange(0, h, subsample)
    uu, vv = np.meshgrid(us, vs)

    # Sample depth
    depth_sampled = depth_map[vv, uu]

    # Filter out invalid depths
    valid = (depth_sampled > 0.1) & (depth_sampled < 20.0)

    # Compute 3D coordinates (camera frame → Three.js room frame)
    # Camera: Z forward, X right, Y down
    # Room:   X right, Y up, Z forward (Z=0 at camera, Z=room_length at back wall)
    Z_cam = depth_sampled[valid]
    X = (uu[valid] - cx) * Z_cam / fx
    Y = -(vv[valid] - cy) * Z_cam / fy  # Flip Y for Three.js (Y-up)
    Z = Z_cam  # Z = depth = distance from camera (front) into room

    points = np.stack([X, Y, Z], axis=-1)

    # Get colours
    img_array = np.array(image.convert("RGB"))
    if img_array.shape[:2] != depth_map.shape:
        img_resized = np.array(image.resize((w, h)))
    else:
        img_resized = img_array

    colors = img_resized[vv[valid], uu[valid]] / 255.0

    return points.astype(np.float32), colors.astype(np.float32)


def estimate_room_planes(
    depth_map: np.ndarray,
    focal_px: float,
    img_w: int,
    img_h: int,
    ceiling_height_m: float = 2.8,
) -> dict:
    """
    Estimate dominant room planes from depth map.

    Returns dict with:
        floor_depth: depth at floor level
        back_wall_depth: depth of the back wall
        left_wall_depth: depth at left edge
        right_wall_depth: depth at right edge
        room_width: estimated width
        room_length: estimated length
    """
    h, w = depth_map.shape

    # Back wall: middle band of the image
    back_region = depth_map[int(h * 0.3):int(h * 0.5), int(w * 0.2):int(w * 0.8)]
    back_wall_depth = float(np.percentile(back_region, 80)) if back_region.size > 0 else 3.0

    # Floor: bottom 25% of the image
    floor_region = depth_map[int(h * 0.75):, :]
    floor_depth = float(np.percentile(floor_region, 50)) if floor_region.size > 0 else 1.5

    # Left wall: leftmost 15%
    left_region = depth_map[int(h * 0.2):int(h * 0.8), :int(w * 0.15)]
    left_wall_depth = float(np.median(left_region)) if left_region.size > 0 else back_wall_depth

    # Right wall: rightmost 15%
    right_region = depth_map[int(h * 0.2):int(h * 0.8), int(w * 0.85):]
    right_wall_depth = float(np.median(right_region)) if right_region.size > 0 else back_wall_depth

    # Room width from back wall depth + FOV
    room_width = (img_w * back_wall_depth) / focal_px

    # Room length: the camera-to-back-wall distance IS the room length
    # (camera is assumed at front of room). Use the larger of back wall
    # depth and floor far depth for robustness.
    floor_far_region = depth_map[int(h * 0.7):, :]
    floor_far_depth = float(np.percentile(floor_far_region, 90)) if floor_far_region.size > 0 else back_wall_depth
    room_length = max(back_wall_depth, floor_far_depth)

    # Cross-validate: room length should be at least room_width * 0.4
    # (very few rooms are narrower than 40% of their length)
    if room_length < room_width * 0.4:
        room_length = room_width * 1.0  # assume roughly square

    # Sanity bounds (typical rooms: 2m–12m)
    room_width = max(2.0, min(room_width, 12.0))
    room_length = max(2.5, min(room_length, 15.0))

    return {
        "back_wall_depth": back_wall_depth,
        "floor_depth": floor_depth,
        "left_wall_depth": left_wall_depth,
        "right_wall_depth": right_wall_depth,
        "room_width": round(room_width, 2),
        "room_length": round(room_length, 2),
    }


def _estimate_object_depth_dim(name: str, width: float, height: float) -> float:
    """Estimate front-to-back depth of an object from its type and measured width."""
    name_lower = name.lower()
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
    return round(width * 0.6, 2)


def detect_windows_doors(
    detections: list,
    img_w: int,
    img_h: int,
    room_width: float,
    room_height: float,
) -> list:
    """Detect window and door openings from object detection results."""
    openings = []
    for det in detections:
        name = det.name.lower()
        if "window" in name or "door" in name:
            cx = (det.bbox["x1"] + det.bbox["x2"]) / 2 / img_w
            cy = (det.bbox["y1"] + det.bbox["y2"]) / 2 / img_h
            w = (det.bbox["x2"] - det.bbox["x1"]) / img_w * room_width
            h = (det.bbox["y2"] - det.bbox["y1"]) / img_h * room_height
            openings.append({
                "type": "window" if "window" in name else "door",
                "center_x": cx,
                "center_y": cy,
                "width": w,
                "height": h,
            })
    return openings


def reconstruct_room(
    image: Image.Image,
    ceiling_height_m: float = 2.8,
    include_point_cloud: bool = True,
    point_cloud_density: int = 6,
) -> RoomMesh:
    """
    Full room reconstruction pipeline.

    Args:
        image: PIL Image of the room
        ceiling_height_m: Known ceiling height in metres
        include_point_cloud: Whether to include point cloud data
        point_cloud_density: Subsampling factor (lower = more points)

    Returns:
        RoomMesh with all geometry data for Three.js
    """
    img_w, img_h = image.size
    logger.info(f"Reconstructing room from {img_w}x{img_h} image...")

    # Step 1: Depth estimation
    logger.info("Step 1: Depth estimation...")
    depth_map = depth_estimator.estimate_depth(image)

    # Step 2: Object detection
    logger.info("Step 2: Object detection...")
    detections = object_detector.detect_objects(image)

    # Step 3: Camera intrinsics
    focal_px = extract_focal_from_exif(image)
    if focal_px is None:
        focal_px = estimate_focal_length_px(img_w)

    # Step 4: Estimate room planes
    logger.info("Step 3: Estimating room planes...")
    planes = estimate_room_planes(depth_map, focal_px, img_w, img_h, ceiling_height_m)

    room_w = planes["room_width"]
    room_l = planes["room_length"]
    room_h = ceiling_height_m

    # Step 5: Generate room geometry
    logger.info("Step 4: Generating room geometry...")
    mesh = RoomMesh(
        width=room_w,
        length=room_l,
        height=room_h,
        depth_min=float(np.min(depth_map[depth_map > 0])) if np.any(depth_map > 0) else 0.0,
        depth_max=float(np.max(depth_map)),
    )

    hw = room_w / 2  # half width
    hl = room_l / 2  # half length (unused; room extends along Z)

    # --- Floor plane (Y=0) ---
    mesh.floor_vertices = [
        [-hw, 0, 0],        # front-left
        [hw, 0, 0],         # front-right
        [hw, 0, room_l],    # back-right
        [-hw, 0, room_l],   # back-left
    ]
    mesh.floor_uv = [[0, 0], [1, 0], [1, 1], [0, 1]]

    # --- Ceiling plane (Y=room_h) ---
    mesh.ceiling_vertices = [
        [-hw, room_h, 0],
        [hw, room_h, 0],
        [hw, room_h, room_l],
        [-hw, room_h, room_l],
    ]
    mesh.ceiling_uv = [[0, 0], [1, 0], [1, 1], [0, 1]]

    # --- Walls ---
    # Back wall (Z = room_l)
    mesh.walls.append(WallSegment(
        id="back",
        vertices=[
            [-hw, 0, room_l],
            [hw, 0, room_l],
            [hw, room_h, room_l],
            [-hw, room_h, room_l],
        ],
        normal=[0, 0, -1],
        width=room_w,
        height=room_h,
        uv_coords=[[0, 0], [1, 0], [1, 1], [0, 1]],
    ))

    # Left wall (X = -hw)
    mesh.walls.append(WallSegment(
        id="left",
        vertices=[
            [-hw, 0, 0],
            [-hw, 0, room_l],
            [-hw, room_h, room_l],
            [-hw, room_h, 0],
        ],
        normal=[1, 0, 0],
        width=room_l,
        height=room_h,
        uv_coords=[[0, 0], [1, 0], [1, 1], [0, 1]],
    ))

    # Right wall (X = hw)
    mesh.walls.append(WallSegment(
        id="right",
        vertices=[
            [hw, 0, room_l],
            [hw, 0, 0],
            [hw, room_h, 0],
            [hw, room_h, room_l],
        ],
        normal=[-1, 0, 0],
        width=room_l,
        height=room_h,
        uv_coords=[[0, 0], [1, 0], [1, 1], [0, 1]],
    ))

    # Front wall (Z = 0) — partial, where the camera/door is
    mesh.walls.append(WallSegment(
        id="front",
        vertices=[
            [hw, 0, 0],
            [-hw, 0, 0],
            [-hw, room_h, 0],
            [hw, room_h, 0],
        ],
        normal=[0, 0, 1],
        width=room_w,
        height=room_h,
        has_door=True,
        uv_coords=[[0, 0], [1, 0], [1, 1], [0, 1]],
    ))

    # Check for windows/doors in detected objects
    openings = detect_windows_doors(detections, img_w, img_h, room_w, room_h)
    for opening in openings:
        # Mark the closest wall as having a window/door
        cx = opening["center_x"]
        if cx < 0.2:
            wall_id = "left"
        elif cx > 0.8:
            wall_id = "right"
        else:
            wall_id = "back"

        for wall in mesh.walls:
            if wall.id == wall_id:
                if opening["type"] == "window":
                    wall.has_window = True
                else:
                    wall.has_door = True

    # Step 6: Convert detected objects to 3D positions
    logger.info("Step 5: Positioning objects in 3D...")
    for det in detections:
        bbox_cx = (det.bbox["x1"] + det.bbox["x2"]) / 2
        bbox_cy = (det.bbox["y1"] + det.bbox["y2"]) / 2

        # Get depth at object centre
        y_idx = min(int(bbox_cy), depth_map.shape[0] - 1)
        x_idx = min(int(bbox_cx), depth_map.shape[1] - 1)

        if det.mask is not None:
            mask_depths = depth_map[det.mask > 0]
            obj_depth = float(np.median(mask_depths)) if len(mask_depths) > 0 else depth_map[y_idx, x_idx]
        else:
            obj_depth = float(depth_map[y_idx, x_idx])

        if obj_depth <= 0:
            obj_depth = 2.0

        # Convert to room coordinates
        # X: proportional position mapped to room width
        x_3d = ((bbox_cx / img_w) - 0.5) * room_w

        # Z: use depth value, clamped to room bounds
        z_3d = max(0.1, min(obj_depth, room_l - 0.1))

        # Real-world dimensions via pinhole model
        real_w = (det.pixel_width * obj_depth) / focal_px
        real_h = (det.pixel_height * obj_depth) / focal_px

        # Estimate front-to-back depth using object type heuristics
        real_d = _estimate_object_depth_dim(det.name, real_w, real_h)

        # Estimate Y position based on object type
        name_lower = det.name.lower()
        floor_objects = ["couch", "bed", "chair", "dining table", "refrigerator",
                         "oven", "toilet", "potted plant", "suitcase"]

        if any(obj in name_lower for obj in floor_objects):
            y_3d = real_h / 2  # Centre at half height (object stands on floor)
        else:
            # Wall-mounted or elevated objects
            y_pos_ratio = bbox_cy / img_h
            y_3d = room_h * (1 - y_pos_ratio)

        # Clamp X so object stays within room walls
        hw = room_w / 2
        x_3d = max(-hw + real_w / 2, min(x_3d, hw - real_w / 2))

        mesh.objects_3d.append({
            "name": det.name,
            "confidence": round(det.confidence, 3),
            "position": [round(x_3d, 2), round(y_3d, 2), round(z_3d, 2)],
            "dimensions": [round(real_w, 2), round(real_h, 2), round(real_d, 2)],
            "bbox": det.bbox,
        })

    # Step 7: Point cloud (optional, for visualization)
    if include_point_cloud:
        logger.info("Step 6: Generating point cloud...")
        points, colors = depth_to_point_cloud(
            depth_map, image, focal_px, subsample=point_cloud_density
        )

        # Limit to 50k points for network transfer
        if len(points) > 50000:
            indices = np.random.choice(len(points), 50000, replace=False)
            points = points[indices]
            colors = colors[indices]

        mesh.point_cloud = points.tolist()
        mesh.point_colors = colors.tolist()

    # Step 8: Camera spawn position
    # Place camera at the front of the room, at eye height
    mesh.camera_position = [0, 1.6, 0.5]  # standing at door, eye height 1.6m
    mesh.camera_target = [0, 1.4, room_l / 2]  # look towards centre

    logger.info(f"Reconstruction complete: {room_w:.1f}m × {room_l:.1f}m × {room_h:.1f}m")
    logger.info(f"  Objects: {len(mesh.objects_3d)}")
    logger.info(f"  Point cloud: {len(mesh.point_cloud)} points")

    return mesh
