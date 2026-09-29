import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { GameConfig } from '../config/GameConfig.js';
import { InputManager } from '../input/InputManager.js';
import { AudioSystem } from '../audio/AudioSystem.js';
import { CollisionManager } from '../world/CollisionManager.js';
import { EnvironmentBuilder } from '../world/EnvironmentBuilder.js';
import { AssetPipelineLoader } from '../assets/AssetRegistry.js';
import { Player } from '../player/Player.js';
import { CameraController } from '../player/CameraController.js';
import { InteractionSystem } from '../interaction/InteractionSystem.js';
import { Interactable } from '../interaction/Interactable.js';
import { QuestManager } from '../quests/QuestManager.js';
import { SaveManager } from '../save/SaveManager.js';
import { DebugOverlay } from '../debug/DebugOverlay.js';
import { HUD } from '../ui/HUD.js';

/**
 * GameManager.js - Master Gameplay Coordinator (Phase 2 Foundation)
 * Orchestrates Babylon Engine, Scene, Collision Manager, Environment,
 * Character, Camera with Collision Avoidance, Interaction, Quests, Save/Load, and HUD.
 */
export class GameManager {
  /**
   * @param {Object} [options]
   * @param {HTMLCanvasElement} [options.canvas]
   * @param {BABYLON.Engine} [options.engine]
   * @param {BABYLON.Scene} [options.scene]
   * @param {boolean} [options.headless=false]
   */
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.isHeadless = Boolean(options.headless);
    this.customEngine = options.engine || null;
    this.customScene = options.scene || null;

    // Core Subsystems
    this.engine = null;
    this.scene = null;
    this.collisionManager = null;
    this.assetLoader = null;
    this.environmentBuilder = null;
    this.inputManager = null;
    this.audioSystem = null;
    this.player = null;
    this.cameraController = null;
    this.interactionSystem = null;
    this.questManager = null;
    this.saveManager = null;

    // UI Layers
    this.hud = null;
    this.debugOverlay = null;

    // Interactive Objects
    this.terminal = null;

    // Lifecycle
    this.isRunning = false;
    this.isInitialized = false;
    this.lastFrameTime = performance.now();
    this.currentQuality = GameConfig.quality.current;
  }

  async init() {
    if (this.isInitialized) return;

    // 1. Initialize Babylon.js Engine
    if (this.customEngine) {
      this.engine = this.customEngine;
    } else if (this.isHeadless) {
      this.engine = new BABYLON.NullEngine();
    } else if (this.canvas) {
      this.engine = new BABYLON.Engine(this.canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } else {
      throw new Error('GameManager requires a canvas or custom engine');
    }

    // 2. Initialize Scene
    this.scene = this.customScene || new BABYLON.Scene(this.engine);

    // 3. Audio & Input Systems
    this.audioSystem = new AudioSystem();
    this.inputManager = new InputManager({ canvas: this.canvas });

    // 4. Collision Subsystem
    this.collisionManager = new CollisionManager(this.scene);

    // 5. Asset Pipeline Loader
    this.assetLoader = new AssetPipelineLoader(this.scene, this.collisionManager);

    // 6. Build Realistic Modern Blackout Micro-Environment
    this.environmentBuilder = new EnvironmentBuilder(this.scene, this.collisionManager);
    this.environmentBuilder.buildEnvironment();

    // 7. Initialize Player & Follow Camera with Collision Integration
    this.player = new Player({
      scene: this.scene,
      collisionManager: this.collisionManager
    });
    // Start player in the street near the sidewalk/safehouse entrance
    this.player.setPosition(0, 0.05, 0);

    this.cameraController = new CameraController({
      scene: this.scene,
      canvas: this.canvas,
      collisionManager: this.collisionManager
    });
    if (this.scene && this.cameraController.camera) {
      this.scene.activeCamera = this.cameraController.camera;
    }
    this.cameraController.update(this.player, 0.016);

    // 8. Interaction System & Interactive Safehouse Terminal
    this.interactionSystem = new InteractionSystem();
    this.setupInteractables();

    // 9. Quest & Save Managers
    this.questManager = new QuestManager();
    this.questManager.startQuest('test_quest');
    this.saveManager = new SaveManager();

    // 10. Initialize In-Game HUD & Developer Overlay (Browser Only)
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && !this.isHeadless) {
      this.hud = new HUD();
      this.debugOverlay = new DebugOverlay({
        onQualityChange: (preset) => this.setQualityPreset(preset),
        onSave: () => this.saveGame(),
        onLoad: () => this.loadGame()
      });

      this.interactionSystem.onPromptChange = (text) => {
        if (this.hud) this.hud.setPrompt(text);
      };
    }

    this.isInitialized = true;
    console.log('[GameManager] Phase 2 Foundation initialized successfully.');
  }

  setupInteractables() {
    if (!this.scene) return;

    // Interactive Safehouse Terminal inside Safehouse at (-13.0, 0.9, -14.0)
    const termMesh = BABYLON.MeshBuilder.CreateBox('TerminalMesh', { width: 0.8, height: 0.8, depth: 0.5 }, this.scene);
    termMesh.position.set(-13.0, 0.9, -14.0);

    const termMat = new BABYLON.StandardMaterial('TerminalMat', this.scene);
    termMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.6);
    termMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.1); // Warm emergency amber glow
    termMesh.material = termMat;

    this.terminal = new Interactable({
      id: 'proof_terminal',
      name: 'Safehouse Terminal',
      promptText: 'Press [E] to Access Safehouse Emergency Radio',
      range: 3.0,
      mesh: termMesh,
      position: new BABYLON.Vector3(-13.0, 0.9, -14.0),
      onInteract: () => {
        console.log('[Safehouse Terminal] Radio terminal accessed successfully.');
        if (this.audioSystem) this.audioSystem.playDoor();
        const active = this.questManager.getActiveQuest();
        if (active && active.state.currentObjectiveIndex === 0) {
          this.questManager.advanceObjective(active.definition.id);
        }
        return true;
      }
    });

    this.interactionSystem.register(this.terminal);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    if (this.engine) {
      this.engine.runRenderLoop(() => {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.update(deltaTime);
        this.render();
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onResize);
    }
  }

  _onResize = () => {
    if (this.engine) this.engine.resize();
  };

  /**
   * Main game coordinator update step
   * @param {number} deltaTime
   */
  update(deltaTime = 0.016) {
    if (!this.isInitialized) return;

    // 1. Process Mouse Look Input
    const lookDelta = this.inputManager.consumeLookDelta();
    if (lookDelta.x !== 0 || lookDelta.y !== 0) {
      this.cameraController.handlePointerMove(lookDelta.x, lookDelta.y);
    }

    // 2. Update Player Movement, Jump, Crouch & Collision
    this.player.update(this.inputManager, this.cameraController, deltaTime, null, this.audioSystem);

    // 3. Update Follow Camera with Collision Avoidance
    this.cameraController.update(this.player, deltaTime);

    // 4. Proximity Interaction Check & Activation
    this.interactionSystem.update(this.player);

    if (this.inputManager.consumeTrigger('interact')) {
      this.interactionSystem.triggerInteraction(this.player);
    }

    // 5. Update HUD
    if (this.hud) {
      const activeQuest = this.questManager.getActiveQuest();
      this.hud.update({
        objective: activeQuest ? activeQuest.definition.getObjective(activeQuest.state.currentObjectiveIndex) : 'Explore the blackout perimeter'
      });
    }

    // 6. Update Telemetry Overlay
    if (this.debugOverlay) {
      const activeQuest = this.questManager.getActiveQuest();
      let stateLabel = 'Grounded';
      if (!this.player.isGrounded) stateLabel = 'Airborne';
      else if (this.player.isCrouching) stateLabel = 'Crouching';
      else if (this.player.isSprinting) stateLabel = 'Sprinting';

      this.debugOverlay.update({
        fps: this.engine ? this.engine.getFps().toFixed(0) : 60,
        frameTime: deltaTime * 1000,
        playerPos: this.player.position,
        playerState: stateLabel,
        questTitle: activeQuest ? activeQuest.definition.title : 'None',
        objectiveText: activeQuest ? activeQuest.definition.getObjective(activeQuest.state.currentObjectiveIndex) : '--'
      });
    }
  }

  render() {
    if (this.scene) {
      try {
        this.scene.render();
      } catch (err) {
        console.error('[GameManager Render Error]', err);
      }
    }
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.engine) this.engine.stopRenderLoop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }
  }

  saveGame() {
    if (!this.saveManager) return;
    const saveState = {
      player: this.player.serialize(),
      quest: this.questManager.serialize()
    };
    this.saveManager.save(saveState);
    console.log('[SaveManager] Game state saved successfully.');
  }

  loadGame() {
    if (!this.saveManager) return;
    const saveState = this.saveManager.load();
    if (saveState) {
      if (saveState.player) this.player.deserialize(saveState.player);
      if (saveState.quest) this.questManager.deserialize(saveState.quest);
      console.log('[SaveManager] Game state restored successfully.');
    }
  }

  setQualityPreset(presetName) {
    if (!GameConfig.quality.presets[presetName]) return;
    this.currentQuality = presetName;
    const preset = GameConfig.quality.presets[presetName];

    if (this.scene) {
      this.scene.shadowsEnabled = preset.shadowsEnabled;
      if (this.environmentBuilder && this.environmentBuilder.shadowGenerator) {
        this.environmentBuilder.shadowGenerator.mapSize = preset.shadowMapSize;
        this.environmentBuilder.shadowGenerator.blurKernel = preset.shadowBlurKernel;
      }
    }
    console.log(`[Graphics] Switched to quality preset: ${presetName}`);
  }

  toggleCollisionDebug() {
    if (this.collisionManager) {
      const next = !this.collisionManager.debugVisible;
      this.collisionManager.setDebugVisible(next);
      console.log(`[CollisionManager] Debug wireframes: ${next ? 'ENABLED' : 'DISABLED'}`);
    }
  }

  dispose() {
    this.stop();
    if (this.inputManager) this.inputManager.dispose();
    if (this.hud) this.hud.dispose();
    if (this.debugOverlay) this.debugOverlay.dispose();
    if (this.player) this.player.dispose();
    if (this.scene) this.scene.dispose();
    if (this.engine) this.engine.dispose();
  }
}
