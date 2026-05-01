"use client";

import React, { useState } from "react";
import {
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/three-scene";

interface ToolbarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  onScreenshot: () => void;
  onExport: () => void;
  onSaveLocal: () => void;
  onLoadLatest: () => void;
  onUploadNew: () => void;
  showPointCloud: boolean;
  onTogglePointCloud: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  roomDimensions?: { width: number; length: number; height: number };
  viewMode?: string;
  onViewModeChange?: (mode: "walkthrough" | "orbit" | "topdown") => void;
}

export function Toolbar({
  currentTheme,
  onThemeChange,
  onScreenshot,
  onExport,
  onSaveLocal,
  onLoadLatest,
  onUploadNew,
  showPointCloud,
  onTogglePointCloud,
  showMarkers,
  onToggleMarkers,
  roomDimensions,
  viewMode = "walkthrough",
  onViewModeChange,
}: ToolbarProps) {
  const [showThemes, setShowThemes] = useState(false);
  const [showViewModes, setShowViewModes] = useState(false);

  return (
    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
      <div className="mt-3 flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-1.5 shadow-2xl backdrop-blur-2xl">
        {/* Upload New */}
        <ToolbarButton
          label="Upload"
          onClick={onUploadNew}
        />

        <Separator />

        {/* Theme Selector */}
        <div className="relative">
          <ToolbarButton
            label={THEMES[currentTheme]?.name ?? "Theme"}
            onClick={() => setShowThemes(!showThemes)}
            active={showThemes}
            suffix={<span className="ml-1 text-[10px] opacity-50">▼</span>}
          />

          {showThemes && (
            <div className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl backdrop-blur-xl">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    setShowThemes(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${currentTheme === key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    }`}
                >
                  {/* Colour preview */}
                  <div className="flex gap-1">
                    <div
                      className="h-4 w-4 rounded-sm"
                      style={{
                        backgroundColor: `#${theme.wallColor.toString(16).padStart(6, "0")}`,
                      }}
                    />
                    <div
                      className="h-4 w-4 rounded-sm"
                      style={{
                        backgroundColor: `#${theme.floorColor.toString(16).padStart(6, "0")}`,
                      }}
                    />
                  </div>
                  <span>{theme.name}</span>
                  {currentTheme === key && (
                    <span className="ml-auto text-xs text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* View Mode Selector */}
        {onViewModeChange && (
          <>
            <div className="relative">
              <ToolbarButton
                label={
                  viewMode === "walkthrough"
                    ? "Walkthrough"
                    : viewMode === "orbit"
                      ? "Orbit"
                      : "Top-Down"
                }
                onClick={() => setShowViewModes(!showViewModes)}
                active={showViewModes}
                suffix={<span className="ml-1 text-[10px] opacity-50">▼</span>}
              />

              {showViewModes && (
                <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl backdrop-blur-xl">
                  <button
                    onClick={() => {
                      onViewModeChange("walkthrough");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${viewMode === "walkthrough"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      }`}
                  >
                    <span>Walkthrough</span>
                    {viewMode === "walkthrough" && (
                      <span className="ml-auto text-xs text-primary">Active</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onViewModeChange("orbit");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${viewMode === "orbit"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      }`}
                  >
                    <span>Orbit View</span>
                    {viewMode === "orbit" && (
                      <span className="ml-auto text-xs text-primary">Active</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onViewModeChange("topdown");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${viewMode === "topdown"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                      }`}
                  >
                    <span>Top-Down</span>
                    {viewMode === "topdown" && (
                      <span className="ml-auto text-xs text-primary">Active</span>
                    )}
                  </button>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* View Toggles */}
        <ToolbarButton
          label={showPointCloud ? "Hide Points" : "Show Points"}
          onClick={onTogglePointCloud}
          active={showPointCloud}
        />

        <ToolbarButton
          label="Markers"
          onClick={onToggleMarkers}
          active={showMarkers}
        />

        <Separator />

        {/* Export Actions */}
        <ToolbarButton
          label="Screenshot"
          onClick={onScreenshot}
        />

        <ToolbarButton
          label="Export"
          onClick={onExport}
        />

        <ToolbarButton
          label="Save Cloud"
          onClick={onSaveLocal}
        />

        <ToolbarButton
          label="Load Last"
          onClick={onLoadLatest}
        />

        {roomDimensions && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold bg-white/5 text-white/80 border border-white/10 shadow-inner ml-2 uppercase tracking-widest">
              <span className="text-white/40">Size:</span>
              <span>{Math.round(roomDimensions.width * 100) / 100}m × {Math.round(roomDimensions.length * 100) / 100}m × {roomDimensions.height}m</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
  suffix,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${active
          ? "bg-white text-black shadow-lg"
          : "text-white/60 hover:bg-white/10 hover:text-white"
        }`}
    >
      <span className="sm:inline">{label}</span>
      {suffix}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}
