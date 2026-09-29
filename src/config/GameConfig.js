/**
 * GameConfig.js - Master Game Configuration & Quality Presets (Phase 2)
 */
export const GameConfig = {
  version: '2.0.0',
  title: 'AFTERLIGHT',
  subtitle: 'Phase 2: Rendering, Assets & Collision Foundation',

  quality: {
    current: 'high',
    presets: {
      low: {
        shadowsEnabled: false,
        shadowMapSize: 512,
        shadowBlurKernel: 8,
        fogDensity: 0.005,
        targetFps: 60,
        postProcessing: false
      },
      medium: {
        shadowsEnabled: true,
        shadowMapSize: 1024,
        shadowBlurKernel: 16,
        fogDensity: 0.008,
        targetFps: 60,
        postProcessing: false
      },
      high: {
        shadowsEnabled: true,
        shadowMapSize: 2048,
        shadowBlurKernel: 32,
        fogDensity: 0.008,
        targetFps: 60,
        postProcessing: true
      }
    }
  },

  graphics: {
    defaultPreset: 'high',
    presets: {
      low: { shadows: false },
      medium: { shadows: true },
      high: { shadows: true }
    }
  },

  world: {
    roadWidth: 8.0,
    sidewalkWidth: 2.5,
    curbHeight: 0.2,
    blockLength: 60.0
  },

  player: {
    walkSpeed: 4.5,
    runSpeed: 7.5,
    crouchSpeed: 2.2,
    jumpForce: 8.2,
    gravity: -19.6,
    height: 1.8,
    crouchHeight: 1.0,
    radius: 0.45,
    acceleration: 14.0,
    deceleration: 18.0,
    maxHealth: 100
  },

  camera: {
    distance: 4.0,
    height: 1.6,
    fov: 0.85,
    sensitivity: 0.002,
    smoothSpeed: 14.0,
    minPitch: -1.2,
    maxPitch: 1.2,
    shoulderOffset: 0.45
  },

  interaction: {
    defaultRange: 3.0,
    maxDistance: 3.0,
    interactionKey: 'KeyE',
    highlightColor: [0.2, 0.8, 1.0]
  }
};
