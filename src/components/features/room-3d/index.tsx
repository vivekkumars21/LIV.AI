"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  SceneManager,
  FirstPersonControls,
  RoomBuilder,
  FurnitureManager,
  LightingManager,
  THEMES,
  FURNITURE_CATALOG,
  FURNITURE_CATEGORIES,
} from "@/lib/three-scene";
import type { RoomData, PlacedFurniture, FurnitureItem } from "@/lib/three-scene";
import { FurnitureSidebar } from "./furniture-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import { Minimap } from "./minimap";
import { UploadModal } from "./upload-modal";

export type ViewMode = "walkthrough" | "orbit" | "topdown";

export function Room3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const controlsRef = useRef<FirstPersonControls | null>(null);
  const roomBuilderRef = useRef<RoomBuilder | null>(null);
  const furnitureManagerRef = useRef<FurnitureManager | null>(null);
  const lightingManagerRef = useRef<LightingManager | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [selectedFurniture, setSelectedFurniture] = useState<PlacedFurniture | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedFurniture[]>([]);
  const [showPointCloud, setShowPointCloud] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;

    // Scene Manager
    const sceneManager = new SceneManager({
      container,
      antialias: true,
      shadows: true,
    });
    sceneManagerRef.current = sceneManager;

    // Lighting
    const lighting = new LightingManager({
      scene: sceneManager.scene,
      ambientIntensity: 0.5,
      sunIntensity: 1.0,
      shadows: true,
    });
    lightingManagerRef.current = lighting;

    // Room Builder
    const roomBuilder = new RoomBuilder(sceneManager.scene);
    roomBuilderRef.current = roomBuilder;

    // Furniture Manager
    const furnitureManager = new FurnitureManager(
      sceneManager.scene,
      sceneManager.camera,
      sceneManager.renderer
    );
    furnitureManagerRef.current = furnitureManager;

    furnitureManager.onSelectionChange = (item) => {
      setSelectedFurniture(item);
      setPropertiesOpen(!!item);
    };

    furnitureManager.onItemPlaced = () => {
      setPlacedItems(furnitureManager.getPlacedItems());
    };

    // First-Person Controls
    const controls = new FirstPersonControls({
      camera: sceneManager.camera,
      domElement: sceneManager.renderer.domElement,
      moveSpeed: 3.0,
      lookSpeed: 0.002,
      eyeHeight: 1.6,
    });
    controlsRef.current = controls;

    // Animation loop
    sceneManager.onUpdate((delta) => {
      controls.update(delta);
    });

    sceneManager.start();
    setIsInitialized(true);

    return () => {
      controls.dispose();
      furnitureManager.dispose();
      roomBuilder.dispose();
      lighting.dispose();
      sceneManager.dispose();
      sceneManagerRef.current = null;
      controlsRef.current = null;
      roomBuilderRef.current = null;
      furnitureManagerRef.current = null;
      lightingManagerRef.current = null;
    };
  }, [isInitialized]);

  // Update controls lock state
  useEffect(() => {
    const interval = setInterval(() => {
      if (controlsRef.current) {
        setControlsLocked(controlsRef.current.locked);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Handle room reconstruction from uploaded image
  const handleImageUpload = useCallback(
    async (file: File, ceilingHeight: number) => {
      setIsLoading(true);
      setLoadingMessage("Uploading image...");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("ceiling_height_m", ceilingHeight.toString());
        formData.append("include_point_cloud", "true");
        formData.append("point_cloud_density", "8");

        setLoadingMessage("AI is analyzing your room...");

        const response = await fetch("/api/reconstruct", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data: RoomData = await response.json();
        setRoomData(data);

        setLoadingMessage("Building 3D scene...");

        // Build the room
        if (roomBuilderRef.current) {
          roomBuilderRef.current.buildRoom(data, currentTheme);
        }

        // Set up lighting for the room
        if (lightingManagerRef.current) {
          const dims = data.dimensions;
          lightingManagerRef.current.addCeilingLights(
            dims.width,
            dims.length,
            dims.height,
            Math.max(1, Math.floor(dims.length / 3))
          );
        }

        // Set camera position
        if (sceneManagerRef.current && data.camera) {
          const cam = data.camera;
          sceneManagerRef.current.camera.position.set(
            cam.position[0],
            cam.position[1],
            cam.position[2]
          );
        }

        // Set room bounds for controls
        if (controlsRef.current) {
          const dims = data.dimensions;
          controlsRef.current.setBounds(
            -dims.width / 2,
            dims.width / 2,
            0,
            dims.length
          );
        }

        // Set room bounds for furniture
        if (furnitureManagerRef.current) {
          const dims = data.dimensions;
          furnitureManagerRef.current.setRoomBounds(
            dims.width,
            dims.length,
            dims.height
          );
        }

        setShowUploadModal(false);
        setLoadingMessage("");
      } catch (err: unknown) {
        console.error("Reconstruction failed:", err);
        const message = err instanceof Error ? err.message : "Unknown error";

        // If backend is down, create a demo room
        if (message.includes("fetch") || message.includes("NetworkError") || message.includes("Failed")) {
          setLoadingMessage("Backend offline — generating demo room...");
          createDemoRoom();
          setShowUploadModal(false);
        } else {
          setError(`Failed to analyze room: ${message}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentTheme]
  );

  // Create a demo room when backend is unavailable
  const createDemoRoom = useCallback(() => {
    const demoData: RoomData = {
      dimensions: { width: 5, length: 6, height: 2.8 },
      floor: {
        vertices: [
          [-2.5, 0, 0],
          [2.5, 0, 0],
          [2.5, 0, 6],
          [-2.5, 0, 6],
        ],
        uv: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      },
      ceiling: {
        vertices: [
          [-2.5, 2.8, 0],
          [2.5, 2.8, 0],
          [2.5, 2.8, 6],
          [-2.5, 2.8, 6],
        ],
        uv: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      },
      walls: [
        {
          id: "back",
          vertices: [
            [-2.5, 0, 6],
            [2.5, 0, 6],
            [2.5, 2.8, 6],
            [-2.5, 2.8, 6],
          ],
          normal: [0, 0, -1],
          width: 5,
          height: 2.8,
          has_window: true,
          has_door: false,
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        },
        {
          id: "left",
          vertices: [
            [-2.5, 0, 0],
            [-2.5, 0, 6],
            [-2.5, 2.8, 6],
            [-2.5, 2.8, 0],
          ],
          normal: [1, 0, 0],
          width: 6,
          height: 2.8,
          has_window: false,
          has_door: false,
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        },
        {
          id: "right",
          vertices: [
            [2.5, 0, 6],
            [2.5, 0, 0],
            [2.5, 2.8, 0],
            [2.5, 2.8, 6],
          ],
          normal: [-1, 0, 0],
          width: 6,
          height: 2.8,
          has_window: false,
          has_door: false,
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        },
        {
          id: "front",
          vertices: [
            [2.5, 0, 0],
            [-2.5, 0, 0],
            [-2.5, 2.8, 0],
            [2.5, 2.8, 0],
          ],
          normal: [0, 0, 1],
          width: 5,
          height: 2.8,
          has_window: false,
          has_door: true,
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        },
      ],
      point_cloud: [],
      point_colors: [],
      objects_3d: [],
      camera: { position: [0, 1.6, 0.5], target: [0, 1.4, 3] },
      depth_range: { min: 0.5, max: 6 },
    };

    setRoomData(demoData);

    if (roomBuilderRef.current) {
      roomBuilderRef.current.buildRoom(demoData, currentTheme);
    }

    if (lightingManagerRef.current) {
      lightingManagerRef.current.addCeilingLights(5, 6, 2.8, 2);
    }

    if (controlsRef.current) {
      controlsRef.current.setBounds(-2.5, 2.5, 0, 6);
      controlsRef.current.teleport(0, 1.6, 0.5);
      controlsRef.current.lookAt(0, 1.4, 3);
    }

    if (furnitureManagerRef.current) {
      furnitureManagerRef.current.setRoomBounds(5, 6, 2.8);
    }
  }, [currentTheme]);

  const restoreFurniture = useCallback(
    (savedFurniture: Array<{
      itemId: string;
      position: number[];
      rotation?: number;
      scale?: number[];
    }>) => {
      if (!furnitureManagerRef.current) return;
      const manager = furnitureManagerRef.current;
      manager.clearAll();

      for (const saved of savedFurniture) {
        const item = FURNITURE_CATALOG.find((catalogItem) => catalogItem.id === saved.itemId);
        if (!item) continue;

        const placed = manager.placeItem(
          item,
          new THREE.Vector3(
            saved.position[0] ?? 0,
            saved.position[1] ?? 0,
            saved.position[2] ?? 0
          )
        );

        placed.mesh.position.set(
          saved.position[0] ?? 0,
          saved.position[1] ?? 0,
          saved.position[2] ?? 0
        );

        if (typeof saved.rotation === "number") {
          placed.rotation = saved.rotation;
          placed.mesh.rotation.y = saved.rotation;
        }

        if (saved.scale && saved.scale.length === 3) {
          placed.scale.set(saved.scale[0], saved.scale[1], saved.scale[2]);
          placed.mesh.scale.copy(placed.scale);
        }
      }

      setPlacedItems(manager.getPlacedItems());
    },
    []
  );

  const applyLoadedProject = useCallback(
    (loaded: { id: string; theme: string; room_data: RoomData; furniture_data: Array<{ itemId: string; position: number[]; rotation?: number; scale?: number[] }> }) => {
      const data = loaded.room_data;
      setProjectId(loaded.id);
      setRoomData(data);
      setCurrentTheme(loaded.theme || "modern");

      if (roomBuilderRef.current) {
        roomBuilderRef.current.buildRoom(data, loaded.theme || "modern");
      }

      if (lightingManagerRef.current) {
        const dims = data.dimensions;
        lightingManagerRef.current.addCeilingLights(
          dims.width,
          dims.length,
          dims.height,
          Math.max(1, Math.floor(dims.length / 3))
        );
        if (THEMES[loaded.theme]) {
          lightingManagerRef.current.applyTheme(THEMES[loaded.theme]);
        }
      }

      if (controlsRef.current) {
        const dims = data.dimensions;
        controlsRef.current.setBounds(-dims.width / 2, dims.width / 2, 0, dims.length);
        if (data.camera?.position) {
          controlsRef.current.teleport(data.camera.position[0], data.camera.position[1], data.camera.position[2]);
        }
      }

      if (furnitureManagerRef.current) {
        const dims = data.dimensions;
        furnitureManagerRef.current.setRoomBounds(dims.width, dims.length, dims.height);
        restoreFurniture(loaded.furniture_data || []);
      }

      setShowUploadModal(false);
      setStatusMessage(`Loaded local project: ${loaded.id.slice(0, 8)}`);
      setTimeout(() => setStatusMessage(""), 2400);
    },
    [restoreFurniture]
  );

  const handleLoadLatestProject = useCallback(async () => {
    try {
      const listResponse = await fetch("/api/projects?limit=1");
      if (!listResponse.ok) return;
      const list = await listResponse.json();
      if (!Array.isArray(list) || list.length === 0) {
        setStatusMessage("No local project found");
        setTimeout(() => setStatusMessage(""), 1800);
        return;
      }

      const id = list[0].id;
      const detailResponse = await fetch(`/api/projects/${id}`);
      if (!detailResponse.ok) return;
      const project = await detailResponse.json();
      applyLoadedProject(project);
    } catch {
      setStatusMessage("Local load failed");
      setTimeout(() => setStatusMessage(""), 1800);
    }
  }, [applyLoadedProject]);

  const handleSaveLocalProject = useCallback(async () => {
    if (!roomData) {
      setStatusMessage("Nothing to save yet");
      setTimeout(() => setStatusMessage(""), 1500);
      return;
    }

    const payload = {
      name: `Room Project ${new Date().toLocaleString()}`,
      theme: currentTheme,
      room_data: roomData,
      furniture_data: furnitureManagerRef.current?.exportData() ?? [],
      notes: "Saved locally",
    };

    try {
      const response = await fetch(projectId ? `/api/projects/${projectId}` : "/api/projects", {
        method: projectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatusMessage("Local save failed");
        setTimeout(() => setStatusMessage(""), 1800);
        return;
      }

      const saved = await response.json();
      if (saved?.id) {
        setProjectId(saved.id);
      }
      setStatusMessage("Saved to local SQLite");
      setTimeout(() => setStatusMessage(""), 1800);
    } catch {
      setStatusMessage("Local save failed");
      setTimeout(() => setStatusMessage(""), 1800);
    }
  }, [currentTheme, projectId, roomData]);

  // Theme change
  const handleThemeChange = useCallback(
    (theme: string) => {
      setCurrentTheme(theme);
      if (roomBuilderRef.current) {
        roomBuilderRef.current.applyTheme(theme);
      }
      if (lightingManagerRef.current && THEMES[theme]) {
        lightingManagerRef.current.applyTheme(THEMES[theme]);
      }
    },
    []
  );

  // Furniture placement
  const handleStartPlacement = useCallback((item: FurnitureItem) => {
    if (furnitureManagerRef.current && controlsRef.current) {
      furnitureManagerRef.current.startPlacement(item);
      controlsRef.current.enabled = false;
      setIsPlacing(true);
    }
  }, []);

  // Mouse handlers for furniture placement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPlacing && furnitureManagerRef.current) {
        furnitureManagerRef.current.updatePlacement(e.clientX, e.clientY);
      }
    },
    [isPlacing]
  );

  const handleMouseClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPlacing && furnitureManagerRef.current && controlsRef.current) {
        const placed = furnitureManagerRef.current.confirmPlacement();
        if (placed) {
          setPlacedItems(furnitureManagerRef.current.getPlacedItems());
        }
        controlsRef.current.enabled = true;
        setIsPlacing(false);
      }
    },
    [isPlacing]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isPlacing && furnitureManagerRef.current && controlsRef.current) {
        furnitureManagerRef.current.cancelPlacement();
        controlsRef.current.enabled = true;
        setIsPlacing(false);
      }
    },
    [isPlacing]
  );

  // Keyboard shortcut for escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPlacing) {
        furnitureManagerRef.current?.cancelPlacement();
        if (controlsRef.current) controlsRef.current.enabled = true;
        setIsPlacing(false);
      }
      // R to rotate selected
      if (e.key === "r" && selectedFurniture && furnitureManagerRef.current) {
        furnitureManagerRef.current.rotateSelected(45);
      }
      // Delete to remove selected
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedFurniture &&
        furnitureManagerRef.current
      ) {
        furnitureManagerRef.current.removeSelected();
        setPlacedItems(furnitureManagerRef.current.getPlacedItems());
        setSelectedFurniture(null);
      }
      // P to toggle point cloud
      if (e.key === "p" && roomBuilderRef.current) {
        setShowPointCloud((prev) => {
          roomBuilderRef.current?.togglePointCloud(!prev);
          return !prev;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlacing, selectedFurniture]);

  // Screenshot
  const handleScreenshot = useCallback(() => {
    if (sceneManagerRef.current) {
      const dataUrl = sceneManagerRef.current.screenshot();
      const link = document.createElement("a");
      link.download = `intrakart-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, []);

  // Export scene data
  const handleExport = useCallback(() => {
    const exportData = {
      room: roomData?.dimensions,
      theme: currentTheme,
      furniture: furnitureManagerRef.current?.exportData() ?? [],
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.download = `intrakart-project-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [roomData, currentTheme]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0a0a1a]">
      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onUpload={handleImageUpload}
          onDemoRoom={() => {
            createDemoRoom();
            setShowUploadModal(false);
          }}
          onLoadLatest={handleLoadLatestProject}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          error={error}
        />
      )}

      {/* Left Sidebar — Furniture Catalog */}
      {!showUploadModal && (
        <FurnitureSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectItem={handleStartPlacement}
          categories={FURNITURE_CATEGORIES}
          items={FURNITURE_CATALOG}
        />
      )}

      {/* 3D Viewport */}
      <div
        className="relative flex-1"
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
        onContextMenu={handleRightClick}
      >
        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Top Toolbar */}
        {!showUploadModal && (
          <Toolbar
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            onScreenshot={handleScreenshot}
            onExport={handleExport}
            onSaveLocal={handleSaveLocalProject}
            onLoadLatest={handleLoadLatestProject}
            onUploadNew={() => setShowUploadModal(true)}
            showPointCloud={showPointCloud}
            onTogglePointCloud={() => {
              setShowPointCloud(!showPointCloud);
              roomBuilderRef.current?.togglePointCloud(!showPointCloud);
            }}
            showMarkers={showMarkers}
            onToggleMarkers={() => {
              setShowMarkers(!showMarkers);
              roomBuilderRef.current?.toggleObjectMarkers(!showMarkers);
            }}
            roomDimensions={roomData?.dimensions}
          />
        )}

        {/* Controls Hint */}
        {!showUploadModal && !controlsLocked && !isPlacing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-3xl border border-white/20 bg-white/40 px-8 py-6 text-center shadow-2xl backdrop-blur-md">
              <p className="text-lg font-medium text-foreground">
                Click to enter walkthrough mode
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                WASD to move · Mouse to look · ESC to exit · Scroll to adjust speed
              </p>
            </div>
          </div>
        )}

        {/* Placement Mode Indicator */}
        {isPlacing && (
          <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/80 px-6 py-3 text-center shadow-lg backdrop-blur-md">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                Click to place · Right-click or ESC to cancel
              </p>
            </div>
          </div>
        )}

        {/* Minimap */}
        {!showUploadModal && roomData && (
          <Minimap
            roomDimensions={roomData.dimensions}
            placedItems={placedItems}
            cameraRef={sceneManagerRef.current?.camera ?? null}
          />
        )}

        {/* Status Bar */}
        {!showUploadModal && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/20 bg-white/40 px-4 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
            <span>
              {roomData
                ? `Room: ${roomData.dimensions.width}m × ${roomData.dimensions.length}m × ${roomData.dimensions.height}m`
                : "No room loaded"}
            </span>
            <span>{placedItems.length} items placed</span>
            <span>Theme: {THEMES[currentTheme]?.name ?? currentTheme}</span>
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Right Panel — Properties */}
      {!showUploadModal && propertiesOpen && selectedFurniture && (
        <PropertiesPanel
          item={selectedFurniture}
          onClose={() => {
            setPropertiesOpen(false);
            furnitureManagerRef.current?.deselectItem();
          }}
          onRotate={(deg: number) => furnitureManagerRef.current?.rotateSelected(deg)}
          onScale={(factor: number) => furnitureManagerRef.current?.scaleSelected(factor)}
          onRemove={() => {
            furnitureManagerRef.current?.removeSelected();
            setPlacedItems(furnitureManagerRef.current?.getPlacedItems() ?? []);
            setPropertiesOpen(false);
          }}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-lg text-foreground font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
