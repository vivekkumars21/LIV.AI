"""
IntraKart Advanced Measurement Backend
FastAPI server with ZoeDepth + YOLOv8-seg + spatial reasoning.

Run: uvicorn backend.main:app --reload --port 8000
"""

import io
import os
import time
import shutil
import base64
import asyncio
import logging
import subprocess
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from PIL import Image
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware

# ─── Logging ─────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("intrakart-backend")

# Load environment variables
env_path = Path(__file__).resolve().parents[1] / ".env.local"
logger.info(f"Loading environment from {env_path}")
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    logger.info("Loaded .env.local")
else:
    logger.warning(f".env.local not found at {env_path}")
    # Try .env as fallback
    fallback_env = Path(__file__).resolve().parents[1] / ".env"
    if fallback_env.exists():
        load_dotenv(dotenv_path=fallback_env)
        logger.info("Loaded .env")

from fastapi.responses import JSONResponse, Response
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
from backend.services.color_analyzer import analyze_colors
from backend.services.budget_calculator import calculate_budget, get_available_project_types
from backend.services.room_reconstructor import reconstruct_room

# Cloud DB service
from backend.services.supabase_service import SupabaseService


_next_process: Optional[subprocess.Popen] = None


def _project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:9002")


def _start_frontend_server() -> None:
    global _next_process

    if os.getenv("START_FRONTEND", "true").lower() in {"0", "false", "no"}:
        logger.info("Skipping frontend startup (START_FRONTEND disabled).")
        return

    if _next_process and _next_process.poll() is None:
        return

    npm_cmd = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm_cmd:
        logger.warning("npm was not found on PATH. Frontend proxy will not be available.")
        return

    root = _project_root()
    logger.info("Starting Next frontend process from %s", root)
    _next_process = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--hostname", "127.0.0.1", "--port", "9002"],
        cwd=str(root),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    time.sleep(2)


def _stop_frontend_server() -> None:
    global _next_process
    if not _next_process:
        return

    if _next_process.poll() is None:
        logger.info("Stopping Next frontend process.")
        _next_process.terminate()
        try:
            _next_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _next_process.kill()

    _next_process = None

# ─── Lifespan (model preloading) ─────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Server startup — models load lazily on first request."""
    logger.info("=" * 60)
    logger.info("IntraKart Measurement Backend starting...")
    logger.info("=" * 60)
    logger.info("Models will load lazily on first /api/analyze request.")
    _start_frontend_server()
    logger.info("Server ready to accept requests.")
    yield
    _stop_frontend_server()
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
        "http://localhost:8000",
        "http://127.0.0.1:8000",
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


class BudgetRequest(BaseModel):
    area_sqft: float
    project_type: str = "painting"
    quality_tier: str = "standard"
    city_tier: str = "tier_2"

class ProfessionalCreate(BaseModel):
    name: str
    profession: str
    city: str
    state: str
    phone: str
    email: Optional[str] = None
    visiting_charge_inr: int = 0
    rate_per_sqft_inr: int = 0
    experience_years: int = 0
    bio: Optional[str] = ""

class ReviewCreate(BaseModel):
    reviewer_name: str
    rating: int
    comment: Optional[str] = ""


class ProjectCreate(BaseModel):
    name: str = "Untitled Project"
    theme: str = "modern"
    room_data: dict
    furniture_data: list[dict] = []
    notes: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    theme: Optional[str] = None
    room_data: Optional[dict] = None
    furniture_data: Optional[list[dict]] = None
    notes: Optional[str] = None


class AuthRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    image: str
    description: str
    dimensions: Optional[str] = None
    material: Optional[str] = None
    stock: Optional[int] = 0
    features: Optional[list[str]] = []


# ─── Endpoints ───────────────────────────────────────────────


@app.get("/")
async def root():
    """Human-friendly root endpoint for quick browser checks."""
    return {
        "service": "IntraKart Advanced Measurement API",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health_check():
    """Check model status and GPU info."""
    gpu_info = None
    if torch.cuda.is_available():
        gpu_info = {
            "name": torch.cuda.get_device_name(0),
            "memory_total_gb": round(
                torch.cuda.get_device_properties(0).total_memory / (1024**3), 1
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


def _get_supabase_service() -> SupabaseService:
    service = SupabaseService.from_env()
    if not service:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
        )
    return service


@app.post("/api/auth/signup")
def auth_signup(payload: AuthRequest):
    try:
        return _get_supabase_service().sign_up(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/auth/login")
def auth_login(payload: AuthRequest):
    try:
        return _get_supabase_service().sign_in(
            email=payload.email,
            password=payload.password,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/auth/resend-confirmation")
def auth_resend_confirmation(payload: AuthRequest):
    try:
        success = _get_supabase_service().resend_confirmation(email=payload.email)
        if not success:
            raise Exception("Failed to resend confirmation email")
        return {"success": True, "message": "Confirmation email resent"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/products")
def list_products(limit: int = 200):
    try:
        limit = max(1, min(limit, 500))
        return _get_supabase_service().list_products(limit)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/products")
def create_product(payload: ProductCreate):
    try:
        return _get_supabase_service().create_product(payload.dict())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


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


class ReconstructRequest(BaseModel):
    ceiling_height_m: float = 2.8
    include_point_cloud: bool = True
    point_cloud_density: int = 6


@app.post("/api/reconstruct")
async def reconstruct_room_endpoint(
    image: UploadFile = File(...),
    ceiling_height_m: float = Form(2.8),
    include_point_cloud: bool = Form(True),
    point_cloud_density: int = Form(6),
):
    """
    Upload a room image → get 3D room reconstruction data.

    Returns:
        - Room mesh geometry (floor, walls, ceiling vertices)
        - 3D point cloud (subsampled)
        - Detected objects with 3D positions
        - Camera spawn position
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents))

    logger.info(f"Reconstructing room: {pil_image.size[0]}x{pil_image.size[1]}")

    loop = asyncio.get_event_loop()
    mesh = await loop.run_in_executor(
        None,
        lambda: reconstruct_room(
            pil_image,
            ceiling_height_m=ceiling_height_m,
            include_point_cloud=include_point_cloud,
            point_cloud_density=point_cloud_density,
        ),
    )

    # Also generate depth heatmap as base64 (reuse depth from reconstruction)
    depth_map = await loop.run_in_executor(
        None, lambda: depth_estimator.estimate_depth(pil_image)
    )
    depth_colormap = depth_estimator.get_depth_colormap(depth_map)
    depth_img = Image.fromarray(depth_colormap)

    buf = io.BytesIO()
    depth_img.save(buf, format="JPEG", quality=80)
    depth_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Room image as texture
    buf2 = io.BytesIO()
    pil_image.save(buf2, format="JPEG", quality=85)
    texture_base64 = base64.b64encode(buf2.getvalue()).decode("utf-8")

    result = mesh.to_dict()
    result["depth_map"] = f"data:image/jpeg;base64,{depth_base64}"
    result["room_texture"] = f"data:image/jpeg;base64,{texture_base64}"

    return result


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


@app.post("/api/colors")
async def predict_colors(
    image: UploadFile = File(...),
):
    """
    Upload a room image → get dominant color palette, wall/floor colors,
    recommended palette, and mood classification.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents))

    logger.info(f"Color analysis: {pil_image.size[0]}x{pil_image.size[1]}")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: analyze_colors(pil_image))

    return result.to_dict()


@app.post("/api/budget")
async def compute_budget(request: BudgetRequest):
    """
    Calculate renovation budget based on area, project type, quality tier, and city tier.
    Returns detailed breakdown with material + labor costs, GST, and savings tips.
    """
    try:
        result = calculate_budget(
            area_sqft=request.area_sqft,
            project_type=request.project_type,
            quality_tier=request.quality_tier,
            city_tier=request.city_tier,
        )
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/budget/project-types")
async def list_project_types():
    """Return all available project types with descriptions and tiers."""
    return get_available_project_types()


# ─── Cloud Projects (Supabase) ───────────────────────────────

def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


def _get_authenticated_user_id(request: Request) -> str:
    token = _extract_bearer_token(request)
    service = _get_supabase_service()
    try:
        user = service.get_user_from_token(token)
        user_id = user.get("id")
        if not user_id:
            raise RuntimeError("Invalid token user")
        return str(user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {exc}")


@app.post("/api/projects")
def create_project(project: ProjectCreate, request: Request):
    user_id = _get_authenticated_user_id(request)
    payload = {
        "name": project.name,
        "theme": project.theme,
        "room_data": project.room_data,
        "furniture_data": project.furniture_data,
        "notes": project.notes or "",
    }
    try:
        return _get_supabase_service().create_room_project(user_id=user_id, payload=payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/projects")
def list_projects(request: Request, limit: int = 20):
    user_id = _get_authenticated_user_id(request)
    limit = max(1, min(limit, 100))
    try:
        projects = _get_supabase_service().list_room_projects(user_id=user_id, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return [
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "theme": p.get("theme"),
            "furniture_count": len(p.get("furniture_data") or []),
            "room_dimensions": (p.get("room_data") or {}).get("dimensions", {}),
            "created_at": p.get("created_at"),
            "updated_at": p.get("updated_at"),
        }
        for p in projects
    ]


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, request: Request):
    user_id = _get_authenticated_user_id(request)
    try:
        project = _get_supabase_service().get_room_project(user_id=user_id, project_id=project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/api/projects/{project_id}")
def update_project(project_id: str, payload: ProjectUpdate, request: Request):
    user_id = _get_authenticated_user_id(request)
    patch = {
        "name": payload.name,
        "theme": payload.theme,
        "room_data": payload.room_data,
        "furniture_data": payload.furniture_data,
        "notes": payload.notes,
    }
    try:
        updated = _get_supabase_service().update_room_project(
            user_id=user_id,
            project_id=project_id,
            payload=patch,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, request: Request):
    user_id = _get_authenticated_user_id(request)
    try:
        deleted = _get_supabase_service().delete_room_project(user_id=user_id, project_id=project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True, "id": project_id}


# ─── Professionals Marketplace Endpoints ─────────────────────

@app.post("/api/professionals")
def register_professional(prof: ProfessionalCreate):
    try:
        return _get_supabase_service().register_professional(prof.dict())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/professionals")
def get_professionals(city: str, profession: Optional[str] = None, sort_by: str = "rating"):
    try:
        return _get_supabase_service().get_professionals(city=city, profession=profession, sort_by=sort_by)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/professionals/cities/list")
def get_cities():
    try:
        return _get_supabase_service().get_professional_cities()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/professionals/{prof_id}")
def get_professional(prof_id: str):
    try:
        prof = _get_supabase_service().get_professional(prof_id)
        if not prof:
            raise HTTPException(status_code=404, detail="Professional not found")
        return prof
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.post("/api/professionals/{prof_id}/reviews")
def add_review(prof_id: str, review: ReviewCreate):
    try:
        return _get_supabase_service().add_professional_review(prof_id, review.dict())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/professionals/{prof_id}/reviews")
def get_reviews(prof_id: str):
    try:
        return _get_supabase_service().get_professional_reviews(prof_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─── Products & Furniture Catalog Endpoints ───────────────────

@app.get("/api/products")
def list_products(limit: int = 100):
    try:
        return _get_supabase_service().list_products(limit=limit)
    except Exception as exc:
        # Fallback for when Supabase is not ready
        logger.warning(f"Supabase products fetch failed: {exc}. Returning empty list.")
        return []

@app.get("/api/furniture")
def list_furniture(category: Optional[str] = None, limit: int = 200):
    try:
        return _get_supabase_service().list_furniture_items(category=category, limit=limit)
    except Exception as exc:
        logger.warning(f"Supabase furniture fetch failed: {exc}. Returning empty list.")
        return []


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


@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def frontend_proxy(full_path: str, request: Request):
    # FastAPI routes are resolved before this catch-all.
    # Any remaining /api/* path is forwarded to Next so Next API routes work in one-host mode.

    target = f"{_frontend_base_url().rstrip('/')}/{full_path}"
    if request.url.query:
        target = f"{target}?{request.url.query}"

    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length", "connection"}
    }
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            upstream = await client.request(
                request.method,
                target,
                headers=headers,
                content=body if body else None,
            )
    except Exception as exc:
        logger.exception("Frontend proxy failure: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "error": "Frontend unavailable",
                "message": "FastAPI is running, but the Next frontend is not reachable.",
                "target": _frontend_base_url(),
            },
        )

    passthrough_headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() not in {"content-encoding", "transfer-encoding", "connection"}
    }

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=passthrough_headers,
    )
