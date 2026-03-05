"""
Color Prediction Service — K-Means clustering for dominant color extraction.

Uses OpenCV + scikit-learn K-Means on room images to extract real color palettes,
wall/floor region colors, and complementary palette recommendations.
"""

import colorsys
import numpy as np
from PIL import Image
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ColorInfo:
    hex: str
    rgb: tuple[int, int, int]
    percentage: float  # 0-100

    def to_dict(self) -> dict:
        return {
            "hex": self.hex,
            "rgb": list(self.rgb),
            "percentage": round(self.percentage, 1),
        }


@dataclass
class ColorAnalysisResult:
    dominant_colors: list[ColorInfo]
    wall_colors: list[ColorInfo]
    floor_colors: list[ColorInfo]
    recommended_palette: list[str]  # hex colors
    mood: str  # warm, cool, neutral
    wall_finish: str  # matte, satin, gloss suggestion

    def to_dict(self) -> dict:
        return {
            "dominant_colors": [c.to_dict() for c in self.dominant_colors],
            "wall_colors": [c.to_dict() for c in self.wall_colors],
            "floor_colors": [c.to_dict() for c in self.floor_colors],
            "recommended_palette": self.recommended_palette,
            "mood": self.mood,
            "wall_finish": self.wall_finish,
        }


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _kmeans_colors(pixels: np.ndarray, k: int = 5) -> list[ColorInfo]:
    """Run K-Means on pixel array and return dominant colors."""
    from sklearn.cluster import MiniBatchKMeans

    if len(pixels) < k:
        k = max(1, len(pixels))

    # Subsample for speed (max 50k pixels)
    if len(pixels) > 50000:
        indices = np.random.choice(len(pixels), 50000, replace=False)
        sample = pixels[indices]
    else:
        sample = pixels

    kmeans = MiniBatchKMeans(n_clusters=k, random_state=42, n_init=3, batch_size=1000)
    labels = kmeans.fit_predict(sample)

    # Count pixels per cluster
    counts = np.bincount(labels, minlength=k)
    total = counts.sum()

    colors = []
    for i in range(k):
        center = kmeans.cluster_centers_[i].astype(int)
        r, g, b = int(center[0]), int(center[1]), int(center[2])
        pct = (counts[i] / total) * 100
        colors.append(ColorInfo(
            hex=_rgb_to_hex(r, g, b),
            rgb=(r, g, b),
            percentage=pct,
        ))

    # Sort by percentage descending
    colors.sort(key=lambda c: c.percentage, reverse=True)
    return colors


def _get_complementary(hex_color: str) -> str:
    r, g, b = _hex_to_rgb(hex_color)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h = (h + 0.5) % 1.0
    r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
    return _rgb_to_hex(int(r2 * 255), int(g2 * 255), int(b2 * 255))


def _get_analogous(hex_color: str) -> list[str]:
    r, g, b = _hex_to_rgb(hex_color)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    results = []
    for shift in [-0.083, 0.083]:  # ±30 degrees
        h2 = (h + shift) % 1.0
        r2, g2, b2 = colorsys.hsv_to_rgb(h2, s, v)
        results.append(_rgb_to_hex(int(r2 * 255), int(g2 * 255), int(b2 * 255)))
    return results


def _get_triadic(hex_color: str) -> list[str]:
    r, g, b = _hex_to_rgb(hex_color)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    results = []
    for shift in [0.333, 0.667]:
        h2 = (h + shift) % 1.0
        r2, g2, b2 = colorsys.hsv_to_rgb(h2, s, v)
        results.append(_rgb_to_hex(int(r2 * 255), int(g2 * 255), int(b2 * 255)))
    return results


def _classify_mood(dominant_colors: list[ColorInfo]) -> str:
    """Classify color mood using HSV analysis — not naive RGB."""
    warm_score = 0
    cool_score = 0
    total_weight = 0

    for c in dominant_colors:
        r, g, b = c.rgb
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        hue_deg = h * 360
        weight = c.percentage

        # Warm hues: 0-60° (reds, oranges, yellows) and 300-360° (magentas)
        if hue_deg < 60 or hue_deg > 300:
            warm_score += weight * s  # saturation matters
        # Cool hues: 180-300° (blues, purples)
        elif 180 <= hue_deg <= 300:
            cool_score += weight * s
        # Green/neutral: 60-180°
        else:
            warm_score += weight * s * 0.3
            cool_score += weight * s * 0.3

        total_weight += weight

    if total_weight == 0:
        return "neutral"

    warm_ratio = warm_score / total_weight
    cool_ratio = cool_score / total_weight

    if warm_ratio > cool_ratio + 0.05:
        return "warm"
    elif cool_ratio > warm_ratio + 0.05:
        return "cool"
    return "neutral"


def _suggest_wall_finish(mood: str, brightness: float) -> str:
    """Suggest paint finish based on room mood and brightness."""
    if brightness > 180:
        return "matte"  # bright rooms look great with matte
    elif brightness > 120:
        return "satin"  # moderate rooms benefit from satin sheen
    else:
        return "semi-gloss"  # dark rooms need reflectivity


def analyze_colors(image: Image.Image) -> ColorAnalysisResult:
    """
    Full color analysis pipeline:
      image → K-Means dominant colors + wall/floor regions + palette recommendations.
    """
    img_rgb = image.convert("RGB")
    img_np = np.array(img_rgb)
    h, w, _ = img_np.shape

    logger.info(f"Color analysis on {w}x{h} image")

    # ─── Full image dominant colors ──────────────────────
    all_pixels = img_np.reshape(-1, 3).astype(np.float32)
    dominant_colors = _kmeans_colors(all_pixels, k=5)

    # ─── Wall region (upper 60%) ─────────────────────────
    wall_region = img_np[:int(h * 0.6), :, :]
    wall_pixels = wall_region.reshape(-1, 3).astype(np.float32)
    wall_colors = _kmeans_colors(wall_pixels, k=3)

    # ─── Floor region (bottom 25%) ───────────────────────
    floor_region = img_np[int(h * 0.75):, :, :]
    floor_pixels = floor_region.reshape(-1, 3).astype(np.float32)
    floor_colors = _kmeans_colors(floor_pixels, k=3)

    # ─── Mood ────────────────────────────────────────────
    mood = _classify_mood(dominant_colors)

    # ─── Average brightness for finish suggestion ────────
    avg_brightness = float(np.mean(all_pixels))

    # ─── Wall finish suggestion ──────────────────────────
    wall_finish = _suggest_wall_finish(mood, avg_brightness)

    # ─── Recommended palette ─────────────────────────────
    primary_hex = dominant_colors[0].hex
    recommended = [primary_hex]
    recommended.append(_get_complementary(primary_hex))
    recommended.extend(_get_analogous(primary_hex))
    recommended.extend(_get_triadic(primary_hex))

    # Deduplicate
    seen = set()
    unique_palette = []
    for c in recommended:
        if c not in seen:
            seen.add(c)
            unique_palette.append(c)

    logger.info(f"Color analysis complete: {len(dominant_colors)} dominant, mood={mood}")

    return ColorAnalysisResult(
        dominant_colors=dominant_colors,
        wall_colors=wall_colors,
        floor_colors=floor_colors,
        recommended_palette=unique_palette[:6],
        mood=mood,
        wall_finish=wall_finish,
    )
