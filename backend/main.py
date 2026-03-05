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
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
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
from backend.services.color_analyzer import analyze_colors
from backend.services.budget_calculator import calculate_budget, get_available_project_types
from backend.services.room_reconstructor import reconstruct_room

# DB imports
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models.professional import DBProfessional, DBProfessionalReview
from backend.models.project import DBProject

# Initialize DB
Base.metadata.create_all(bind=engine)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Logging ─────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("intrakart-backend")

# ─── Lifespan (model preloading) ─────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Server startup — models load lazily on first request."""
    logger.info("=" * 60)
    logger.info("IntraKart Measurement Backend starting...")
    logger.info("=" * 60)
    logger.info("Models will load lazily on first /api/analyze request.")
    logger.info("Server ready to accept requests.")
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


# ─── Endpoints ───────────────────────────────────────────────


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

    # Also generate depth heatmap and room texture as base64
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


# ─── Local Projects (SQLite) ─────────────────────────────────

@app.post("/api/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db_session)):
    db_project = DBProject(
        name=project.name,
        theme=project.theme,
        room_data=project.room_data,
        furniture_data=project.furniture_data,
        notes=project.notes or "",
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return {
        "id": str(db_project.id),
        "name": db_project.name,
        "theme": db_project.theme,
        "room_data": db_project.room_data,
        "furniture_data": db_project.furniture_data,
        "notes": db_project.notes,
        "created_at": db_project.created_at,
        "updated_at": db_project.updated_at,
    }


@app.get("/api/projects")
def list_projects(limit: int = 20, db: Session = Depends(get_db_session)):
    limit = max(1, min(limit, 100))
    projects = (
        db.query(DBProject)
        .order_by(DBProject.updated_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "theme": p.theme,
            "furniture_count": len(p.furniture_data or []),
            "room_dimensions": (p.room_data or {}).get("dimensions", {}),
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in projects
    ]


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db_session)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": str(project.id),
        "name": project.name,
        "theme": project.theme,
        "room_data": project.room_data,
        "furniture_data": project.furniture_data,
        "notes": project.notes,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@app.put("/api/projects/{project_id}")
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db_session)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.theme is not None:
        project.theme = payload.theme
    if payload.room_data is not None:
        project.room_data = payload.room_data
    if payload.furniture_data is not None:
        project.furniture_data = payload.furniture_data
    if payload.notes is not None:
        project.notes = payload.notes

    db.commit()
    db.refresh(project)

    return {
        "id": str(project.id),
        "name": project.name,
        "theme": project.theme,
        "room_data": project.room_data,
        "furniture_data": project.furniture_data,
        "notes": project.notes,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db_session)):
    project = db.query(DBProject).filter(DBProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"success": True, "id": project_id}


# ─── Professionals Marketplace Endpoints ─────────────────────

@app.post("/api/professionals")
def register_professional(prof: ProfessionalCreate, db: Session = Depends(get_db_session)):
    db_prof = DBProfessional(**prof.dict())
    db.add(db_prof)
    db.commit()
    db.refresh(db_prof)
    res = {column.name: getattr(db_prof, column.name) for column in db_prof.__table__.columns}
    res["id"] = str(res["id"])
    return res

@app.get("/api/professionals")
def get_professionals(city: str, profession: Optional[str] = None, sort_by: str = "rating", db: Session = Depends(get_db_session)):
    query = db.query(DBProfessional).filter(DBProfessional.city.ilike(f"%{city.strip()}%"))
    if profession:
        query = query.filter(DBProfessional.profession == profession)
        
    if sort_by == "rating":
        query = query.order_by(DBProfessional.rating.desc())
    elif sort_by == "price_low":
        query = query.order_by(DBProfessional.visiting_charge_inr.asc())
    elif sort_by == "price_high":
        query = query.order_by(DBProfessional.visiting_charge_inr.desc())
    elif sort_by == "experience":
        query = query.order_by(DBProfessional.experience_years.desc())
        
    results = []
    for p in query.all():
        res = {column.name: getattr(p, column.name) for column in p.__table__.columns}
        res["id"] = str(res["id"])
        results.append(res)
    return results

@app.get("/api/professionals/cities/list")
def get_cities(db: Session = Depends(get_db_session)):
    cities = db.query(DBProfessional.city).distinct().all()
    return [c[0] for c in cities if c[0]]

@app.get("/api/professionals/{prof_id}")
def get_professional(prof_id: str, db: Session = Depends(get_db_session)):
    prof = db.query(DBProfessional).filter(DBProfessional.id == prof_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found")
    res = {column.name: getattr(prof, column.name) for column in prof.__table__.columns}
    res["id"] = str(res["id"])
    return res

@app.post("/api/professionals/{prof_id}/reviews")
def add_review(prof_id: str, review: ReviewCreate, db: Session = Depends(get_db_session)):
    prof = db.query(DBProfessional).filter(DBProfessional.id == prof_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found")
        
    db_review = DBProfessionalReview(
        professional_id=prof_id,
        reviewer_name=review.reviewer_name,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    
    prof.review_count += 1
    prof.rating = ((float(prof.rating) * (prof.review_count - 1)) + review.rating) / prof.review_count
    
    db.commit()
    db.refresh(db_review)
    res = {column.name: getattr(db_review, column.name) for column in db_review.__table__.columns}
    res["id"] = str(res["id"])
    res["professional_id"] = str(res["professional_id"])
    return res

@app.get("/api/professionals/{prof_id}/reviews")
def get_reviews(prof_id: str, db: Session = Depends(get_db_session)):
    reviews = db.query(DBProfessionalReview).filter(DBProfessionalReview.professional_id == prof_id).order_by(DBProfessionalReview.created_at.desc()).all()
    results = []
    for r in reviews:
        res = {column.name: getattr(r, column.name) for column in r.__table__.columns}
        res["id"] = str(res["id"])
        res["professional_id"] = str(res["professional_id"])
        results.append(res)
    return results


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
