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
    <div className="absolute right-0 top-0 z-20 flex h-full w-[260px] flex-col border-l border-white/30 bg-white/10 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Properties</h3>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:bg-white/10 hover:text-white transition-all">
          Close
        </button>
      </div>

      {/* Item Info */}
      <div className="border-b border-white/10 p-4 bg-white/5">
        <p className="text-sm font-semibold text-white">{item.name}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">Ref: {item.id.slice(-8)}</p>
      </div>

      {/* Position */}
      <div className="border-b border-white/10 p-4">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Position
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="text-center">
              <div className="text-[9px] font-bold uppercase text-white/30">{axis}</div>
              <div className="mt-1 rounded-lg bg-white/5 border border-white/10 px-1.5 py-1.5 font-mono text-xs text-white backdrop-blur-md">
                {item.position[axis === "x" ? "x" : axis === "y" ? "y" : "z"].toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="border-b border-white/10 p-4">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Dimensions
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[9px] font-bold uppercase text-white/30">Width</div>
            <div className="mt-1 font-mono text-xs text-white/80">{scaledDims.width}m</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase text-white/30">Height</div>
            <div className="mt-1 font-mono text-xs text-white/80">{scaledDims.height}m</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase text-white/30">Depth</div>
            <div className="mt-1 font-mono text-xs text-white/80">{scaledDims.depth}m</div>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="border-b border-white/10 p-4">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Orientation
        </h4>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[-90, -45, 45, 90].map((deg) => (
            <Button
              key={deg}
              size="sm"
              variant="outline"
              onClick={() => onRotate(deg)}
              className="border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/20 backdrop-blur-md h-8"
            >
              {deg > 0 ? "+" : ""}
              {deg}°
            </Button>
          ))}
        </div>

        {/* Rotation Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="359"
            value={Math.round(((item.rotation * 180) / Math.PI) % 360)}
            onChange={(e) => {
              const currentDeg = ((item.rotation * 180) / Math.PI) % 360;
              const nextDeg = parseInt(e.target.value);
              onRotate(nextDeg - currentDeg);
            }}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-white/30 tracking-wider">Fine-tune</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={Math.round(((item.rotation * 180) / Math.PI) % 360)}
                onChange={(e) => {
                  const currentDeg = ((item.rotation * 180) / Math.PI) % 360;
                  const nextDeg = parseInt(e.target.value) || 0;
                  onRotate(nextDeg - currentDeg);
                }}
                className="w-12 bg-white/5 border border-white/10 rounded-lg px-1 py-1 text-[10px] font-mono text-center text-white focus:outline-none focus:border-white/30"
              />
              <span className="text-[10px] text-white/40">°</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 p-4">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Scale
        </h4>
        <div className="flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScale(0.9)}
            className="border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/20 backdrop-blur-md h-8"
          >
            Smaller
          </Button>
          <span className="font-mono text-xs font-bold text-white/80">
            {(item.scale.x * 100).toFixed(0)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScale(1.1)}
            className="border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/20 backdrop-blur-md h-8"
          >
            Larger
          </Button>
        </div>
      </div>

      <div className="mt-auto p-4">
        <Button
          onClick={onRemove}
          variant="outline"
          className="w-full border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest"
        >
          Remove Item
        </Button>
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 text-center">
          R — Rotate · Del — Remove · P — Cloud
        </p>
      </div>
    </div>
  );
}
