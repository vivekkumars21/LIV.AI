"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  SceneManager,
  FirstPersonControls,
  OrbitControls,
  RoomBuilder,
  FurnitureManager,
  LightingManager,
  THEMES,
  FURNITURE_CATALOG,
} from "@/lib/three-scene";
import type { RoomData, PlacedFurniture, FurnitureItem } from "@/lib/three-scene";
import { FurnitureSidebar } from "./furniture-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import { Minimap } from "./minimap";
import { UploadModal } from "./upload-modal";
import { products, parseDimensionsMetric, type Product } from "@/lib/products";

export type ViewMode = "walkthrough" | "orbit" | "topdown";

export function Room3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const controlsRef = useRef<FirstPersonControls | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
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
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [webglError, setWebglError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("walkthrough");

  const [dbFurniture, setDbFurniture] = useState<FurnitureItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [furnitureRes, productsRes] = await Promise.all([
          fetch("/api/furniture"),
          fetch("/api/products?limit=300")
        ]);
        
        if (furnitureRes.ok) {
          const data = await furnitureRes.json();
          if (Array.isArray(data)) setDbFurniture(data);
        }
        
        if (productsRes.ok) {
          const data = await productsRes.json();
          if (Array.isArray(data)) setDbProducts(data);
        }
      } catch (err) {
        console.warn("Catalog fetch failed, using fallbacks:", err);
      }
    };
    loadCatalog();
  }, []);

  const plannerCatalog = useMemo(() => {
    const categoryMap: Record<string, string> = {
      Sofas: "Sofas",
      Tables: "Tables",
      Beds: "Beds",
      Lighting: "Lamps",
      Decor: "Cabinets",
      Storage: "Cabinets",
    };

    const ecommerceItems = dbProducts
      .map<FurnitureItem | null>((product) => {
        const dims = parseDimensionsMetric(product.dimensions);
        if (!dims) return null;

        return {
          id: `store-${product.id}`,
          name: product.name,
          category: categoryMap[product.category] ?? "Cabinets",
          thumbnailUrl: product.image,
          dimensions: {
            width: Math.max(dims.width, 0.25),
            height: Math.max(dims.height, 0.25),
            depth: Math.max(dims.depth, 0.2),
          },
          price: product.price,
          material: product.material,
        };
      })
      .filter((item): item is FurnitureItem => item !== null);

    const items = [...dbFurniture, ...FURNITURE_CATALOG, ...ecommerceItems];
    // Filter out duplicates if any (based on ID)
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
    const categories = Array.from(new Set(uniqueItems.map((item) => item.category)));

    return { items: uniqueItems, categories };
  }, [dbFurniture, dbProducts]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || sceneManagerRef.current) return;

    const container = containerRef.current;

    try {
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

      // Orbit Controls
      const orbitControls = new OrbitControls({
        camera: sceneManager.camera,
        domElement: sceneManager.renderer.domElement,
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 0.5,
        maxDistance: 20,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI / 2,
      });
      orbitControls.setEnabled(false); // Start with first-person mode
      orbitControlsRef.current = orbitControls;

      // Animation loop
      sceneManager.onUpdate((delta) => {
        controls.update(delta);
        orbitControls.update();
      });

      sceneManager.start();
      setIsInitialized(true);

      return () => {
        controls.dispose();
        orbitControls.dispose();
        furnitureManager.dispose();
        roomBuilder.dispose();
        lighting.dispose();
        sceneManager.dispose();
        sceneManagerRef.current = null;
        controlsRef.current = null;
        orbitControlsRef.current = null;
        roomBuilderRef.current = null;
        furnitureManagerRef.current = null;
        lightingManagerRef.current = null;
        setIsInitialized(false);
      };
    } catch (err) {
      console.error("Failed to initialize 3D engine:", err);
      setWebglError(
        err instanceof Error
          ? err.message
          : "Failed to initialize WebGL. Please enable hardware acceleration in your browser."
      );
    }
  }, []);

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

  const getProjectRequestHeaders = useCallback((): HeadersInit => {
    if (typeof window === "undefined") {
      return { "Content-Type": "application/json" };
    }
    const token = window.localStorage.getItem("intrakart-access-token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

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
        const item = plannerCatalog.items.find((catalogItem) => catalogItem.id === saved.itemId);
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
    [plannerCatalog.items]
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
      setStatusMessage(`Loaded cloud project: ${loaded.id.slice(0, 8)}`);
      setTimeout(() => setStatusMessage(""), 2400);
    },
    [restoreFurniture]
  );

  const handleLoadLatestProject = useCallback(async () => {
    try {
      const listResponse = await fetch("/api/projects?limit=1", {
        headers: getProjectRequestHeaders(),
      });
      if (!listResponse.ok) return;
      const list = await listResponse.json();
      if (!Array.isArray(list) || list.length === 0) {
        setStatusMessage("No cloud project found");
        setTimeout(() => setStatusMessage(""), 1800);
        return;
      }

      const id = list[0].id;
      const detailResponse = await fetch(`/api/projects/${id}`, {
        headers: getProjectRequestHeaders(),
      });
      if (!detailResponse.ok) return;
      const project = await detailResponse.json();
      applyLoadedProject(project);
    } catch {
      setStatusMessage("Cloud load failed");
      setTimeout(() => setStatusMessage(""), 1800);
    }
  }, [applyLoadedProject, getProjectRequestHeaders]);

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
      notes: "Saved in Supabase",
    };

    try {
      const response = await fetch(projectId ? `/api/projects/${projectId}` : "/api/projects", {
        method: projectId ? "PUT" : "POST",
        headers: getProjectRequestHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatusMessage("Cloud save failed");
        setTimeout(() => setStatusMessage(""), 1800);
        return;
      }

      const saved = await response.json();
      if (saved?.id) {
        setProjectId(saved.id);
      }
      setStatusMessage("Saved to Supabase cloud");
      setTimeout(() => setStatusMessage(""), 1800);
    } catch {
      setStatusMessage("Cloud save failed");
      setTimeout(() => setStatusMessage(""), 1800);
    }
  }, [currentTheme, getProjectRequestHeaders, projectId, roomData]);

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

  // View mode switching
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (!sceneManagerRef.current || !controlsRef.current || !orbitControlsRef.current) return;

      const camera = sceneManagerRef.current.camera;
      const currentPos = camera.position.clone();
      
      // Exit pointer lock if in walkthrough mode
      if (viewMode === "walkthrough" && document.pointerLockElement) {
        document.exitPointerLock();
      }

      setViewMode(mode);

      if (mode === "walkthrough") {
        // Switch to first-person controls
        controlsRef.current.setEnabled(true);
        orbitControlsRef.current.setEnabled(false);
        
        // Position camera at eye level if coming from other modes
        if (viewMode !== "walkthrough") {
          camera.position.y = 1.6;
        }
      } else if (mode === "orbit") {
        // Switch to orbit controls
        controlsRef.current.setEnabled(false);
        orbitControlsRef.current.setEnabled(true);
        
        // Set orbit target to room center
        if (roomData) {
          const dims = roomData.dimensions;
          orbitControlsRef.current.setTarget(0, dims.height / 2, dims.length / 2);
        }
        
        // Position camera for good orbit view
        if (viewMode === "walkthrough") {
          camera.position.set(
            currentPos.x,
            Math.max(currentPos.y, 2),
            currentPos.z - 2
          );
        }
      } else if (mode === "topdown") {
        // Switch to orbit controls in top-down configuration
        controlsRef.current.setEnabled(false);
        orbitControlsRef.current.setEnabled(true);
        
        // Set camera directly above room center
        if (roomData) {
          const dims = roomData.dimensions;
          camera.position.set(0, dims.height + 4, dims.length / 2);
          orbitControlsRef.current.setTarget(0, 0, dims.length / 2);
        }
      }
    },
    [viewMode, roomData]
  );

  // Furniture placement
  const handleStartPlacement = useCallback((item: FurnitureItem) => {
    if (furnitureManagerRef.current && controlsRef.current && orbitControlsRef.current) {
      furnitureManagerRef.current.startPlacement(item);
      controlsRef.current.enabled = false;
      orbitControlsRef.current.setEnabled(false);
      setIsPlacing(true);
    }
  }, []);

  // Mouse handlers for furniture placement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPlacing && furnitureManagerRef.current) {
        furnitureManagerRef.current.updatePlacement(e.clientX, e.clientY);
      } else if (isDraggingItem && furnitureManagerRef.current) {
        const moved = furnitureManagerRef.current.updateDragging(e.clientX, e.clientY);
        if (moved) {
          setPlacedItems(furnitureManagerRef.current.getPlacedItems());
        }
      }
    },
    [isPlacing, isDraggingItem]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isPlacing || !furnitureManagerRef.current) return;

      const didStart = furnitureManagerRef.current.startDragging(e.clientX, e.clientY);
      if (!didStart) return;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      if (orbitControlsRef.current) {
        orbitControlsRef.current.setEnabled(false);
      }

      setIsDraggingItem(true);
      setSelectedFurniture(furnitureManagerRef.current.selected);
      setPropertiesOpen(!!furnitureManagerRef.current.selected);
    },
    [isPlacing]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingItem || !furnitureManagerRef.current) return;

    furnitureManagerRef.current.stopDragging();
    setPlacedItems(furnitureManagerRef.current.getPlacedItems());

    if (viewMode === "walkthrough") {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    } else if (orbitControlsRef.current) {
      orbitControlsRef.current.setEnabled(true);
    }

    setIsDraggingItem(false);
  }, [isDraggingItem, viewMode]);

  const handleMouseClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingItem) return;

      if (isPlacing && furnitureManagerRef.current && controlsRef.current && orbitControlsRef.current) {
        const placed = furnitureManagerRef.current.confirmPlacement();
        if (placed) {
          setPlacedItems(furnitureManagerRef.current.getPlacedItems());
        }
        // Re-enable the appropriate controls based on view mode
        if (viewMode === "walkthrough") {
          controlsRef.current.enabled = true;
        } else {
          orbitControlsRef.current.setEnabled(true);
        }
        setIsPlacing(false);
      } else if (furnitureManagerRef.current) {
        const selected = furnitureManagerRef.current.handleClick(e.clientX, e.clientY);
        setSelectedFurniture(selected);
        setPropertiesOpen(!!selected);
      }
    },
    [isPlacing, isDraggingItem, viewMode]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isPlacing && furnitureManagerRef.current && controlsRef.current && orbitControlsRef.current) {
        furnitureManagerRef.current.cancelPlacement();
        // Re-enable the appropriate controls based on view mode
        if (viewMode === "walkthrough") {
          controlsRef.current.enabled = true;
        } else {
          orbitControlsRef.current.setEnabled(true);
        }
        setIsPlacing(false);
      }
    },
    [isPlacing, viewMode]
  );

  // Keyboard shortcut for escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDraggingItem && furnitureManagerRef.current) {
        furnitureManagerRef.current.stopDragging();
        setIsDraggingItem(false);
        if (viewMode === "walkthrough" && controlsRef.current) {
          controlsRef.current.enabled = true;
        } else if (orbitControlsRef.current) {
          orbitControlsRef.current.setEnabled(true);
        }
      }
      if (e.key === "Escape" && isPlacing) {
        furnitureManagerRef.current?.cancelPlacement();
        // Re-enable the appropriate controls based on view mode
        if (viewMode === "walkthrough" && controlsRef.current) {
          controlsRef.current.enabled = true;
        } else if (orbitControlsRef.current) {
          orbitControlsRef.current.setEnabled(true);
        }
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
  }, [isPlacing, isDraggingItem, selectedFurniture, viewMode]);

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

  // WebGL not available — show fallback UI
  if (webglError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">3D Engine Unavailable</h2>
          <p className="mt-3 text-sm text-muted-foreground">{webglError}</p>
          <div className="mt-6 space-y-2 rounded-2xl bg-gray-50 p-4 text-left text-xs text-muted-foreground">
            <p className="font-medium text-foreground">How to fix:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Open <strong>chrome://settings/system</strong> in your browser</li>
              <li>Enable <strong>&quot;Use hardware acceleration when available&quot;</strong></li>
              <li>Restart your browser and try again</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          categories={plannerCatalog.categories}
          items={plannerCatalog.items}
        />
      )}

      {/* 3D Viewport */}
      <div
        className="relative flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
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
        {!showUploadModal && !controlsLocked && !isPlacing && viewMode === "walkthrough" && (
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

        {/* Orbit/TopDown Controls Hint */}
        {!showUploadModal && !isPlacing && (viewMode === "orbit" || viewMode === "topdown") && (
          <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
            <div className="rounded-3xl border border-white/20 bg-white/40 px-6 py-4 text-center shadow-2xl backdrop-blur-md">
              <p className="text-sm text-muted-foreground">
                Left-drag to rotate · Right-drag to pan · Scroll to zoom
              </p>
            </div>
          </div>
        )}

        {/* Placement Mode Indicator */}
        {(isPlacing || isDraggingItem) && (
          <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/80 px-6 py-3 text-center shadow-lg backdrop-blur-md">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {isPlacing ? "Click to place · Right-click or ESC to cancel" : "Drag selected item to move around the room"}
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
