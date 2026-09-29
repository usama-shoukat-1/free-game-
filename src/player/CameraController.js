import * as BABYLON from '@babylonjs/core';
import { GameConfig } from '../config/GameConfig.js';

/**
 * CameraController - Third-Person Follow Camera with Wall Collision Avoidance
 */
export class CameraController {
  /**
   * @param {Object} options
   * @param {BABYLON.Scene} options.scene
   * @param {HTMLCanvasElement} [options.canvas]
   * @param {Object} [options.config]
   * @param {CollisionManager} [options.collisionManager]
   */
  constructor({ scene, canvas = null, config = {}, collisionManager = null }) {
    this.scene = scene;
    this.canvas = canvas;
    this.collisionManager = collisionManager;
    this.config = {
      distance: config.distance ?? GameConfig.camera.distance ?? 4.0,
      height: config.height ?? GameConfig.camera.height ?? 1.6,
      fov: config.fov ?? GameConfig.camera.fov ?? 0.85,
      sensitivity: config.sensitivity ?? GameConfig.camera.sensitivity ?? 0.002,
      smoothSpeed: config.smoothSpeed ?? GameConfig.camera.smoothSpeed ?? 14.0,
      minPitch: config.minPitch ?? -1.2,
      maxPitch: config.maxPitch ?? 1.2,
      shoulderOffset: config.shoulderOffset ?? 0.45
    };

    this.yaw = 0.0;
    this.pitch = 0.2; // Slight downward look
    this.currentDistance = this.config.distance;

    this.camera = new BABYLON.UniversalCamera('MainFollowCamera', new BABYLON.Vector3(0, this.config.height, -this.config.distance), this.scene);
    this.camera.fov = this.config.fov;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 500;
    if (this.scene) {
      this.scene.activeCamera = this.camera;
    }

    this.focusPosition = new BABYLON.Vector3(0, 1.5, 0);
  }

  setCollisionManager(cm) {
    this.collisionManager = cm;
  }

  setYaw(val) {
    this.yaw = val;
  }

  getYaw() {
    return this.yaw;
  }

  setPitch(val) {
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, val));
  }

  getPitch() {
    return this.pitch;
  }

  getForwardVector() {
    return new BABYLON.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    ).normalize();
  }

  getRightVector() {
    return new BABYLON.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    ).normalize();
  }

  handlePointerMove(deltaX, deltaY) {
    this.yaw += deltaX * this.config.sensitivity;
    this.pitch -= deltaY * this.config.sensitivity;
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
  }

  handleLookInput(delta) {
    if (!delta) return;
    this.yaw += (delta.x || 0) * this.config.sensitivity;
    this.pitch += (delta.y || 0) * this.config.sensitivity;
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
  }

  update(target, deltaTime = 0.016) {
    if (!target) return;
    const dt = Math.min(deltaTime, 0.1);

    // 1. Focus Point at player chest/head level
    let targetPos = null;
    if (target instanceof BABYLON.Vector3) {
      targetPos = target;
    } else if (target.position) {
      targetPos = target.position;
    } else if (target.rootNode) {
      targetPos = target.rootNode.position;
    } else {
      targetPos = BABYLON.Vector3.Zero();
    }

    const targetFocus = new BABYLON.Vector3(
      targetPos.x,
      targetPos.y + this.config.height,
      targetPos.z
    );

    // Smoothly interpolate focus position
    this.focusPosition = BABYLON.Vector3.Lerp(this.focusPosition, targetFocus, Math.min(1.0, dt * this.config.smoothSpeed));

    // 2. Spherical Orbit offset with shoulder offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const right = this.getRightVector();
    const shoulderVec = right.scale(this.config.shoulderOffset);

    // Ideal camera position without collision
    const idealCamPos = new BABYLON.Vector3(
      this.focusPosition.x - (sinYaw * cosPitch * this.config.distance) + shoulderVec.x,
      this.focusPosition.y + (sinPitch * this.config.distance),
      this.focusPosition.z - (cosYaw * cosPitch * this.config.distance) + shoulderVec.z
    );

    // 3. Collision avoidance raycast probe
    let finalCamPos = idealCamPos;
    if (this.collisionManager) {
      finalCamPos = this.collisionManager.resolveCameraPosition(
        this.focusPosition,
        idealCamPos,
        0.25, // Probe radius
        0.8   // Min standoff distance from player
      );
    }

    // 4. Smooth Camera Positioning
    this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, finalCamPos, Math.min(1.0, dt * 18.0));
    this.camera.setTarget(this.focusPosition.add(shoulderVec.scale(0.5)));
  }

  dispose() {
    if (this.camera) this.camera.dispose();
  }
}
