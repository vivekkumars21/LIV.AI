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
}: ToolbarProps) {
  const [showThemes, setShowThemes] = useState(false);

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
          label="Save Local"
          onClick={onSaveLocal}
        />

        <ToolbarButton
          icon={<Sun className="h-3.5 w-3.5" />}
          label="Load Last"
          onClick={onLoadLatest}
        />
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
