"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import type { PlacedFurniture } from "@/lib/three-scene";

interface MinimapProps {
  roomDimensions: { width: number; length: number; height: number };
  placedItems: PlacedFurniture[];
  cameraRef: THREE.PerspectiveCamera | null;
}

export function Minimap({ roomDimensions, placedItems, cameraRef }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 160;
    canvas.width = size;
    canvas.height = size;

    // Scale factor: room → canvas
    const maxDim = Math.max(roomDimensions.width, roomDimensions.length);
    const scale = (size - 20) / maxDim;
    const offsetX = (size - roomDimensions.width * scale) / 2;
    const offsetY = (size - roomDimensions.length * scale) / 2;

    const toCanvas = (x: number, z: number) => ({
      cx: offsetX + (x + roomDimensions.width / 2) * scale,
      cy: offsetY + z * scale,
    });

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, 8);
      ctx.fill();

      // Room outline
      const tl = toCanvas(-roomDimensions.width / 2, 0);
      const br = toCanvas(roomDimensions.width / 2, roomDimensions.length);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tl.cx, tl.cy, br.cx - tl.cx, br.cy - tl.cy);

      // Room fill
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(tl.cx, tl.cy, br.cx - tl.cx, br.cy - tl.cy);

      // Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 0.5;
      const gridSize = 1; // 1m grid
      for (let x = -roomDimensions.width / 2; x <= roomDimensions.width / 2; x += gridSize) {
        const p1 = toCanvas(x, 0);
        const p2 = toCanvas(x, roomDimensions.length);
        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.stroke();
      }
      for (let z = 0; z <= roomDimensions.length; z += gridSize) {
        const p1 = toCanvas(-roomDimensions.width / 2, z);
        const p2 = toCanvas(roomDimensions.width / 2, z);
        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.stroke();
      }

      // Placed furniture
      placedItems.forEach((item) => {
        const pos = toCanvas(item.position.x, item.position.z);
        const w = item.originalDimensions.width * item.scale.x * scale;
        const d = item.originalDimensions.depth * item.scale.z * scale;

        ctx.save();
        ctx.translate(pos.cx, pos.cy);
        ctx.rotate(item.rotation);

        ctx.fillStyle = "rgba(100, 140, 206, 0.5)";
        ctx.strokeStyle = "rgba(100, 140, 206, 0.8)";
        ctx.lineWidth = 1;
        ctx.fillRect(-w / 2, -d / 2, w, d);
        ctx.strokeRect(-w / 2, -d / 2, w, d);

        ctx.restore();
      });

      // Camera position
      if (cameraRef) {
        const camPos = toCanvas(cameraRef.position.x, cameraRef.position.z);

        // Camera direction
        const dir = cameraRef.getWorldDirection(new THREE.Vector3());
        const angle = Math.atan2(dir.x, dir.z);

        ctx.save();
        ctx.translate(camPos.cx, camPos.cy);
        ctx.rotate(angle);

        // View cone
        ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -20);
        ctx.lineTo(8, -20);
        ctx.closePath();
        ctx.fill();

        // Camera dot
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Direction arrow
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -10);
        ctx.stroke();

        ctx.restore();
      }

      // Door indicator
      const doorPos = toCanvas(0, 0);
      ctx.fillStyle = "rgba(255, 200, 100, 0.6)";
      ctx.fillRect(doorPos.cx - 5, doorPos.cy - 1, 10, 3);
    };

    draw();
    const interval = setInterval(draw, 100);

    return () => clearInterval(interval);
  }, [roomDimensions, placedItems, cameraRef]);

  return (
    <div className="absolute bottom-10 right-4 z-10">
      <canvas
        ref={canvasRef}
        className="rounded-2xl border border-white/30 bg-black/20 shadow-2xl backdrop-blur-2xl"
        style={{ width: 160, height: 160 }}
      />
      <p className="mt-2 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
        Live Minimap
      </p>
    </div>
  );
}
