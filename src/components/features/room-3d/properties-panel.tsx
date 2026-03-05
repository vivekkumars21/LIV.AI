"use client";

import React from "react";
import {
  X,
  RotateCw,
  Maximize2,
  Minimize2,
  Trash2,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlacedFurniture } from "@/lib/three-scene";

interface PropertiesPanelProps {
  item: PlacedFurniture;
  onClose: () => void;
  onRotate: (deg: number) => void;
  onScale: (factor: number) => void;
  onRemove: () => void;
}

export function PropertiesPanel({
  item,
  onClose,
  onRotate,
  onScale,
  onRemove,
}: PropertiesPanelProps) {
  const dims = item.originalDimensions;
  const scaledDims = {
    width: (dims.width * item.scale.x).toFixed(2),
    height: (dims.height * item.scale.y).toFixed(2),
    depth: (dims.depth * item.scale.z).toFixed(2),
  };

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-[260px] flex-col border-l border-white/20 bg-white/90 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 p-4">
        <h3 className="text-sm font-semibold text-foreground">Properties</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-white/50 hover:text-foreground">
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Item Info */}
      <div className="border-b border-white/20 p-4">
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">ID: {item.id.slice(-8)}</p>
      </div>

      {/* Position */}
      <div className="border-b border-white/20 p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Move className="h-3 w-3" />
          Position
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {("x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="text-center">
              <div className="text-[10px] uppercase text-muted-foreground/60">{axis}</div>
              <div className="mt-0.5 rounded-lg bg-white/50 px-1.5 py-1 font-mono text-xs text-foreground backdrop-blur-sm">
                {item.position[axis === "x" ? "x" : axis === "y" ? "y" : "z"].toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="border-b border-white/20 p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dimensions (m)
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground/60">Width</div>
            <div className="mt-0.5 font-mono text-foreground">{scaledDims.width}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground/60">Height</div>
            <div className="mt-0.5 font-mono text-foreground">{scaledDims.height}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground/60">Depth</div>
            <div className="mt-0.5 font-mono text-foreground">{scaledDims.depth}</div>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="border-b border-white/20 p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <RotateCw className="h-3 w-3" />
          Rotate
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {[-90, -45, 45, 90].map((deg) => (
            <Button
              key={deg}
              size="sm"
              variant="outline"
              onClick={() => onRotate(deg)}
              className="border-white/20 bg-white/50 text-xs text-foreground hover:bg-white/80 backdrop-blur-sm"
            >
              {deg > 0 ? "+" : ""}
              {deg}°
            </Button>
          ))}
        </div>
        <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
          {((item.rotation * 180) / Math.PI).toFixed(0)}°
        </p>
      </div>

      {/* Scale */}
      <div className="border-b border-white/20 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scale
        </h4>
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScale(0.9)}
            className="border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </Button>
          <span className="font-mono text-sm text-foreground">
            {(item.scale.x * 100).toFixed(0)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScale(1.1)}
            className="border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto p-4">
        <Button
          onClick={onRemove}
          variant="outline"
          className="w-full border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Item
        </Button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="border-t border-white/20 p-3">
        <p className="text-[10px] text-muted-foreground/60">
          R — Rotate 45° · Del — Remove · P — Point cloud
        </p>
      </div>
    </div>
  );
}
