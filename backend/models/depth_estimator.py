"""
ZoeDepth Metric Depth Estimator
Loads ZoeDepth NK (indoor) model for metric depth estimation.
CUDA-accelerated on RTX 4060.
"""

import torch
import numpy as np
from PIL import Image
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DepthEstimator:
    """Singleton ZoeDepth model wrapper for metric depth estimation."""

    _instance: Optional["DepthEstimator"] = None
    _model = None
    _device: str = "cpu"
    _is_loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        """Load ZoeDepth NK indoor model. Downloads weights on first run (~400MB)."""
        if self._is_loaded:
            return

        logger.info("Loading ZoeDepth model...")

        # Detect device
        if torch.cuda.is_available():
            self._device = "cuda"
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
            logger.info(f"Using GPU: {gpu_name} ({gpu_mem:.1f} GB)")
        else:
            self._device = "cpu"
            logger.warning("CUDA not available — using CPU (slower)")

        try:
            # Load ZoeDepth via torch hub
            self._model = torch.hub.load(
                "isl-org/ZoeDepth",
                "ZoeD_NK",  # Indoor (NYU+KITTI) model — best for rooms
                pretrained=True,
                trust_repo=True,
            )
            self._model.to(self._device)
            self._model.eval()
            self._is_loaded = True
            logger.info("ZoeDepth model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load ZoeDepth: {e}")
            # Fallback: try MiDaS DPT Hybrid
            logger.info("Falling back to MiDaS DPT Hybrid...")
            try:
                self._model = torch.hub.load(
                    "intel-isl/MiDaS",
                    "DPT_Hybrid",
                    pretrained=True,
                    trust_repo=True,
                )
                self._model.to(self._device)
                self._model.eval()
                self._is_loaded = True
                logger.info("MiDaS DPT Hybrid loaded as fallback")
            except Exception as e2:
                logger.error(f"Failed to load fallback model: {e2}")
                raise RuntimeError(
                    "Could not load any depth model. Check internet/CUDA."
                ) from e2

    def estimate_depth(self, image: Image.Image) -> np.ndarray:
        """
        Estimate metric depth from a PIL Image.

        Returns:
            np.ndarray of shape (H, W) with depth values in metres.
        """
        if not self._is_loaded:
            self.load_model()

        image_rgb = image.convert("RGB")

        with torch.no_grad():
            # ZoeDepth has its own infer_pil method
            if hasattr(self._model, "infer_pil"):
                depth = self._model.infer_pil(image_rgb)
                depth_np = np.array(depth)
            else:
                # MiDaS fallback — returns inverse relative depth
                from torchvision.transforms import Compose, Resize, ToTensor, Normalize

                transform = Compose([
                    Resize((384, 384)),
                    ToTensor(),
                    Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ])

                input_tensor = transform(image_rgb).unsqueeze(0).to(self._device)
                prediction = self._model(input_tensor)
                prediction = torch.nn.functional.interpolate(
                    prediction.unsqueeze(1),
                    size=image_rgb.size[::-1],  # (H, W)
                    mode="bicubic",
                    align_corners=False,
                ).squeeze()

                depth_np = prediction.cpu().numpy()
                # MiDaS gives inverse depth — convert to pseudo-metric
                # Scale so median ≈ 2.5m (typical room centre)
                depth_np = depth_np.max() - depth_np  # invert
                median_val = np.median(depth_np[depth_np > 0])
                if median_val > 0:
                    depth_np = depth_np * (2.5 / median_val)

        return depth_np.astype(np.float32)

    def get_depth_colormap(self, depth: np.ndarray) -> np.ndarray:
        """Convert depth map to a coloured heatmap (uint8 RGB) for visualisation."""
        import cv2

        # Normalise to 0–255
        d_min, d_max = depth.min(), depth.max()
        if d_max - d_min < 1e-6:
            normalised = np.zeros_like(depth, dtype=np.uint8)
        else:
            normalised = ((depth - d_min) / (d_max - d_min) * 255).astype(np.uint8)

        colormap = cv2.applyColorMap(normalised, cv2.COLORMAP_INFERNO)
        return cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def device(self) -> str:
        return self._device


# Module-level singleton
depth_estimator = DepthEstimator()
