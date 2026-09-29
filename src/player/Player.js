import * as BABYLON from '@babylonjs/core';
import { GameConfig } from '../config/GameConfig.js';

/**
 * Player.js - Core Character Entity & Locomotion
 * Supports realistic human survivor model presentation, smooth locomotion,
 * physics-decoupled collision resolution with wall sliding and step climbing,
 * jumping, crouch scaling, and state serialization.
 */
export class Player {
  /**
   * @param {Object} [options]
   * @param {BABYLON.Scene} [options.scene]
   * @param {Object} [options.config]
   * @param {CollisionManager} [options.collisionManager]
   */
  constructor({ scene = null, config = {}, collisionManager = null } = {}) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.config = {
      walkSpeed: config.walkSpeed ?? GameConfig.player.walkSpeed,
      runSpeed: config.runSpeed ?? GameConfig.player.runSpeed,
      crouchSpeed: config.crouchSpeed ?? GameConfig.player.crouchSpeed,
      jumpForce: config.jumpForce ?? GameConfig.player.jumpForce,
      gravity: config.gravity ?? GameConfig.player.gravity,
      height: config.height ?? GameConfig.player.height,
      crouchHeight: config.crouchHeight ?? GameConfig.player.crouchHeight,
      radius: config.radius ?? GameConfig.player.radius,
      acceleration: config.acceleration ?? GameConfig.player.acceleration,
      deceleration: config.deceleration ?? GameConfig.player.deceleration,
      maxHealth: config.maxHealth ?? GameConfig.player.maxHealth
    };

    this.position = new BABYLON.Vector3(0, 0, 0);
    this.velocity = new BABYLON.Vector3(0, 0, 0);
    this.facingYaw = 0.0;
    this.groundY = 0.0;

    this.health = this.config.maxHealth;
    this.maxHealth = this.config.maxHealth;
    this.isGrounded = true;
    this.isJumping = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isDead = false;

    if (this.scene) {
      this.createVisualMesh();
    }
  }

  setCollisionManager(cm) {
    this.collisionManager = cm;
  }

  /**
   * Creates realistic human survivor character mesh hierarchy (Reference 03)
   */
  createVisualMesh() {
    this.rootNode = new BABYLON.TransformNode('PlayerRoot', this.scene);
    this.rootNode.position.copyFrom(this.position);

    // Collision capsule placeholder (for bounding and crouch scaling)
    this.bodyMesh = BABYLON.MeshBuilder.CreateCapsule('PlayerCapsule', {
      height: this.config.height,
      radius: this.config.radius,
      tessellation: 16
    }, this.scene);
    this.bodyMesh.parent = this.rootNode;
    this.bodyMesh.position.y = this.config.height / 2;

    // Tactical Survivor PBR Materials
    const matJacket = new BABYLON.PBRMaterial('mat_player_jacket', this.scene);
    matJacket.albedoColor = new BABYLON.Color3(0.22, 0.26, 0.22); // Olive/charcoal tactical jacket
    matJacket.roughness = 0.85;

    const matPants = new BABYLON.PBRMaterial('mat_player_pants', this.scene);
    matPants.albedoColor = new BABYLON.Color3(0.14, 0.16, 0.18); // Dark cargo pants
    matPants.roughness = 0.9;

    const matGear = new BABYLON.PBRMaterial('mat_player_gear', this.scene);
    matGear.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.12); // Tactical backpack & webbing
    matGear.roughness = 0.8;

    const matSkin = new BABYLON.PBRMaterial('mat_player_skin', this.scene);
    matSkin.albedoColor = new BABYLON.Color3(0.78, 0.6, 0.5); // Natural skin tone
    matSkin.roughness = 0.7;

    // Visual Character Hierarchy
    this.charModel = new BABYLON.TransformNode('CharacterVisualModel', this.scene);
    this.charModel.parent = this.rootNode;

    // Torso (Jacket)
    const torso = BABYLON.MeshBuilder.CreateBox('char_torso', { width: 0.55, height: 0.65, depth: 0.32 }, this.scene);
    torso.position = new BABYLON.Vector3(0, 1.25, 0);
    torso.parent = this.charModel;
    torso.material = matJacket;

    // Tactical Backpack (Mounted on upper back)
    const backpack = BABYLON.MeshBuilder.CreateBox('char_backpack', { width: 0.42, height: 0.48, depth: 0.22 }, this.scene);
    backpack.position = new BABYLON.Vector3(0, 1.28, -0.22);
    backpack.parent = this.charModel;
    backpack.material = matGear;

    // Head & Tactical Cap
    const head = BABYLON.MeshBuilder.CreateSphere('char_head', { diameter: 0.28, segments: 12 }, this.scene);
    head.position = new BABYLON.Vector3(0, 1.7, 0);
    head.parent = this.charModel;
    head.material = matSkin;

    const cap = BABYLON.MeshBuilder.CreateCylinder('char_cap', { diameter: 0.31, height: 0.1, tessellation: 12 }, this.scene);
    cap.position = new BABYLON.Vector3(0, 1.8, -0.02);
    cap.parent = this.charModel;
    cap.material = matGear;

    // Pelvis & Belt
    const pelvis = BABYLON.MeshBuilder.CreateBox('char_pelvis', { width: 0.46, height: 0.2, depth: 0.28 }, this.scene);
    pelvis.position = new BABYLON.Vector3(0, 0.88, 0);
    pelvis.parent = this.charModel;
    pelvis.material = matPants;

    // Legs
    [-0.14, 0.14].forEach((lx, idx) => {
      const leg = BABYLON.MeshBuilder.CreateBox(`char_leg_${idx}`, { width: 0.18, height: 0.78, depth: 0.2 }, this.scene);
      leg.position = new BABYLON.Vector3(lx, 0.42, 0);
      leg.parent = this.charModel;
      leg.material = matPants;

      const boot = BABYLON.MeshBuilder.CreateBox(`char_boot_${idx}`, { width: 0.2, height: 0.18, depth: 0.3 }, this.scene);
      boot.position = new BABYLON.Vector3(lx, 0.09, 0.04);
      boot.parent = this.charModel;
      boot.material = matGear;
    });

    // Arms
    [-0.34, 0.34].forEach((ax, idx) => {
      const arm = BABYLON.MeshBuilder.CreateBox(`char_arm_${idx}`, { width: 0.14, height: 0.62, depth: 0.15 }, this.scene);
      arm.position = new BABYLON.Vector3(ax, 1.25, 0.02);
      arm.parent = this.charModel;
      arm.material = matJacket;
    });

    // Hide collision capsule from visual rendering
    this.bodyMesh.visibility = 0.0;
  }

  update(controller, cameraController = null, deltaTime = 0.016, enemyManager = null, audioSystem = null) {
    if (this.isDead || !controller) return;
    const dt = Math.min(deltaTime, 0.1);

    // 1. Crouch State
    const wantsCrouch = controller.isCrouchActive ? controller.isCrouchActive() : Boolean(controller.isCrouching);
    if (wantsCrouch !== this.isCrouching) {
      this.isCrouching = wantsCrouch;
      if (this.bodyMesh) {
        this.bodyMesh.scaling.y = this.isCrouching ? (this.config.crouchHeight / this.config.height) : 1.0;
        this.bodyMesh.position.y = this.isCrouching ? (this.config.crouchHeight / 2) : (this.config.height / 2);
      }
      if (this.charModel) {
        this.charModel.scaling.y = this.isCrouching ? (this.config.crouchHeight / this.config.height) : 1.0;
      }
    }

    // 2. Sprint State
    const wantsSprint = controller.isSprintActive ? controller.isSprintActive() : Boolean(controller.isSprinting);
    this.isSprinting = wantsSprint && !this.isCrouching;

    // 3. Movement Input Vector
    const moveInput = controller.getMoveInput ? controller.getMoveInput() : { x: 0, z: 0 };
    const hasMoveInput = (moveInput.x !== 0 || moveInput.z !== 0);

    let speed = this.config.walkSpeed;
    if (this.isCrouching) {
      speed = this.config.crouchSpeed;
    } else if (this.isSprinting) {
      speed = this.config.runSpeed;
    }

    let targetMoveDir = new BABYLON.Vector3(0, 0, 0);
    if (hasMoveInput) {
      if (cameraController && typeof cameraController.getForwardVector === 'function') {
        const forward = cameraController.getForwardVector();
        const right = cameraController.getRightVector();
        targetMoveDir.addInPlace(forward.scale(moveInput.z));
        targetMoveDir.addInPlace(right.scale(moveInput.x));
      } else {
        targetMoveDir.set(moveInput.x, 0, moveInput.z);
      }
      targetMoveDir.normalize();

      this.facingYaw = Math.atan2(targetMoveDir.x, targetMoveDir.z);
      if (this.rootNode) {
        this.rootNode.rotation.y = this.facingYaw;
      }
    }

    // 4. Acceleration & Deceleration
    const targetVelX = targetMoveDir.x * speed;
    const targetVelZ = targetMoveDir.z * speed;
    const accelRate = hasMoveInput ? this.config.acceleration : this.config.deceleration;
    const lerpFactor = Math.min(1.0, dt * accelRate);

    this.velocity.x += (targetVelX - this.velocity.x) * lerpFactor;
    this.velocity.z += (targetVelZ - this.velocity.z) * lerpFactor;

    // 5. Jump
    const jumpRequested = controller.consumeJump ? controller.consumeJump() : (controller.consumeTrigger ? controller.consumeTrigger('jump') : false);
    if (jumpRequested && this.isGrounded) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
      if (audioSystem && typeof audioSystem.playJump === 'function') audioSystem.playJump();
    }

    // 6. Apply Gravity
    this.velocity.y += this.config.gravity * dt;

    // 7. Calculate Target Position
    const desiredPos = new BABYLON.Vector3(
      this.position.x + this.velocity.x * dt,
      this.position.y + this.velocity.y * dt,
      this.position.z + this.velocity.z * dt
    );

    // 8. Physical Collision & Step Resolution
    if (this.collisionManager) {
      const currentHeight = this.isCrouching ? this.config.crouchHeight : this.config.height;
      const resolved = this.collisionManager.resolveMovement(
        this.position,
        desiredPos,
        this.config.radius,
        currentHeight,
        0.35 // Max climbable step height
      );

      this.position.x = resolved.position.x;
      this.position.z = resolved.position.z;

      if (resolved.collidedX) this.velocity.x = 0;
      if (resolved.collidedZ) this.velocity.z = 0;

      // Ground height elevation check
      const groundAtPos = this.collisionManager.getGroundHeight(this.position.x, this.position.z, this.position.y + 0.5);
      this.groundY = groundAtPos;

      if (desiredPos.y <= this.groundY) {
        this.position.y = this.groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.position.y = desiredPos.y;
        this.isGrounded = false;
      }
    } else {
      // Fallback baseline collision (ground plane at groundY)
      this.position.x = desiredPos.x;
      this.position.z = desiredPos.z;

      if (desiredPos.y <= this.groundY) {
        this.position.y = this.groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.position.y = desiredPos.y;
        this.isGrounded = false;
      }
    }

    if (this.rootNode) {
      this.rootNode.position.copyFrom(this.position);
    }
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = (y <= this.groundY);
    if (this.rootNode) {
      this.rootNode.position.copyFrom(this.position);
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.isDead = true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  serialize() {
    return {
      position: [this.position.x, this.position.y, this.position.z],
      health: this.health,
      isCrouching: this.isCrouching
    };
  }

  deserialize(data) {
    if (!data) return;
    if (Array.isArray(data.position) && data.position.length === 3) {
      this.setPosition(data.position[0], data.position[1], data.position[2]);
    }
    if (typeof data.health === 'number') this.health = data.health;
    if (typeof data.isCrouching === 'boolean') {
      this.isCrouching = data.isCrouching;
      if (this.bodyMesh) {
        this.bodyMesh.scaling.y = this.isCrouching ? (this.config.crouchHeight / this.config.height) : 1.0;
        this.bodyMesh.position.y = this.isCrouching ? (this.config.crouchHeight / 2) : (this.config.height / 2);
      }
      if (this.charModel) {
        this.charModel.scaling.y = this.isCrouching ? (this.config.crouchHeight / this.config.height) : 1.0;
      }
    }
  }

  dispose() {
    if (this.rootNode) this.rootNode.dispose();
  }
}
