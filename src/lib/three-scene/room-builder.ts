/**
 * Room Builder
 * Constructs Three.js geometry from room reconstruction data.
 *
 * Creates: floor, walls, ceiling with textures,
 * point cloud visualization, and detected object markers.
 */

import * as THREE from "three";

export interface RoomData {
  dimensions: { width: number; length: number; height: number };
  floor: { vertices: number[][]; uv: number[][] };
  ceiling: { vertices: number[][]; uv: number[][] };
  walls: Array<{
    id: string;
    vertices: number[][];
    normal: number[];
    width: number;
    height: number;
    has_window: boolean;
    has_door: boolean;
    uv: number[][];
  }>;
  point_cloud: number[][];
  point_colors: number[][];
  objects_3d: Array<{
    name: string;
    confidence: number;
    position: number[];
    dimensions: number[];
    bbox: Record<string, number>;
  }>;
  camera: { position: number[]; target: number[] };
  depth_range: { min: number; max: number };
  room_texture?: string;
  depth_map?: string;
}

export interface ThemeConfig {
  name: string;
  wallColor: number;
  floorColor: number;
  ceilingColor: number;
  wallRoughness: number;
  floorRoughness: number;
  ambientIntensity: number;
  accentColor: number;
}

export const THEMES: Record<string, ThemeConfig> = {
  modern: {
    name: "Modern",
    wallColor: 0xf5f5f0,
    floorColor: 0x8b7355,
    ceilingColor: 0xffffff,
    wallRoughness: 0.8,
    floorRoughness: 0.4,
    ambientIntensity: 0.6,
    accentColor: 0x2196f3,
  },
  luxury: {
    name: "Luxury",
    wallColor: 0xf0e6d3,
    floorColor: 0x5c3317,
    ceilingColor: 0xfff8ef,
    wallRoughness: 0.3,
    floorRoughness: 0.2,
    ambientIntensity: 0.5,
    accentColor: 0xd4af37,
  },
  minimal: {
    name: "Minimal",
    wallColor: 0xffffff,
    floorColor: 0xe0e0e0,
    ceilingColor: 0xffffff,
    wallRoughness: 0.9,
    floorRoughness: 0.6,
    ambientIntensity: 0.7,
    accentColor: 0x333333,
  },
  scandinavian: {
    name: "Scandinavian",
    wallColor: 0xfaf9f6,
    floorColor: 0xdeb887,
    ceilingColor: 0xffffff,
    wallRoughness: 0.85,
    floorRoughness: 0.35,
    ambientIntensity: 0.65,
    accentColor: 0x87ceeb,
  },
  classic: {
    name: "Classic",
    wallColor: 0xefe4d0,
    floorColor: 0x6b3a2a,
    ceilingColor: 0xfff5e6,
    wallRoughness: 0.6,
    floorRoughness: 0.3,
    ambientIntensity: 0.45,
    accentColor: 0x8b0000,
  },
};

export class RoomBuilder {
  private scene: THREE.Scene;
  private roomGroup: THREE.Group;
  private pointCloudGroup: THREE.Group;
  private objectMarkersGroup: THREE.Group;
  private roomData: RoomData | null = null;
  private currentTheme: ThemeConfig = THEMES.modern;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.roomGroup = new THREE.Group();
    this.roomGroup.name = "room";
    this.pointCloudGroup = new THREE.Group();
    this.pointCloudGroup.name = "pointCloud";
    this.objectMarkersGroup = new THREE.Group();
    this.objectMarkersGroup.name = "objectMarkers";

    this.scene.add(this.roomGroup);
    this.scene.add(this.pointCloudGroup);
    this.scene.add(this.objectMarkersGroup);
  }

  /**
   * Build room geometry from reconstruction data.
   */
  buildRoom(data: RoomData, theme?: string) {
    this.roomData = data;
    if (theme && THEMES[theme]) {
      this.currentTheme = THEMES[theme];
    }

    this.clearRoom();
    this.buildFloor(data);
    this.buildCeiling(data);
    this.buildWalls(data);
    this.buildPointCloud(data);
    this.buildObjectMarkers(data);
  }

  private clearRoom() {
    [this.roomGroup, this.pointCloudGroup, this.objectMarkersGroup].forEach(
      (group) => {
        while (group.children.length > 0) {
          const child = group.children[0];
          group.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        }
      }
    );
  }

  private buildFloor(data: RoomData) {
    const { width, length } = data.dimensions;

    const geometry = new THREE.PlaneGeometry(width, length);
    geometry.rotateX(-Math.PI / 2);

    // Create a nice floor material
    const material = new THREE.MeshStandardMaterial({
      color: this.currentTheme.floorColor,
      roughness: this.currentTheme.floorRoughness,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Add procedural wood-grain pattern
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base colour
    const baseColor = new THREE.Color(this.currentTheme.floorColor);
    ctx.fillStyle = `#${baseColor.getHexString()}`;
    ctx.fillRect(0, 0, 512, 512);

    // Wood grain lines
    ctx.strokeStyle = `rgba(0, 0, 0, 0.08)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.random() * 4);
      for (let x = 0; x < 512; x += 10) {
        ctx.lineTo(x, i + Math.sin(x * 0.02) * 3 + Math.random() * 2);
      }
      ctx.stroke();
    }

    // Plank gaps
    ctx.strokeStyle = `rgba(0, 0, 0, 0.15)`;
    ctx.lineWidth = 2;
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 2, length / 2);
    material.map = texture;

    const floor = new THREE.Mesh(geometry, material);
    floor.position.set(0, 0, length / 2);
    floor.receiveShadow = true;
    floor.name = "floor";

    this.roomGroup.add(floor);

    // Floor grid helper for spatial reference
    const gridHelper = new THREE.GridHelper(
      Math.max(width, length),
      Math.max(width, length) * 2,
      0x444444,
      0x222222
    );
    gridHelper.position.set(0, 0.001, length / 2);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.roomGroup.add(gridHelper);
  }

  private buildCeiling(data: RoomData) {
    const { width, length, height } = data.dimensions;

    const geometry = new THREE.PlaneGeometry(width, length);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: this.currentTheme.ceilingColor,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const ceiling = new THREE.Mesh(geometry, material);
    ceiling.position.set(0, height, length / 2);
    ceiling.name = "ceiling";

    this.roomGroup.add(ceiling);
  }

  private buildWalls(data: RoomData) {
    const { width, length, height } = data.dimensions;
    const hw = width / 2;
    const theme = this.currentTheme;

    // Create wall texture
    const wallTexture = this.createWallTexture();

    const wallConfigs = [
      {
        // Back wall
        id: "back",
        pos: new THREE.Vector3(0, height / 2, length),
        rot: new THREE.Euler(0, 0, 0),
        size: [width, height] as [number, number],
      },
      {
        // Left wall
        id: "left",
        pos: new THREE.Vector3(-hw, height / 2, length / 2),
        rot: new THREE.Euler(0, Math.PI / 2, 0),
        size: [length, height] as [number, number],
      },
      {
        // Right wall
        id: "right",
        pos: new THREE.Vector3(hw, height / 2, length / 2),
        rot: new THREE.Euler(0, -Math.PI / 2, 0),
        size: [length, height] as [number, number],
      },
      {
        // Front wall (with doorway cutout)
        id: "front",
        pos: new THREE.Vector3(0, height / 2, 0),
        rot: new THREE.Euler(0, Math.PI, 0),
        size: [width, height] as [number, number],
      },
    ];

    for (const config of wallConfigs) {
      const wallData = data.walls.find((w) => w.id === config.id);

      if (config.id === "front" && wallData?.has_door) {
        // Front wall with doorway opening
        this.buildFrontWallWithDoor(config, theme, wallTexture, data);
        continue;
      }

      const geometry = new THREE.PlaneGeometry(config.size[0], config.size[1]);
      const material = new THREE.MeshStandardMaterial({
        color: theme.wallColor,
        roughness: theme.wallRoughness,
        metalness: 0,
        side: THREE.DoubleSide,
        map: wallTexture.clone(),
      });

      const wall = new THREE.Mesh(geometry, material);
      wall.position.copy(config.pos);
      wall.rotation.copy(config.rot);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = `wall_${config.id}`;

      this.roomGroup.add(wall);

      // Add window if detected
      if (wallData?.has_window) {
        this.addWindowToWall(wall, config.size[0], config.size[1]);
      }

      // Add baseboard
      this.addBaseboard(config, theme);
    }

    // Add room texture to back wall if available
    if (data.room_texture) {
      this.applyRoomTexture(data.room_texture, data);
    }
  }

  private buildFrontWallWithDoor(
    config: { id: string; pos: THREE.Vector3; rot: THREE.Euler; size: [number, number] },
    theme: ThemeConfig,
    wallTexture: THREE.CanvasTexture,
    data: RoomData
  ) {
    const [w, h] = config.size;
    const doorWidth = 0.9;
    const doorHeight = 2.1;

    // Create wall shape with door cutout
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h);
    shape.lineTo(-w / 2, h);
    shape.lineTo(-w / 2, 0);

    // Door hole
    const doorHole = new THREE.Path();
    doorHole.moveTo(-doorWidth / 2, 0);
    doorHole.lineTo(doorWidth / 2, 0);
    doorHole.lineTo(doorWidth / 2, doorHeight);
    doorHole.lineTo(-doorWidth / 2, doorHeight);
    doorHole.lineTo(-doorWidth / 2, 0);
    shape.holes.push(doorHole);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
      color: theme.wallColor,
      roughness: theme.wallRoughness,
      metalness: 0,
      side: THREE.DoubleSide,
      map: wallTexture.clone(),
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(config.pos.x, 0, config.pos.z);
    wall.rotation.copy(config.rot);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.name = "wall_front_with_door";

    this.roomGroup.add(wall);

    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.4,
      metalness: 0.1,
    });

    const frameWidth = 0.05;
    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, doorHeight, 0.1),
      frameMaterial
    );
    leftFrame.position.set(-doorWidth / 2 - frameWidth / 2, doorHeight / 2, config.pos.z);
    this.roomGroup.add(leftFrame);

    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, doorHeight, 0.1),
      frameMaterial
    );
    rightFrame.position.set(doorWidth / 2 + frameWidth / 2, doorHeight / 2, config.pos.z);
    this.roomGroup.add(rightFrame);

    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + frameWidth * 2, frameWidth, 0.1),
      frameMaterial
    );
    topFrame.position.set(0, doorHeight + frameWidth / 2, config.pos.z);
    this.roomGroup.add(topFrame);
  }

  private addWindowToWall(
    wall: THREE.Mesh,
    wallWidth: number,
    wallHeight: number
  ) {
    const windowWidth = Math.min(1.2, wallWidth * 0.3);
    const windowHeight = Math.min(1.0, wallHeight * 0.4);

    // Window frame (darker border)
    const frameGeom = new THREE.BoxGeometry(windowWidth + 0.1, windowHeight + 0.1, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.3,
      metalness: 0.4,
    });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(0, 0, 0.03);

    // Window glass (emissive blue tint for sky)
    const glassGeom = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6,
      emissive: 0x87ceeb,
      emissiveIntensity: 0.3,
    });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.set(0, 0, 0.04);

    wall.add(frame);
    wall.add(glass);
  }

  private addBaseboard(
    config: { pos: THREE.Vector3; rot: THREE.Euler; size: [number, number] },
    theme: ThemeConfig
  ) {
    const baseHeight = 0.08;
    const baseDepth = 0.02;

    const geometry = new THREE.BoxGeometry(config.size[0], baseHeight, baseDepth);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });

    const baseboard = new THREE.Mesh(geometry, material);
    baseboard.position.set(config.pos.x, baseHeight / 2, config.pos.z);
    baseboard.rotation.copy(config.rot);

    this.roomGroup.add(baseboard);
  }

  private createWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const baseColor = new THREE.Color(this.currentTheme.wallColor);
    ctx.fillStyle = `#${baseColor.getHexString()}`;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle texture noise
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const alpha = Math.random() * 0.03;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private applyRoomTexture(textureBase64: string, data: RoomData) {
    const loader = new THREE.TextureLoader();
    loader.load(textureBase64, (texture) => {
      // Apply to back wall
      const backWall = this.roomGroup.getObjectByName("wall_back");
      if (backWall && backWall instanceof THREE.Mesh) {
        const material = backWall.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }
    });
  }

  private buildPointCloud(data: RoomData) {
    if (!data.point_cloud || data.point_cloud.length === 0) return;

    const positions = new Float32Array(data.point_cloud.length * 3);
    const colors = new Float32Array(data.point_cloud.length * 3);

    for (let i = 0; i < data.point_cloud.length; i++) {
      const p = data.point_cloud[i];
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];

      if (data.point_colors && data.point_colors[i]) {
        const c = data.point_colors[i];
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });

    const points = new THREE.Points(geometry, material);
    points.name = "roomPointCloud";
    this.pointCloudGroup.add(points);
  }

  private buildObjectMarkers(data: RoomData) {
    if (!data.objects_3d) return;

    for (const obj of data.objects_3d) {
      const [x, y, z] = obj.position;
      const [w, h, d] = obj.dimensions;

      // Wireframe box to show detected object bounds
      const geometry = new THREE.BoxGeometry(
        Math.max(w, 0.1),
        Math.max(h, 0.1),
        Math.max(d, 0.1)
      );
      const edges = new THREE.EdgesGeometry(geometry);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        opacity: 0.5,
        transparent: true,
      });

      const wireframe = new THREE.LineSegments(edges, material);
      wireframe.position.set(x, y, z);
      wireframe.name = `marker_${obj.name}`;
      wireframe.userData = { objectData: obj };

      this.objectMarkersGroup.add(wireframe);

      // Label sprite
      const label = this.createTextSprite(
        `${obj.name} (${(obj.confidence * 100).toFixed(0)}%)`,
        { x, y: y + h / 2 + 0.15, z }
      );
      this.objectMarkersGroup.add(label);
    }
  }

  private createTextSprite(
    text: string,
    position: { x: number; y: number; z: number }
  ): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();

    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 24px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(0.8, 0.2, 1);

    return sprite;
  }

  /**
   * Apply a new theme to the existing room.
   */
  applyTheme(themeName: string) {
    if (!THEMES[themeName] || !this.roomData) return;
    this.currentTheme = THEMES[themeName];
    this.buildRoom(this.roomData, themeName);
  }

  /**
   * Toggle point cloud visibility.
   */
  togglePointCloud(visible: boolean) {
    this.pointCloudGroup.visible = visible;
  }

  /**
   * Toggle object markers visibility.
   */
  toggleObjectMarkers(visible: boolean) {
    this.objectMarkersGroup.visible = visible;
  }

  /**
   * Get room dimensions.
   */
  getDimensions() {
    return this.roomData?.dimensions ?? { width: 4, length: 5, height: 2.8 };
  }

  dispose() {
    this.clearRoom();
    this.scene.remove(this.roomGroup);
    this.scene.remove(this.pointCloudGroup);
    this.scene.remove(this.objectMarkersGroup);
  }
}
