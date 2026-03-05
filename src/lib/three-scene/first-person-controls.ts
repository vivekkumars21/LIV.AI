/**
 * First-Person Controls
 * WASD movement + mouse look for room walkthrough.
 *
 * Features:
 * - Pointer lock for mouse look
 * - WASD / Arrow key movement
 * - Scroll wheel for speed adjustment
 * - Collision detection with room bounds
 * - Smooth acceleration/deceleration
 */

import * as THREE from "three";

export interface FirstPersonOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  moveSpeed?: number;
  lookSpeed?: number;
  eyeHeight?: number;
  roomBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export class FirstPersonControls {
  public enabled = true;
  public moveSpeed: number;
  public lookSpeed: number;
  public eyeHeight: number;
  public roomBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null;

  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;

  private isLocked = false;
  private _disposed = false;

  // Bound event handlers for cleanup
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;
  private _onMouseMove: (e: MouseEvent) => void;
  private _onClick: () => void;
  private _onPointerlockChange: () => void;
  private _onWheel: (e: WheelEvent) => void;

  constructor(options: FirstPersonOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.moveSpeed = options.moveSpeed ?? 3.0;
    this.lookSpeed = options.lookSpeed ?? 0.002;
    this.eyeHeight = options.eyeHeight ?? 1.6;
    this.roomBounds = options.roomBounds ?? null;

    // Bind handlers
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onClick = this.onClick.bind(this);
    this._onPointerlockChange = this.onPointerlockChange.bind(this);
    this._onWheel = this.onWheel.bind(this);

    this.setupListeners();
  }

  private setupListeners() {
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("mousemove", this._onMouseMove);
    this.domElement.addEventListener("click", this._onClick);
    document.addEventListener("pointerlockchange", this._onPointerlockChange);
    this.domElement.addEventListener("wheel", this._onWheel, { passive: false });
  }

  private onClick() {
    if (!this.enabled) return;
    this.domElement.requestPointerLock();
  }

  private onPointerlockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isLocked || !this.enabled) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * this.lookSpeed;
    this.euler.x -= movementY * this.lookSpeed;

    // Clamp vertical looking
    this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return;

    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = true;
        break;
      case "Space":
        this.moveUp = true;
        event.preventDefault();
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = true;
        break;
      case "Escape":
        if (this.isLocked) {
          document.exitPointerLock();
        }
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = false;
        break;
      case "Space":
        this.moveUp = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = false;
        break;
    }
  }

  private onWheel(event: WheelEvent) {
    if (!this.enabled) return;
    event.preventDefault();

    // Adjust move speed with scroll
    this.moveSpeed = Math.max(0.5, Math.min(10, this.moveSpeed - event.deltaY * 0.001));
  }

  /**
   * Call this in the animation loop.
   */
  update(delta: number) {
    if (!this.enabled) return;

    const decel = 8.0;
    this.velocity.x -= this.velocity.x * decel * delta;
    this.velocity.z -= this.velocity.z * decel * delta;
    this.velocity.y -= this.velocity.y * decel * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize();

    const speed = this.moveSpeed * delta * 50;

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * speed;
    }
    if (this.moveUp || this.moveDown) {
      this.velocity.y += this.direction.y * speed;
    }

    // Apply movement in camera's forward direction
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, forward).normalize();

    const moveX = right.x * this.velocity.x * delta + forward.x * this.velocity.z * delta;
    const moveZ = right.z * this.velocity.x * delta + forward.z * this.velocity.z * delta;
    const moveY = this.velocity.y * delta;

    let newX = this.camera.position.x + moveX;
    let newY = this.camera.position.y + moveY;
    let newZ = this.camera.position.z + moveZ;

    // Collision with room bounds
    if (this.roomBounds) {
      const margin = 0.3;
      newX = Math.max(this.roomBounds.minX + margin, Math.min(this.roomBounds.maxX - margin, newX));
      newZ = Math.max(this.roomBounds.minZ + margin, Math.min(this.roomBounds.maxZ - margin, newZ));
    }

    // Keep at eye height (with slight ability to look up/down by crouching)
    newY = Math.max(0.8, Math.min(this.eyeHeight + 0.5, newY));

    this.camera.position.set(newX, newY, newZ);
  }

  /**
   * Set room bounds for collision detection.
   */
  setBounds(minX: number, maxX: number, minZ: number, maxZ: number) {
    this.roomBounds = { minX, maxX, minZ, maxZ };
  }

  /**
   * Teleport camera to a position.
   */
  teleport(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  /**
   * Look at a target point.
   */
  lookAt(x: number, y: number, z: number) {
    this.camera.lookAt(x, y, z);
    this.euler.setFromQuaternion(this.camera.quaternion);
  }

  get locked(): boolean {
    return this.isLocked;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;

    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    this.domElement.removeEventListener("click", this._onClick);
    document.removeEventListener("pointerlockchange", this._onPointerlockChange);
    this.domElement.removeEventListener("wheel", this._onWheel);

    if (this.isLocked) {
      document.exitPointerLock();
    }
  }
}
