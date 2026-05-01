"use client";

import React, { useState, useRef } from "react";
import { } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface UploadModalProps {
  onUpload: (file: File, ceilingHeight: number) => void;
  onDemoRoom: () => void;
  onLoadLatest: () => void;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export function UploadModal({
  onUpload,
  onDemoRoom,
  onLoadLatest,
  isLoading,
  loadingMessage,
  error,
}: UploadModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ceilingHeight, setCeilingHeight] = useState(2.8);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("Image must be under 15MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile, ceilingHeight);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/40 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="border-b border-white/20 bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6">
            <h1 className="text-2xl font-bold text-foreground">
              3D Room Walkthrough
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a photo of your room to generate a navigable 3D interior
            </p>
          </div>

          <div className="p-8">
            {!preview ? (
              <>
                {/* Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                    dragOver
                      ? "border-primary bg-primary/10"
                      : "border-white/30 bg-white/20 hover:border-primary/50 hover:bg-white/30 backdrop-blur-sm"
                  }`}
                >
                  <div className="mx-auto mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
                    Upload Photo
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    Drop your room photo here
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    or click to browse · JPG, PNG up to 15MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Demo Room Button */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    onClick={onDemoRoom}
                    variant="outline"
                    className="w-full border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm"
                  >
                    Try demo room
                  </Button>
                  <Button
                    onClick={onLoadLatest}
                    variant="outline"
                    className="w-full border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm"
                  >
                    Load last cloud project
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Preview */}
                <div className="relative mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={preview}
                    alt="Room preview"
                    className="h-64 w-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-foreground hover:bg-white backdrop-blur-sm shadow-sm"
                  >
                    REMOVE
                  </button>
                </div>

                {/* Ceiling Height */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Ceiling Height
                    </label>
                    <span className="rounded-lg bg-white/50 px-2 py-0.5 text-sm font-mono text-primary backdrop-blur-sm">
                      {ceilingHeight.toFixed(1)}m ({(ceilingHeight * 3.281).toFixed(1)}ft)
                    </span>
                  </div>
                  <Slider
                    value={[ceilingHeight]}
                    onValueChange={(v) => setCeilingHeight(v[0])}
                    min={2.0}
                    max={4.5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {loadingMessage}
                      </>
                    ) : (
                      "Generate 3D Room"
                    )}
                  </Button>
                  <Button
                    onClick={onDemoRoom}
                    variant="outline"
                    className="border-white/20 bg-white/50 text-foreground hover:bg-white/80 backdrop-blur-sm"
                    disabled={isLoading}
                  >
                    Demo
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
