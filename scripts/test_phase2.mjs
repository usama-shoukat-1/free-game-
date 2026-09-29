import * as BABYLON from '@babylonjs/core';
import { GameManager } from '../src/core/GameManager.js';
import { ASSET_CATALOG } from '../src/assets/AssetRegistry.js';
import { ColliderType } from '../src/world/CollisionManager.js';

console.log('======================================================');
console.log('  AFTERLIGHT — PHASE 2 VERIFICATION TEST SUITE');
console.log('  Rendering, Asset Pipeline, World & Collision QA');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASSED: ${testName}`);
  } else {
    console.error(`❌ FAILED: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function runPhase2Tests() {
  // -----------------------------------------------------------------
  // 1. Asset Catalog & Pipeline Verification
  // -----------------------------------------------------------------
  console.log('--- 1. Asset Catalog & Pipeline Specification ---');
  const requiredAssetKeys = [
    'building_riverside_apartments',
    'building_safehouse',
    'building_storefront',
    'building_substation',
    'road_main_street',
    'sidewalk_concrete',
    'vehicle_suv_patrol',
    'prop_streetlight',
    'prop_jersey_barrier',
    'prop_metal_dumpster',
    'prop_utility_box',
    'character_operative_survivor'
  ];

  requiredAssetKeys.forEach(key => {
    const asset = ASSET_CATALOG[key];
    assert(Boolean(asset), `Asset exists in catalog: ${key}`);
    if (asset) {
      assert(Boolean(asset.license && asset.source), `Asset has valid license & source: ${key}`);
      assert(Boolean(asset.scale && asset.scale.x > 0), `Asset has real-world physical scale: ${key}`);
    }
  });

  // -----------------------------------------------------------------
  // 2. GameManager Phase 2 Bootstrap & Rendering Scene Proof
  // -----------------------------------------------------------------
  console.log('\n--- 2. GameManager Bootstrap & Rendering Scene Proof ---');
  const gameManager = new GameManager({ headless: true });
  await gameManager.init();

  assert(gameManager.isInitialized, 'GameManager initialized successfully');
  assert(Boolean(gameManager.scene), 'Scene created');
  assert(Boolean(gameManager.collisionManager), 'CollisionManager initialized');
  assert(Boolean(gameManager.environmentBuilder), 'EnvironmentBuilder initialized');
  assert(Boolean(gameManager.player), 'Player entity created');
  assert(Boolean(gameManager.cameraController), 'CameraController created');

  const sceneMeshes = gameManager.scene.meshes;
  const sceneLights = gameManager.scene.lights;
  console.log(`- Scene meshes: ${sceneMeshes.length}`);
  console.log(`- Scene lights: ${sceneLights.length}`);
  console.log(`- Registered colliders: ${gameManager.collisionManager.colliders.length}`);

  assert(sceneMeshes.length >= 20, 'Scene contains rich environment geometry (>20 meshes)');
  assert(sceneLights.length >= 3, 'Scene contains directional moonlight, ambient night & practical emergency fixtures');
  assert(gameManager.collisionManager.colliders.length >= 10, 'Collision system contains registered physical colliders');

  // -----------------------------------------------------------------
  // 3. Physical Collision Verification (Player vs World Obstacles)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Physical Collision Foundation QA ---');

  // Test 3.1: Building Collision (Riverside Apartments at X = -14.0m)
  // Player at X = -7.0m attempts to walk west into the building (X = -8.0m boundary)
  gameManager.player.setPosition(-7.0, 0.2, 8.0);
  const controllerWalkWest = {
    getMoveInput: () => ({ x: -1, z: 0 }),
    isCrouchActive: () => false,
    isSprintActive: () => false,
    consumeJump: () => false
  };

  // Simulate 30 frames of walking directly into the building wall
  for (let i = 0; i < 30; i++) {
    gameManager.player.update(controllerWalkWest, null, 0.016);
  }

  assert(gameManager.player.position.x >= -8.0, 'Player cannot penetrate Riverside Apartments building wall', `Player X: ${gameManager.player.position.x.toFixed(3)}`);

  // Test 3.2: Vehicle Collision (Tactical SUV at X = -2.8m, Z = 2.0m, bounds: X=[-3.9, -1.7], Z=[-0.4, 4.4])
  // Player at X = 0.0, Z = 2.0 walks west into SUV
  gameManager.player.setPosition(0.0, 0.05, 2.0);
  for (let i = 0; i < 30; i++) {
    gameManager.player.update(controllerWalkWest, null, 0.016);
  }
  assert(gameManager.player.position.x >= -1.7, 'Player cannot penetrate parked Tactical SUV', `Player X: ${gameManager.player.position.x.toFixed(3)}`);

  // Test 3.3: Highway Jersey Barrier Collision (North barrier at Z = 24.0m)
  // Player at X = 0.0, Z = 22.0 walks north into barrier
  gameManager.player.setPosition(0.0, 0.05, 22.0);
  const controllerWalkNorth = {
    getMoveInput: () => ({ x: 0, z: 1 }),
    isCrouchActive: () => false,
    isSprintActive: () => false,
    consumeJump: () => false
  };
  for (let i = 0; i < 30; i++) {
    gameManager.player.update(controllerWalkNorth, null, 0.016);
  }
  assert(gameManager.player.position.z <= 23.7, 'Player cannot penetrate concrete Jersey Barrier', `Player Z: ${gameManager.player.position.z.toFixed(3)}`);

  // Test 3.4: Dumpster Prop Collision (East sidewalk at X = 5.2m, Z = -5.0m)
  // Player at X = 4.0m, Z = -5.0m walks east into dumpster
  gameManager.player.setPosition(4.0, 0.2, -5.0);
  const controllerWalkEast = {
    getMoveInput: () => ({ x: 1, z: 0 }),
    isCrouchActive: () => false,
    isSprintActive: () => false,
    consumeJump: () => false
  };
  for (let i = 0; i < 30; i++) {
    gameManager.player.update(controllerWalkEast, null, 0.016);
  }
  assert(gameManager.player.position.x <= 4.45, 'Player cannot penetrate metal dumpster prop', `Player X: ${gameManager.player.position.x.toFixed(3)}`);

  // -----------------------------------------------------------------
  // 4. Ground Elevation & Step Climbing
  // -----------------------------------------------------------------
  console.log('\n--- 4. Ground Elevation & Step Climbing ---');
  const streetGround = gameManager.collisionManager.getGroundHeight(0.0, 0.0);
  const westSidewalkGround = gameManager.collisionManager.getGroundHeight(-5.0, 0.0);
  const eastSidewalkGround = gameManager.collisionManager.getGroundHeight(5.0, 0.0);

  assert(streetGround === 0.0, 'Main street ground height is 0.0m', `Got: ${streetGround}`);
  assert(westSidewalkGround === 0.2, 'West sidewalk curb elevation is 0.2m', `Got: ${westSidewalkGround}`);
  assert(eastSidewalkGround === 0.2, 'East sidewalk curb elevation is 0.2m', `Got: ${eastSidewalkGround}`);

  // Step climbing: Player walks from road (X = -3.8m, Y = 0.0m) onto sidewalk (X = -4.2m)
  gameManager.player.setPosition(-3.8, 0.0, 0.0);
  for (let i = 0; i < 15; i++) {
    gameManager.player.update(controllerWalkWest, null, 0.016);
  }
  assert(gameManager.player.position.y >= 0.2, 'Player smoothly stepped onto raised 0.2m sidewalk curb', `Player Y: ${gameManager.player.position.y.toFixed(2)}m`);

  // -----------------------------------------------------------------
  // 5. Safehouse Doorway & Interior Walkability
  // -----------------------------------------------------------------
  console.log('\n--- 5. Safehouse Doorway & Interior Navigation ---');
  // Safehouse entrance is at X = -7.5m, Z = -14.0m (Doorway gap in East Wall)
  gameManager.player.setPosition(-6.0, 0.2, -14.0); // Outside doorway
  for (let i = 0; i < 40; i++) {
    gameManager.player.update(controllerWalkWest, null, 0.016);
  }
  assert(gameManager.player.position.x < -7.5, 'Player successfully walked through open doorway into Safehouse interior', `Player X: ${gameManager.player.position.x.toFixed(3)}`);

  // Inside safehouse, test that North wall (Z = -9.5m) stops the player
  for (let i = 0; i < 30; i++) {
    gameManager.player.update(controllerWalkNorth, null, 0.016);
  }
  assert(gameManager.player.position.z <= -9.7, 'Safehouse interior North wall blocks player', `Player Z: ${gameManager.player.position.z.toFixed(3)}`);

  // -----------------------------------------------------------------
  // 6. Camera Collision Avoidance Probe
  // -----------------------------------------------------------------
  console.log('\n--- 6. Camera Collision Avoidance Probe ---');
  const origin = new BABYLON.Vector3(-7.0, 1.6, 8.0); // Player near Riverside building
  const desiredCam = new BABYLON.Vector3(-11.0, 2.0, 8.0); // Would clip deep inside building (-14m)
  const safeCam = gameManager.collisionManager.resolveCameraPosition(origin, desiredCam, 0.25, 0.8);

  assert(safeCam.x > -8.0, 'Camera collision probe successfully prevents camera from clipping through building wall', `Safe Cam X: ${safeCam.x.toFixed(3)} vs Wall X: -8.0`);

  // -----------------------------------------------------------------
  // 7. Interactive Terminal in Safehouse
  // -----------------------------------------------------------------
  console.log('\n--- 7. Interactive Terminal & Objective Progress ---');
  // Move player close to terminal inside safehouse at (-13.0, 0.2, -14.0)
  gameManager.player.setPosition(-13.0, 0.2, -13.5);
  gameManager.interactionSystem.update(gameManager.player);

  const activeCandidate = gameManager.interactionSystem.getCandidate();
  assert(Boolean(activeCandidate), 'Safehouse terminal detected as interaction candidate when in range');

  const interactionSuccess = gameManager.interactionSystem.triggerInteraction(gameManager.player);
  assert(interactionSuccess, 'Safehouse terminal interaction executed successfully');

  // -----------------------------------------------------------------
  // 8. 60-Frame Headless Simulation Loop
  // -----------------------------------------------------------------
  console.log('\n--- 8. 60-Frame Full Simulation Loop ---');
  let frameErrors = 0;
  for (let f = 0; f < 60; f++) {
    try {
      gameManager.update(0.016);
      gameManager.render();
    } catch (e) {
      frameErrors++;
      console.error(`Error on frame ${f}:`, e);
    }
  }
  assert(frameErrors === 0, '60 full simulation frames rendered with 0 runtime errors');

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  PHASE 2 TESTS COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
