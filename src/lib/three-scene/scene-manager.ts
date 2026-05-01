/**
 * Three.js Scene Manager
 * Core 3D rendering engine for the room walkthrough experience.
 *
 * Manages: renderer, scene, camera, animation loop, resize handling.
 */

import * as THREE from "three";

export interface SceneManagerOptions {
  container: HTMLElement;
  antialias?: boolean;
  shadows?: boolean;
  pixelRatio?: number;
}

/**
 * Check if WebGL is available in the current browser.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private container: HTMLElement;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private updateCallbacks: Array<(delta: number) => void> = [];
  private isDisposed = false;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.clock = new THREE.Clock();

    // Check WebGL availability before attempting to create renderer
    if (!isWebGLAvailable()) {
      throw new Error(
        "WebGL is not available. Please enable hardware acceleration in your browser settings, or try a different browser."
      );
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 15, 30);

    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.05, 100);
    this.camera.position.set(0, 1.6, 0.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      powerPreference: "high-performance",
      alpha: false,
    });

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));

    if (options.shadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(this.container);
  }

  onUpdate(callback: (delta: number) => void) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter((cb) => cb !== callback);
    };
  }

  start() {
    if (this.animationId !== null) return;
    this.clock.start();
    this.animate();
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }

  private animate = () => {
    if (this.isDisposed) return;
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    for (const cb of this.updateCallbacks) {
      cb(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    if (this.isDisposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * Take a screenshot of the current scene.
   */
  screenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }

  dispose() {
    this.isDisposed = true;
    this.stop();
    this.updateCallbacks = [];

    // Remove canvas
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();

    // Dispose all objects in scene
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
