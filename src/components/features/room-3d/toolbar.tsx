"use client";

import React, { useState } from "react";
import {
  Upload,
  Camera,
  Save,
  Download,
  Eye,
  EyeOff,
  Palette,
  Sun,
  Layers,
  ChevronDown,
  Navigation,
  Orbit,
  Map,
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
      <div className="mt-3 flex items-center gap-1 rounded-3xl border border-white/20 bg-white/40 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {/* Upload New */}
        <ToolbarButton
          icon={<Upload className="h-3.5 w-3.5" />}
          label="Upload"
          onClick={onUploadNew}
        />

        <Separator />

        {/* Theme Selector */}
        <div className="relative">
          <ToolbarButton
            icon={<Palette className="h-3.5 w-3.5" />}
            label={THEMES[currentTheme]?.name ?? "Theme"}
            onClick={() => setShowThemes(!showThemes)}
            active={showThemes}
            suffix={<ChevronDown className="ml-0.5 h-3 w-3" />}
          />

          {showThemes && (
            <div className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-md">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    setShowThemes(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                    currentTheme === key
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
                icon={
                  viewMode === "walkthrough" ? (
                    <Navigation className="h-3.5 w-3.5" />
                  ) : viewMode === "orbit" ? (
                    <Orbit className="h-3.5 w-3.5" />
                  ) : (
                    <Map className="h-3.5 w-3.5" />
                  )
                }
                label={
                  viewMode === "walkthrough"
                    ? "Walkthrough"
                    : viewMode === "orbit"
                    ? "Orbit"
                    : "Top-Down"
                }
                onClick={() => setShowViewModes(!showViewModes)}
                active={showViewModes}
                suffix={<ChevronDown className="ml-0.5 h-3 w-3" />}
              />

              {showViewModes && (
                <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-md">
                  <button
                    onClick={() => {
                      onViewModeChange("walkthrough");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      viewMode === "walkthrough"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Walkthrough</span>
                    {viewMode === "walkthrough" && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onViewModeChange("orbit");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      viewMode === "orbit"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    }`}
                  >
                    <Orbit className="h-4 w-4" />
                    <span>Orbit View</span>
                    {viewMode === "orbit" && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onViewModeChange("topdown");
                      setShowViewModes(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      viewMode === "topdown"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    }`}
                  >
                    <Map className="h-4 w-4" />
                    <span>Top-Down</span>
                    {viewMode === "topdown" && (
                      <span className="ml-auto text-xs text-primary">✓</span>
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
          icon={
            showPointCloud ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )
          }
          label="Points"
          onClick={onTogglePointCloud}
          active={showPointCloud}
        />

        <ToolbarButton
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Markers"
          onClick={onToggleMarkers}
          active={showMarkers}
        />

        <Separator />

        {/* Export Actions */}
        <ToolbarButton
          icon={<Camera className="h-3.5 w-3.5" />}
          label="Screenshot"
          onClick={onScreenshot}
        />

        <ToolbarButton
          icon={<Download className="h-3.5 w-3.5" />}
          label="Export"
          onClick={onExport}
        />

        <ToolbarButton
          icon={<Save className="h-3.5 w-3.5" />}
          label="Save Cloud"
          onClick={onSaveLocal}
        />

        <ToolbarButton
          icon={<Sun className="h-3.5 w-3.5" />}
          label="Load Last"
          onClick={onLoadLatest}
        />

        {roomDimensions && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/50 text-foreground border border-white/40 shadow-sm ml-2">
              <span className="text-muted-foreground mr-1">📐 Size:</span>
              <span>{Math.round(roomDimensions.width * 10) / 10}m × {Math.round(roomDimensions.length * 10) / 10}m × {roomDimensions.height}m</span>
              <span className="text-[10px] text-muted-foreground ml-2">
                (~{Math.round((roomDimensions.width * roomDimensions.length) * 10.764)} sq ft)
              </span>
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
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-white/80 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {suffix}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}
