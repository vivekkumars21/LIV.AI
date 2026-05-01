/**
 * Orbit Controls
 * Rotating camera around the room for inspection
 */

import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface OrbitControlsOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  target?: THREE.Vector3;
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  enablePan?: boolean;
  panSpeed?: number;
}

export class OrbitControls {
  public enabled = true;
  private controls: ThreeOrbitControls;
  private _disposed = false;

  constructor(options: OrbitControlsOptions) {
    this.controls = new ThreeOrbitControls(options.camera, options.domElement);

    // Apply options
    if (options.target) {
      this.controls.target.copy(options.target);
    }

    this.controls.enableDamping = options.enableDamping ?? true;
    this.controls.dampingFactor = options.dampingFactor ?? 0.05;
    this.controls.minDistance = options.minDistance ?? 0.5;
    this.controls.maxDistance = options.maxDistance ?? 20;
    this.controls.minPolarAngle = options.minPolarAngle ?? 0;
    this.controls.maxPolarAngle = options.maxPolarAngle ?? Math.PI / 2;
    this.controls.enablePan = options.enablePan ?? true;
    this.controls.panSpeed = options.panSpeed ?? 0.8;

    // Mouse buttons: left to rotate, right to pan, middle to zoom
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  /**
   * Call this in the animation loop.
   */
  update() {
    if (!this.enabled) return;
    this.controls.update();
  }

  /**
   * Set the target point for the camera to orbit around.
   */
  setTarget(x: number, y: number, z: number) {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  /**
   * Reset the camera to a default position.
   */
  reset() {
    this.controls.reset();
  }

  /**
   * Enable or disable the controls.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.controls.enabled = enabled;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.controls.dispose();
  }
}
