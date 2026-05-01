/**
 * Furniture Manager
 * Handles loading, placing, and manipulating GLB 3D furniture models.
 *
 * Features:
 * - GLB/GLTF model loading with caching
 * - Drag-and-drop placement via raycasting
 * - Smart floor snapping and wall alignment
 * - Depth-based auto-scaling
 * - Selection, rotation, and resizing
 * - Undo/redo support
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  dimensions: { width: number; height: number; depth: number };
  price?: number;
  material?: string;
}

export interface PlacedFurniture {
  id: string;
  itemId: string;
  name: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  rotation: number; // Y-axis rotation in radians
  scale: THREE.Vector3;
  originalDimensions: { width: number; height: number; depth: number };
}

// Furniture catalog with procedurally generated 3D models as fallback
// Furniture catalog with procedurally generated 3D models as fallback
export const FURNITURE_CATALOG: FurnitureItem[] = [
  // Sofas
  {
    id: "sofa-modern-3seat",
    name: "Aalto 3-Seat Sofa",
    category: "Sofas",
    dimensions: { width: 2.2, height: 0.85, depth: 0.95 },
    price: 45000,
    material: "Performance Linen",
    thumbnailUrl: "/images/products/s1-cloud-modular-sofa.png"
  },
  {
    id: "sofa-l-shaped",
    name: "Nordic Corner Sectional",
    category: "Sofas",
    dimensions: { width: 2.8, height: 0.85, depth: 1.8 },
    price: 85000,
    material: "Top-grain Leather",
    thumbnailUrl: "/images/products/s2-nordic-sectional.png"
  },
  {
    id: "sofa-loveseat",
    name: "Urban Loveseat",
    category: "Sofas",
    dimensions: { width: 1.6, height: 0.8, depth: 0.9 },
    price: 32000,
    material: "Velvet",
    thumbnailUrl: "/images/products/s4-linen-loveseat.png"
  },
  // Chairs
  {
    id: "chair-accent",
    name: "Eames-Style Accent Chair",
    category: "Chairs",
    dimensions: { width: 0.75, height: 0.9, depth: 0.8 },
    price: 18000,
    material: "Bentwood & Leather",
    thumbnailUrl: "/images/products/s7-designer-velvet-chair.png"
  },
  {
    id: "chair-office",
    name: "ErgoPro Task Chair",
    category: "Chairs",
    dimensions: { width: 0.65, height: 1.1, depth: 0.65 },
    price: 12500,
    material: "Recycled Mesh",
    thumbnailUrl: "/images/generated/ar-chair.svg"
  },

  {
    id: "chair-lounge",
    name: "Mid-Century Lounge Chair",
    category: "Chairs",
    dimensions: { width: 0.85, height: 0.8, depth: 0.85 },
    price: 24000,
    material: "Walnut & Wool",
    thumbnailUrl: "/images/products/chairs_velvet_accent_1772731760505.png"
  },
  // Tables
  {
    id: "table-coffee",
    name: "Noguchi-Style Coffee Table",
    category: "Tables",
    dimensions: { width: 1.2, height: 0.4, depth: 0.8 },
    price: 22000,
    material: "Tempered Glass & Ash",
    thumbnailUrl: "/images/products/t2-glass-coffee-table.png"
  },
  {
    id: "table-dining-6",
    name: "Gather 6-Seat Dining Table",
    category: "Tables",
    dimensions: { width: 1.8, height: 0.76, depth: 0.9 },
    price: 48000,
    material: "Solid Walnut",
    thumbnailUrl: "/images/products/t1-kyoto-dining-table.png"
  },
  {
    id: "table-side",
    name: "Minimalist End Table",
    category: "Tables",
    dimensions: { width: 0.45, height: 0.5, depth: 0.45 },
    price: 8500,
    material: "Powder-coated Steel",
    thumbnailUrl: "/images/products/t4-marble-side-table.png"
  },
  {
    id: "table-desk",
    name: "Studio Work Desk",
    category: "Tables",
    dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
    price: 15000,
    material: "Maple Veneer",
    thumbnailUrl: "/images/products/t6-industrial-desk.png"
  },
  // Beds
  {
    id: "bed-queen",
    name: "Zen Queen Platform Bed",
    category: "Beds",
    dimensions: { width: 1.6, height: 1.0, depth: 2.1 },
    price: 35000,
    material: "Stained Pine",
    thumbnailUrl: "/images/products/b1-serene-platform-bed.png"
  },
  {
    id: "bed-king",
    name: "Monolith King Bed",
    category: "Beds",
    dimensions: { width: 1.9, height: 1.1, depth: 2.2 },
    price: 52000,
    material: "Upholstered Headboard",
    thumbnailUrl: "/images/products/b2-upholstered-king-bed.png"
  },
  // Lighting
  {
    id: "lamp-floor",
    name: "Arc Floor Lamp",
    category: "Lamps",
    dimensions: { width: 0.4, height: 1.8, depth: 1.2 },
    price: 9500,
    material: "Brushed Nickel",
    thumbnailUrl: "/images/products/l1-eclipse-floor-lamp.png"
  },
  {
    id: "lamp-table",
    name: "Globe Table Lamp",
    category: "Lamps",
    dimensions: { width: 0.25, height: 0.45, depth: 0.25 },
    price: 4200,
    material: "Opal Glass",
    thumbnailUrl: "/images/products/l3-minimalist-table-lamp.png"
  },
  // Storage
  {
    id: "cabinet-bookshelf",
    name: "Modular Library Unit",
    category: "Cabinets",
    dimensions: { width: 0.9, height: 2.0, depth: 0.3 },
    price: 14000,
    material: "Birch Plywood",
    thumbnailUrl: "/images/products/storage_industrial_bookshelf_1772731930015.png"
  },
  {
    id: "cabinet-tv-unit",
    name: "Floating Media Console",
    category: "Cabinets",
    dimensions: { width: 1.8, height: 0.4, depth: 0.4 },
    price: 21000,
    material: "Matte Lacquer",
    thumbnailUrl: "/images/category-storage.png"
  },

  // Plants
  {
    id: "plant-fiddle",
    name: "Fiddle Leaf Fig (Large)",
    category: "Plants",
    dimensions: { width: 0.6, height: 1.6, depth: 0.6 },
    price: 3500,
    material: "Natural",
    thumbnailUrl: "/images/generated/ar-plant.svg"
  },

];

export const FURNITURE_CATEGORIES = [
  "Sofas",
  "Chairs",
  "Tables",
  "Beds",
  "Lamps",
  "Plants",
  "Cabinets",
];

// Colour mapping per category for procedural models
const CATEGORY_COLORS: Record<string, number> = {
  Sofas: 0x6b8cce,
  Chairs: 0xce8c6b,
  Tables: 0x8b6914,
  Beds: 0xd4a76a,
  Lamps: 0xf5d442,
  Plants: 0x4caf50,
  Cabinets: 0x9e8c72,
};

export class FurnitureManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private furnitureGroup: THREE.Group;
  private gltfLoader: GLTFLoader;
  private modelCache: Map<string, THREE.Group> = new Map();
  private placedItems: Map<string, PlacedFurniture> = new Map();
  private selectedItem: PlacedFurniture | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private draggedItem: PlacedFurniture | null = null;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();

  // Transform mode
  private transformMode: "translate" | "rotate" | "scale" = "translate";

  // Placement ghost
  private ghostMesh: THREE.Group | null = null;
  private isPlacing = false;
  private placingItem: FurnitureItem | null = null;

  // Floor reference for raycasting
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Callbacks
  public onSelectionChange?: (item: PlacedFurniture | null) => void;
  public onItemPlaced?: (item: PlacedFurniture) => void;

  // Room bounds
  private roomBounds = {
    minX: -5,
    maxX: 5,
    minZ: 0,
    maxZ: 10,
    height: 2.8,
  };

  // Undo history
  private history: Array<{
    type: "place" | "remove" | "move" | "rotate" | "scale";
    itemId: string;
    data: Record<string, unknown>;
  }> = [];

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.furnitureGroup = new THREE.Group();
    this.furnitureGroup.name = "furniture";
    this.scene.add(this.furnitureGroup);

    // Setup GLTF loader with Draco compression
    this.gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  setRoomBounds(width: number, length: number, height: number) {
    this.roomBounds = {
      minX: -width / 2,
      maxX: width / 2,
      minZ: 0,
      maxZ: length,
      height,
    };
  }

  /**
   * Start placing a furniture item.
   * Creates a ghost preview that follows the mouse.
   */
  startPlacement(item: FurnitureItem) {
    this.cancelPlacement();
    this.placingItem = item;
    this.isPlacing = true;

    // Create ghost preview
    this.ghostMesh = this.createProceduralModel(item);
    this.ghostMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = 0.5;
        mat.color.set(0x4488ff);
      }
    });
    this.scene.add(this.ghostMesh);
  }

  /**
   * Update ghost position during placement (call on mouse move).
   */
  updatePlacement(clientX: number, clientY: number) {
    if (!this.isPlacing || !this.ghostMesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.floorPlane, intersectPoint);

    if (intersectPoint) {
      // Snap to room bounds
      const item = this.placingItem!;
      const hw = item.dimensions.width / 2;
      const hd = item.dimensions.depth / 2;

      let x = intersectPoint.x;
      let z = intersectPoint.z;

      // Clamp to room
      x = Math.max(this.roomBounds.minX + hw, Math.min(this.roomBounds.maxX - hw, x));
      z = Math.max(this.roomBounds.minZ + hd, Math.min(this.roomBounds.maxZ - hd, z));

      // Wall snapping (if within 0.3m of a wall)
      const snapDist = 0.3;
      if (x - this.roomBounds.minX < snapDist + hw) x = this.roomBounds.minX + hw;
      if (this.roomBounds.maxX - x < snapDist + hw) x = this.roomBounds.maxX - hw;
      if (z - this.roomBounds.minZ < snapDist + hd) z = this.roomBounds.minZ + hd;
      if (this.roomBounds.maxZ - z < snapDist + hd) z = this.roomBounds.maxZ - hd;

      this.ghostMesh.position.set(x, 0, z);
    }
  }

  /**
   * Confirm placement at current ghost position.
   */
  confirmPlacement(): PlacedFurniture | null {
    if (!this.isPlacing || !this.ghostMesh || !this.placingItem) return null;

    const position = this.ghostMesh.position.clone();
    this.scene.remove(this.ghostMesh);

    const item = this.placingItem;
    this.isPlacing = false;
    this.ghostMesh = null;
    this.placingItem = null;

    return this.placeItem(item, position);
  }

  /**
   * Cancel current placement.
   */
  cancelPlacement() {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }
    this.isPlacing = false;
    this.placingItem = null;
  }

  /**
   * Place a furniture item at a specific position.
   */
  placeItem(
    item: FurnitureItem,
    position: THREE.Vector3,
    rotation: number = 0
  ): PlacedFurniture {
    const id = `placed_${item.id}_${Date.now()}`;
    const mesh = this.createProceduralModel(item);

    mesh.position.copy(position);
    mesh.rotation.y = rotation;
    mesh.name = id;

    // Enable shadows
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.furnitureGroup.add(mesh);

    const placed: PlacedFurniture = {
      id,
      itemId: item.id,
      name: item.name,
      mesh,
      position: position.clone(),
      rotation,
      scale: new THREE.Vector3(1, 1, 1),
      originalDimensions: { ...item.dimensions },
    };

    this.placedItems.set(id, placed);

    // Add to undo history
    this.history.push({
      type: "place",
      itemId: id,
      data: { position: position.toArray(), rotation },
    });

    this.onItemPlaced?.(placed);
    return placed;
  }

  /**
   * Create a procedural 3D model for a furniture item.
   * Used as fallback when GLB models aren't available.
   */
  private createProceduralModel(item: FurnitureItem): THREE.Group {
    const group = new THREE.Group();
    const { width, height, depth } = item.dimensions;
    const category = item.category;
    const color = CATEGORY_COLORS[category] ?? 0x888888;

    switch (category) {
      case "Sofas":
        this.buildSofaGeometry(group, width, height, depth, color);
        break;
      case "Chairs":
        this.buildChairGeometry(group, width, height, depth, color);
        break;
      case "Tables":
        this.buildTableGeometry(group, width, height, depth, color);
        break;
      case "Beds":
        this.buildBedGeometry(group, width, height, depth, color);
        break;
      case "Lamps":
        this.buildLampGeometry(group, width, height, depth, color);
        break;
      case "Plants":
        this.buildPlantGeometry(group, width, height, depth, color);
        break;
      case "Cabinets":
        this.buildCabinetGeometry(group, width, height, depth, color);
        break;
      default:
        // Generic box
        const geom = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.y = height / 2;
        group.add(mesh);
    }

    return group;
  }

  private buildSofaGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
    });

    // Seat
    const seatH = h * 0.4;
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(w, seatH, d),
      mat
    );
    seat.position.set(0, seatH / 2 + 0.1, 0);
    group.add(seat);

    // Back rest
    const backH = h * 0.5;
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(w, backH, d * 0.2),
      mat
    );
    back.position.set(0, seatH + backH / 2 + 0.1, -d / 2 + d * 0.1);
    group.add(back);

    // Arm rests
    const armW = 0.12;
    const armH = h * 0.35;
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(armW, armH, d * 0.85),
        mat
      );
      arm.position.set(
        (side * (w / 2 - armW / 2)),
        seatH + armH / 2 + 0.1,
        0
      );
      group.add(arm);
    });

    // Legs
    const legH = 0.1;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, legH),
        legMat
      );
      leg.position.set(
        sx * (w / 2 - 0.1),
        legH / 2,
        sz * (d / 2 - 0.1)
      );
      group.add(leg);
    });

    // Cushions
    const cushionW = (w - 0.3) / 3;
    for (let i = 0; i < 3; i++) {
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(cushionW * 0.9, 0.12, d * 0.7),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(color).offsetHSL(0, 0, 0.1).getHex(), roughness: 0.9 })
      );
      cushion.position.set(
        -w / 2 + 0.15 + cushionW * (i + 0.5),
        seatH + 0.16,
        0.05
      );
      group.add(cushion);
    }
  }

  private buildChairGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.5,
    });

    // Seat
    const seatH = h * 0.45;
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.06, d),
      mat
    );
    seat.position.set(0, seatH, 0);
    group.add(seat);

    // Back rest
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.9, h - seatH - 0.05, 0.04),
      mat
    );
    back.position.set(0, seatH + (h - seatH) / 2, -d / 2 + 0.02);
    group.add(back);

    // Legs
    const legR = 0.025;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legR, legR, seatH, 16),
        legMat
      );
      leg.position.set(
        sx * (w / 2 - 0.05),
        seatH / 2,
        sz * (d / 2 - 0.05)
      );
      group.add(leg);
    });
  }

  private buildTableGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const topMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.05,
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.3,
    });

    // Table top
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.04, d),
      topMat
    );
    top.position.set(0, h, 0);
    group.add(top);

    // Legs
    const legH = h - 0.02;
    const legR = 0.03;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legR, legR, legH, 16),
        legMat
      );
      leg.position.set(
        sx * (w / 2 - 0.08),
        legH / 2,
        sz * (d / 2 - 0.08)
      );
      group.add(leg);
    });
  }

  private buildBedGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.5,
    });
    const mattressMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.9,
    });
    const pillowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
    });

    // Frame base
    const frameH = 0.35;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w, frameH, d),
      frameMat
    );
    frame.position.set(0, frameH / 2, 0);
    group.add(frame);

    // Mattress
    const mattressH = 0.2;
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.98, mattressH, d * 0.95),
      mattressMat
    );
    mattress.position.set(0, frameH + mattressH / 2, -0.02);
    group.add(mattress);

    // Headboard
    const headboardH = h - frameH;
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(w, headboardH, 0.08),
      frameMat
    );
    headboard.position.set(0, frameH + headboardH / 2, -d / 2 + 0.04);
    group.add(headboard);

    // Pillows
    const pillowW = w * 0.35;
    [-1, 1].forEach((side) => {
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(pillowW, 0.1, 0.3),
        pillowMat
      );
      pillow.position.set(
        side * (w / 4),
        frameH + mattressH + 0.05,
        -d / 2 + 0.4
      );
      group.add(pillow);
    });
  }

  private buildLampGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.6,
    });
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e6,
      roughness: 0.8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    // Base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(w * 0.4, w * 0.5, 0.05, 32),
      baseMat
    );
    base.position.set(0, 0.025, 0);
    group.add(base);

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, h * 0.7, 8),
      baseMat
    );
    pole.position.set(0, h * 0.35, 0);
    group.add(pole);

    // Shade (cone)
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(w * 0.5, h * 0.3, 32, 1, true),
      shadeMat
    );
    shade.position.set(0, h * 0.8, 0);
    group.add(shade);

    // Light bulb (emissive sphere)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffee88,
        emissive: 0xffee88,
        emissiveIntensity: 1,
      })
    );
    bulb.position.set(0, h * 0.72, 0);
    group.add(bulb);

    // Point light
    const light = new THREE.PointLight(0xffeedd, 0.5, 3);
    light.position.set(0, h * 0.72, 0);
    light.castShadow = true;
    group.add(light);
  }

  private buildPlantGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    // Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(w * 0.3, w * 0.25, h * 0.25, 24),
      potMat
    );
    pot.position.set(0, h * 0.125, 0);
    group.add(pot);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(w * 0.28, w * 0.28, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0x3e2723 })
    );
    soil.position.set(0, h * 0.26, 0);
    group.add(soil);

    // Foliage (sphere cluster)
    const foliagePositions = [
      [0, h * 0.6, 0],
      [w * 0.15, h * 0.55, w * 0.1],
      [-w * 0.12, h * 0.5, -w * 0.08],
      [w * 0.08, h * 0.7, -w * 0.05],
    ];

    foliagePositions.forEach(([x, y, z], i) => {
      const size = w * (0.2 + Math.random() * 0.15);
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 16),
        leafMat.clone()
      );
      (leaf.material as THREE.MeshStandardMaterial).color.setHex(
        0x2e7d32 + (i * 0x050505)
      );
      leaf.position.set(x, y, z);
      leaf.scale.set(1, 0.8 + Math.random() * 0.4, 1);
      group.add(leaf);
    });

    // Trunk/stem
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, h * 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    );
    trunk.position.set(0, h * 0.35, 0);
    group.add(trunk);
  }

  private buildCabinetGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    color: number
  ) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );
    body.position.set(0, h / 2, 0);
    group.add(body);

    // Doors (front face division)
    const doorW = w / 2 - 0.02;
    [-1, 1].forEach((side) => {
      // Door panel (slightly protruding)
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, h - 0.04, 0.02),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(color).offsetHSL(0, 0, -0.05).getHex(),
          roughness: 0.5,
        })
      );
      door.position.set(side * (w / 4), h / 2, d / 2 + 0.01);
      group.add(door);

      // Handle
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8),
        handleMat
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.set(
        side * (w / 4) + side * (doorW / 2 - 0.08),
        h / 2,
        d / 2 + 0.03
      );
      group.add(handle);
    });

    // Shelves (visible as lines)
    const shelfCount = Math.max(1, Math.floor(h / 0.4));
    for (let i = 1; i < shelfCount; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.04, 0.02, d - 0.04),
        mat
      );
      shelf.position.set(0, (h / shelfCount) * i, 0);
      group.add(shelf);
    }
  }

  /**
   * Handle click for selecting placed furniture.
   */
  handleClick(clientX: number, clientY: number): PlacedFurniture | null {
    if (this.isPlacing) return null;

    const placed = this.pickItem(clientX, clientY);
    if (placed) {
      this.selectItem(placed);
      return placed;
    }

    this.deselectItem();
    return null;
  }

  startDragging(clientX: number, clientY: number): boolean {
    if (this.isPlacing) return false;

    const picked = this.pickItem(clientX, clientY);
    if (!picked) return false;

    this.selectItem(picked);
    this.draggedItem = picked;

    const intersection = this.getIntersectionOnFloor(clientX, clientY);
    if (intersection) {
      this.dragOffset.copy(picked.mesh.position).sub(intersection);
    } else {
      this.dragOffset.set(0, 0, 0);
    }

    return true;
  }

  updateDragging(clientX: number, clientY: number): boolean {
    if (!this.draggedItem) return false;

    const intersection = this.getIntersectionOnFloor(clientX, clientY);
    if (!intersection) return false;

    const item = this.draggedItem;
    const proposed = intersection.clone().add(this.dragOffset);

    const halfWidth = (item.originalDimensions.width * item.scale.x) / 2;
    const halfDepth = (item.originalDimensions.depth * item.scale.z) / 2;

    const clampedX = Math.max(
      this.roomBounds.minX + halfWidth,
      Math.min(this.roomBounds.maxX - halfWidth, proposed.x)
    );
    const clampedZ = Math.max(
      this.roomBounds.minZ + halfDepth,
      Math.min(this.roomBounds.maxZ - halfDepth, proposed.z)
    );

    item.mesh.position.set(clampedX, 0, clampedZ);
    item.position.set(clampedX, 0, clampedZ);
    return true;
  }

  stopDragging() {
    this.draggedItem = null;
  }

  get dragging(): boolean {
    return this.draggedItem !== null;
  }

  selectItem(item: PlacedFurniture) {
    this.deselectItem();
    this.selectedItem = item;

    // Add selection highlight
    item.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.originalEmissive = (
          child.material as THREE.MeshStandardMaterial
        ).emissive?.getHex();
        (child.material as THREE.MeshStandardMaterial).emissive?.setHex(
          0x224488
        );
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    });

    this.onSelectionChange?.(item);
  }

  deselectItem() {
    if (this.selectedItem) {
      this.selectedItem.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const original = child.userData.originalEmissive ?? 0x000000;
          (child.material as THREE.MeshStandardMaterial).emissive?.setHex(
            original
          );
          (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        }
      });
    }
    this.selectedItem = null;
    this.onSelectionChange?.(null);
  }

  /**
   * Rotate the selected item.
   */
  rotateSelected(angleDeg: number) {
    if (!this.selectedItem) return;
    const rad = (angleDeg * Math.PI) / 180;
    this.selectedItem.rotation += rad;
    this.selectedItem.mesh.rotation.y = this.selectedItem.rotation;
  }

  /**
   * Scale the selected item.
   */
  scaleSelected(factor: number) {
    if (!this.selectedItem) return;
    const newScale = this.selectedItem.scale.clone().multiplyScalar(factor);
    newScale.clampScalar(0.3, 3.0);
    this.selectedItem.scale.copy(newScale);
    this.selectedItem.mesh.scale.copy(newScale);
  }

  /**
   * Remove the selected item.
   */
  removeSelected() {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;

    this.furnitureGroup.remove(this.selectedItem.mesh);
    this.selectedItem.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });

    this.placedItems.delete(id);
    this.selectedItem = null;
    this.onSelectionChange?.(null);
  }

  /**
   * Get all placed items.
   */
  getPlacedItems(): PlacedFurniture[] {
    return Array.from(this.placedItems.values());
  }

  clearAll() {
    this.deselectItem();
    this.placedItems.forEach((item) => {
      this.furnitureGroup.remove(item.mesh);
      item.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    });
    this.placedItems.clear();
  }

  /**
   * Export placed furniture data for saving.
   */
  exportData(): Array<{
    itemId: string;
    name: string;
    position: number[];
    rotation: number;
    scale: number[];
  }> {
    return Array.from(this.placedItems.values()).map((item) => ({
      itemId: item.itemId,
      name: item.name,
      position: item.position.toArray(),
      rotation: item.rotation,
      scale: item.scale.toArray(),
    }));
  }

  get placing(): boolean {
    return this.isPlacing;
  }

  get selected(): PlacedFurniture | null {
    return this.selectedItem;
  }

  dispose() {
    this.stopDragging();
    this.cancelPlacement();
    this.placedItems.forEach((item) => {
      this.furnitureGroup.remove(item.mesh);
    });
    this.placedItems.clear();
    this.modelCache.clear();
    this.scene.remove(this.furnitureGroup);
  }

  private pickItem(clientX: number, clientY: number): PlacedFurniture | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.furnitureGroup.children, true);
    if (intersects.length === 0) {
      return null;
    }

    let obj = intersects[0].object;
    while (obj.parent && obj.parent !== this.furnitureGroup) {
      obj = obj.parent;
    }

    return this.placedItems.get(obj.name) ?? null;
  }

  private getIntersectionOnFloor(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, point)) {
      return point;
    }
    return null;
  }
}
