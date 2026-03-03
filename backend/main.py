"""
IntraKart Advanced Measurement Backend
FastAPI server with ZoeDepth + YOLOv8-seg + spatial reasoning.

Run: uvicorn backend.main:app --reload --port 8000
"""

import io
import base64
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import torch

from backend.models.depth_estimator import depth_estimator
from backend.models.object_detector import object_detector
from backend.services.measurement import measure_objects
from backend.services.calibration import calibrate, get_calibration, CalibrationResult
from backend.services.spatial_engine import (
    evaluate_placement,
    RoomData,
    ExistingObject,
    SelectedObject,
)

# ─── Logging ─────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("intrakart-backend")

# ─── Lifespan (model preloading) ─────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load models on startup."""
    logger.info("=" * 60)
    logger.info("IntraKart Measurement Backend starting...")
    logger.info("=" * 60)

    # Load models in background thread to not block startup
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, depth_estimator.load_model)
    await loop.run_in_executor(None, object_detector.load_model)

    logger.info("All models loaded. Server ready.")
    yield
    logger.info("Server shutting down.")


# ─── App ─────────────────────────────────────────────────────

app = FastAPI(
    title="IntraKart Advanced Measurement API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9002",
        "http://localhost:3000",
        "http://127.0.0.1:9002",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ────────────────────────────────────────


class CalibrationRequest(BaseModel):
    point1: list[int]  # [x, y]
    point2: list[int]  # [x, y]
    real_distance_m: float
    session_id: str = "default"


class PlacementRequest(BaseModel):
    room: dict  # {"width", "length", "height"}
    existing_objects: list[dict] = []
    selected_object: dict  # {"name", "width", "depth", "height", "estimated_cost"}
    style: str = "modern"
    budget: float = 100000


# ─── Endpoints ───────────────────────────────────────────────


@app.get("/api/health")
async def health_check():
    """Check model status and GPU info."""
    gpu_info = None
    if torch.cuda.is_available():
        gpu_info = {
            "name": torch.cuda.get_device_name(0),
            "memory_total_gb": round(
                torch.cuda.get_device_properties(0).total_mem / (1024**3), 1
            ),
            "memory_used_gb": round(torch.cuda.memory_allocated(0) / (1024**3), 2),
        }

    return {
        "status": "ok",
        "models": {
            "depth_estimator": depth_estimator.is_loaded,
            "object_detector": object_detector.is_loaded,
        },
        "device": depth_estimator.device,
        "gpu": gpu_info,
    }


@app.post("/api/analyze")
async def analyze_room(
    image: UploadFile = File(...),
    ceiling_height_m: float = Form(2.8),
    session_id: str = Form("default"),
):
    """
    Upload a room image → get depth map + detected objects + metric measurements.

    Returns:
        - room dimensions (estimated)
        - list of detected objects with metric sizes
        - depth map as base64 heatmap
        - detection overlay as base64
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image
    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents))

    logger.info(f"Analyzing image: {pil_image.size[0]}x{pil_image.size[1]}")

    # Check for existing calibration
    cal = get_calibration(session_id)
    cal_scale = cal.correction_factor if cal else None

    # Run the full measurement pipeline
    loop = asyncio.get_event_loop()
    measurement = await loop.run_in_executor(
        None,
        lambda: measure_objects(pil_image, cal_scale, ceiling_height_m),
    )

    # Generate depth heatmap as base64
    depth_map = await loop.run_in_executor(
        None, lambda: depth_estimator.estimate_depth(pil_image)
    )
    depth_colormap = depth_estimator.get_depth_colormap(depth_map)
    depth_img = Image.fromarray(depth_colormap)

    buf = io.BytesIO()
    depth_img.save(buf, format="JPEG", quality=80)
    depth_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Generate detection overlay
    detection_overlay = _draw_detection_overlay(pil_image, measurement.objects)
    buf2 = io.BytesIO()
    detection_overlay.save(buf2, format="JPEG", quality=80)
    overlay_base64 = base64.b64encode(buf2.getvalue()).decode("utf-8")

    return {
        "measurement": measurement.to_dict(),
        "depth_map": f"data:image/jpeg;base64,{depth_base64}",
        "detection_overlay": f"data:image/jpeg;base64,{overlay_base64}",
        "calibrated": cal is not None,
    }


@app.post("/api/calibrate")
async def calibrate_room(request: CalibrationRequest):
    """
    User marks two points on a known reference and provides real distance.
    Returns pixel-to-metre scale factor.
    """
    if len(request.point1) != 2 or len(request.point2) != 2:
        raise HTTPException(status_code=400, detail="Points must be [x, y] arrays")

    if request.real_distance_m <= 0:
        raise HTTPException(status_code=400, detail="Distance must be positive")

    try:
        result = calibrate(
            point1=tuple(request.point1),
            point2=tuple(request.point2),
            real_distance_m=request.real_distance_m,
            session_id=request.session_id,
        )
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/placement")
async def check_placement(request: PlacementRequest):
    """
    Spatial reasoning: check if a furniture item fits in the room.
    Uses AABB collision detection with 0.6m clearance.
    """
    try:
        room = RoomData(
            width=request.room["width"],
            length=request.room["length"],
            height=request.room["height"],
        )
        existing = [
            ExistingObject(
                name=obj.get("name", "object"),
                x=obj.get("x", 0),
                y=obj.get("y", 0),
                width=obj.get("width", 0.5),
                depth=obj.get("depth", 0.5),
            )
            for obj in request.existing_objects
        ]
        selected = SelectedObject(
            name=request.selected_object["name"],
            width=request.selected_object["width"],
            depth=request.selected_object["depth"],
            height=request.selected_object["height"],
            estimated_cost=request.selected_object.get("estimated_cost", 0),
        )

        result = evaluate_placement(room, existing, selected, request.style, request.budget)
        return result.to_dict()

    except (KeyError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {e}")


# ─── Helpers ─────────────────────────────────────────────────


def _draw_detection_overlay(image: Image.Image, objects) -> Image.Image:
    """Draw bounding boxes and labels on the image."""
    import cv2

    img_np = np.array(image.convert("RGB"))
    img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    colors = [
        (0, 255, 0),    # green
        (255, 165, 0),  # orange
        (255, 0, 0),    # red
        (0, 128, 255),  # blue
        (255, 255, 0),  # yellow
        (128, 0, 255),  # purple
    ]

    for i, obj in enumerate(objects):
        color = colors[i % len(colors)]
        bbox = obj.bbox
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]

        # Draw box
        cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 2)

        # Draw label with dimensions
        label = f"{obj.name} ({obj.width}m x {obj.height}m)"
        font_scale = 0.5
        thickness = 1
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)

        # Background for label
        cv2.rectangle(img_cv, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(
            img_cv, label, (x1 + 2, y1 - 4),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness,
        )

    result = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    return Image.fromarray(result)
