/**
 * Lighting Manager
 * Realistic lighting system with HDRI environment, soft shadows,
 * and theme-aware ambient/directional lights.
 */

import * as THREE from "three";

export interface LightingOptions {
  scene: THREE.Scene;
  ambientIntensity?: number;
  sunIntensity?: number;
  shadows?: boolean;
}

export class LightingManager {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private hemisphereLight: THREE.HemisphereLight;
  private directionalLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private pointLights: THREE.PointLight[] = [];

  constructor(options: LightingOptions) {
    this.scene = options.scene;

    // Ambient light — base illumination
    this.ambientLight = new THREE.AmbientLight(
      0xffffff,
      options.ambientIntensity ?? 0.4
    );
    this.scene.add(this.ambientLight);

    // Hemisphere light — sky/ground gradient
    this.hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // sky colour
      0x8b7355, // ground colour
      0.3
    );
    this.scene.add(this.hemisphereLight);

    // Main directional light (sun simulation)
    this.directionalLight = new THREE.DirectionalLight(
      0xfff5e6,
      options.sunIntensity ?? 1.0
    );
    this.directionalLight.position.set(3, 8, 2);
    this.directionalLight.target.position.set(0, 0, 3);

    if (options.shadows !== false) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.1;
      this.directionalLight.shadow.camera.far = 30;
      this.directionalLight.shadow.camera.left = -10;
      this.directionalLight.shadow.camera.right = 10;
      this.directionalLight.shadow.camera.top = 10;
      this.directionalLight.shadow.camera.bottom = -10;
      this.directionalLight.shadow.bias = -0.001;
      this.directionalLight.shadow.normalBias = 0.04;
      this.directionalLight.shadow.radius = 3;
    }

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    // Fill light — softer, from opposite side
    this.fillLight = new THREE.DirectionalLight(0xb4c8e6, 0.3);
    this.fillLight.position.set(-4, 5, -2);
    this.scene.add(this.fillLight);
  }

  /**
   * Set up environment map for PBR reflections.
   */
  setupEnvironment() {
    // Create a simple gradient environment map
    const pmremGenerator = new THREE.PMREMGenerator(
      (this.scene as unknown as { renderer?: THREE.WebGLRenderer }).renderer ??
      undefined!
    );

    // Create sky gradient cubemap texture
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.4, "#B4D8E7");
    gradient.addColorStop(0.6, "#E8E0D0");
    gradient.addColorStop(1, "#8B7355");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment = texture;
  }

  /**
   * Add ceiling lights to the room.
   */
  addCeilingLights(
    roomWidth: number,
    roomLength: number,
    roomHeight: number,
    count: number = 2
  ) {
    // Remove existing point lights
    this.pointLights.forEach((l) => this.scene.remove(l));
    this.pointLights = [];

    const spacing = roomLength / (count + 1);

    for (let i = 0; i < count; i++) {
      const light = new THREE.PointLight(0xfff0dd, 0.6, 8, 1.5);
      light.position.set(0, roomHeight - 0.1, spacing * (i + 1));
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.radius = 2;

      this.scene.add(light);
      this.pointLights.push(light);

      // Visible light fixture
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.03, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff5e0,
          emissiveIntensity: 0.5,
          roughness: 0.2,
        })
      );
      fixture.position.copy(light.position);
      fixture.position.y = roomHeight - 0.015;
      this.scene.add(fixture);
    }
  }

  /**
   * Update lighting for a theme.
   */
  applyTheme(theme: {
    ambientIntensity: number;
    wallColor: number;
    accentColor: number;
  }) {
    this.ambientLight.intensity = theme.ambientIntensity;

    // Adjust hemisphere light to match theme
    const wallColor = new THREE.Color(theme.wallColor);
    this.hemisphereLight.groundColor.copy(wallColor);
  }

  /**
   * Set time of day lighting.
   */
  setTimeOfDay(hour: number) {
    // 6-20 hours mapped to sun position and colour
    const normalised = (hour - 6) / 14; // 0 at 6am, 1 at 8pm

    // Sun position arc
    const angle = normalised * Math.PI;
    this.directionalLight.position.set(
      Math.cos(angle) * 8,
      Math.sin(angle) * 8 + 2,
      3
    );

    // Sun colour: warm at sunrise/sunset, white at noon
    const warmth = 1 - Math.abs(normalised - 0.5) * 2; // 0 at noon, 1 at edges
    const sunColor = new THREE.Color().lerpColors(
      new THREE.Color(0xffdab0), // warm
      new THREE.Color(0xffffff), // neutral
      1 - warmth * 0.5
    );
    this.directionalLight.color.copy(sunColor);

    // Intensity: lower at edges, higher at noon
    const intensity = 0.5 + (1 - warmth) * 0.8;
    this.directionalLight.intensity = intensity;

    // Ambient: brighter at noon
    this.ambientLight.intensity = 0.3 + (1 - warmth) * 0.3;
  }

  dispose() {
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.hemisphereLight);
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.directionalLight.target);
    this.scene.remove(this.fillLight);
    this.pointLights.forEach((l) => this.scene.remove(l));

    this.ambientLight.dispose();
    this.hemisphereLight.dispose();
    this.directionalLight.dispose();
    this.fillLight.dispose();
    this.pointLights.forEach((l) => l.dispose());
  }
}
