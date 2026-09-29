/**
 * test_foundation.mjs - Comprehensive Step 1 Core Game Foundation Verification Suite
 */
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { GameManager } from '../src/core/GameManager.js';
import { Player } from '../src/player/Player.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { CameraController } from '../src/player/CameraController.js';
import { Interactable } from '../src/interaction/Interactable.js';
import { InteractionSystem } from '../src/interaction/InteractionSystem.js';
import { QuestDefinition } from '../src/quests/QuestDefinition.js';
import { QuestState } from '../src/quests/QuestState.js';
import { QuestManager } from '../src/quests/QuestManager.js';
import { SaveManager } from '../src/save/SaveManager.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
  passedTests++;
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  AFTERLIGHT — STEP 1 CORE GAME FOUNDATION TEST SUITE');
  console.log('======================================================\n');

  // Shared headless Babylon Engine & Scene
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  // -------------------------------------------------------------
  // Test 1: GameManager Bootstrap & Subsystem Initialization
  // -------------------------------------------------------------
  console.log('--- 1. GameManager Bootstrap Test ---');
  const gm = new GameManager({ engine, scene, headless: true });
  await gm.init();
  assert(gm.isInitialized === true, 'GameManager initialized successfully');
  assert(gm.player !== null, 'Player subsystem initialized');
  assert(gm.cameraController !== null, 'CameraController subsystem initialized');
  assert(gm.interactionSystem !== null, 'InteractionSystem subsystem initialized');
  assert(gm.questManager !== null, 'QuestManager subsystem initialized');
  assert(gm.saveManager !== null, 'SaveManager subsystem initialized');
  console.log('');

  // -------------------------------------------------------------
  // Test A: Player Forward & Camera-Relative Movement
  // -------------------------------------------------------------
  console.log('--- Test A: Player Forward Movement ---');
  const player = new Player({ scene });
  const controller = new PlayerController();
  const cameraController = new CameraController({ scene });

  // Initial position
  player.setPosition(0, 0, 0);
  cameraController.setYaw(0); // Camera facing +Z
  cameraController.update(player.position, 0.016);

  // Forward input (move forward for 0.5s)
  controller.setSyntheticInput({ forward: true, backward: false, left: false, right: false });

  for (let i = 0; i < 30; i++) {
    player.update(controller, cameraController, 0.016);
    cameraController.update(player.position, 0.016);
  }

  assert(player.position.z > 0.5, `Player moved forward along Z-axis (Z = ${player.position.z.toFixed(3)})`);
  assert(Math.abs(player.position.x) < 0.01, `Player maintained lateral trajectory (X = ${player.position.x.toFixed(3)})`);
  console.log('');

  // -------------------------------------------------------------
  // Test B: Gravity & Grounding
  // -------------------------------------------------------------
  console.log('--- Test B: Gravity and Grounding ---');
  // Place player high in the air
  player.setPosition(0, 10.0, 0);
  controller.setSyntheticInput(null);
  assert(player.isGrounded === false, 'Player is initially airborne');

  let fellGrounded = false;
  for (let i = 0; i < 120; i++) {
    player.update(controller, cameraController, 0.016);
    if (player.isGrounded && player.position.y === 0.0) {
      fellGrounded = true;
      break;
    }
  }

  assert(fellGrounded === true, `Gravity brought player down to ground (Y = ${player.position.y.toFixed(3)}, Grounded = ${player.isGrounded})`);
  console.log('');

  // -------------------------------------------------------------
  // Test C: Jump & Landing Cycle
  // -------------------------------------------------------------
  console.log('--- Test C: Jump and Landing Cycle ---');
  player.setPosition(0, 0, 0);
  player.isGrounded = true;

  // Request Jump
  controller.setSyntheticInput({ jump: true });
  player.update(controller, cameraController, 0.016); // Jump triggered

  assert(player.isJumping === true, 'Player entered jumping state');
  assert(player.isGrounded === false, 'Player left the ground');
  assert(player.velocity.y > 0, `Upward velocity applied (Vy = ${player.velocity.y.toFixed(2)})`);

  controller.setSyntheticInput(null);
  let reachedApex = false;
  let landed = false;
  let maxApexY = 0;

  for (let i = 0; i < 150; i++) {
    player.update(controller, cameraController, 0.016);
    if (player.position.y > maxApexY) {
      maxApexY = player.position.y;
    }
    if (player.velocity.y < 0 && maxApexY > 1.0) {
      reachedApex = true;
    }
    if (player.isGrounded && player.position.y === 0) {
      landed = true;
      break;
    }
  }

  assert(reachedApex === true, `Player reached jump apex (Max Y = ${maxApexY.toFixed(2)}m)`);
  assert(landed === true, `Player successfully landed back on ground (Y = ${player.position.y.toFixed(2)}m)`);
  assert(player.isJumping === false, 'Jumping state safely cleared upon landing');
  console.log('');

  // -------------------------------------------------------------
  // Test D: Crouch State & Safe Release
  // -------------------------------------------------------------
  console.log('--- Test D: Crouch State & Safe Release ---');
  player.setPosition(0, 0, 0);

  // Activate Crouch
  controller.setSyntheticInput({ crouch: true });
  player.update(controller, cameraController, 0.016);

  assert(player.isCrouching === true, 'Player entered crouching state');
  assert(player.bodyMesh.scaling.y < 0.9, `Collision mesh height scaled down for crouch (scaleY = ${player.bodyMesh.scaling.y.toFixed(2)})`);

  // Release Crouch
  controller.setSyntheticInput({ crouch: false });
  player.update(controller, cameraController, 0.016);

  assert(player.isCrouching === false, 'Player safely exited crouching state');
  assert(Math.abs(player.bodyMesh.scaling.y - 1.0) < 0.01, 'Collision mesh returned to full standing height');
  console.log('');

  // -------------------------------------------------------------
  // Test E: Third-Person Camera Following & Look Angles
  // -------------------------------------------------------------
  console.log('--- Test E: Third-Person Camera ---');
  player.setPosition(5.0, 0, 10.0);
  cameraController.setYaw(0.5);
  cameraController.setPitch(0.3);
  cameraController.update(player.position, 0.1);

  // Camera should be positioned relative to player target
  const camPos = cameraController.camera.position;
  assert(Math.abs(camPos.x - player.position.x) < 10.0, 'Camera tracked player X position');
  assert(Math.abs(camPos.z - player.position.z) < 10.0, 'Camera tracked player Z position');

  // Test pitch clamping
  cameraController.handleLookInput({ x: 0, y: 10000 }); // Large positive mouse delta
  assert(cameraController.getPitch() <= cameraController.config.maxPitch + 0.001, 'Camera vertical pitch correctly clamped at maxPitch');

  cameraController.handleLookInput({ x: 0, y: -20000 }); // Large negative mouse delta
  assert(cameraController.getPitch() >= cameraController.config.minPitch - 0.001, 'Camera vertical pitch correctly clamped at minPitch');
  console.log('');

  // -------------------------------------------------------------
  // Test F: Interaction Framework & Proof Test
  // -------------------------------------------------------------
  console.log('--- Test F: Interaction Framework & Proof Test ---');
  const interactionSys = new InteractionSystem();
  let interactionTriggeredCount = 0;

  const testTarget = new Interactable({
    id: 'proof_terminal',
    name: 'Proof Terminal',
    range: 3.0,
    position: new BABYLON.Vector3(10.0, 0, 10.0),
    onInteract: () => {
      interactionTriggeredCount++;
      return true;
    }
  });
  interactionSys.register(testTarget);

  // Case 1: Player outside range (at origin [0,0,0], target at [10,0,10])
  player.setPosition(0, 0, 0);
  const outCandidate = interactionSys.update(player);
  assert(outCandidate === null, 'No candidate interactable detected when player is outside range (distance > 14m)');

  const outResult = interactionSys.triggerInteraction(player);
  assert(outResult === false && interactionTriggeredCount === 0, 'Interaction rejected when player is outside range');

  // Case 2: Player moves inside range (at [9.0, 0, 10.0], distance = 1.0m < 3.0m)
  player.setPosition(9.0, 0, 10.0);
  const inCandidate = interactionSys.update(player);
  assert(inCandidate !== null && inCandidate.id === 'proof_terminal', 'Candidate interactable detected when player is inside range (distance = 1.0m)');
  assert(testTarget.isHighlighted === true, 'Interactable highlighted when in proximity');

  const inResult = interactionSys.triggerInteraction(player);
  assert(inResult === true && interactionTriggeredCount === 1, 'Interaction succeeded and executed callback');
  console.log('');

  // -------------------------------------------------------------
  // Test G: Quest Framework & Progression
  // -------------------------------------------------------------
  console.log('--- Test G: Quest Framework & Progression ---');
  const questMgr = new QuestManager();
  
  // 1. Verify default dummy quest registered
  const dummyDef = questMgr.getQuestDefinition('test_quest');
  assert(dummyDef !== null, 'Dummy quest "test_quest" successfully registered');
  assert(dummyDef.objectiveCount === 2, 'Dummy quest contains 2 objectives');

  // 2. Start quest
  const startState = questMgr.startQuest('test_quest');
  assert(startState.started === true, 'Quest marked as started');
  assert(startState.currentObjectiveIndex === 0, 'Current objective index is 0 ("Reach the test location")');
  assert(questMgr.getActiveQuest().definition.id === 'test_quest', 'Active quest retrieved correctly');

  // 3. Advance objective 1
  const adv1 = questMgr.advanceObjective('test_quest');
  assert(adv1.currentObjectiveIndex === 1, 'Objective advanced to index 1 ("Interact with the test object")');
  assert(adv1.completed === false, 'Quest remains in progress after objective 1');

  // 4. Advance objective 2 (Final objective)
  const adv2 = questMgr.advanceObjective('test_quest');
  assert(adv2.completed === true, 'Quest marked as completed after final objective');
  assert(questMgr.isQuestCompleted('test_quest') === true, 'isQuestCompleted returns true');
  assert(questMgr.getActiveQuest() === null, 'Active quest is null after completion');

  // 5. Verify advance throws on completed quest
  let threwOnCompleted = false;
  try {
    questMgr.advanceObjective('test_quest');
  } catch {
    threwOnCompleted = true;
  }
  assert(threwOnCompleted === true, 'Prevented advancing an already completed quest');
  console.log('');

  // -------------------------------------------------------------
  // Test H: Save / Load Foundation & Versioned Schema
  // -------------------------------------------------------------
  console.log('--- Test H: Save / Load Foundation ---');
  const saveMgr = new SaveManager({ storageKey: 'test_afterlight_save', version: '1.0.0' });

  // 1. Save known state
  const testSavePayload = {
    player: {
      position: [14.5, 0.0, -8.2],
      rotation: [0, 0.707, 0, 0.707],
      health: 85,
      isCrouching: true
    },
    quest: {
      activeQuestId: 'test_quest',
      currentObjectiveIndex: 1,
      completed: false
    },
    meta: { level: 'OldCity_District1' }
  };

  const saveSuccess = saveMgr.save(testSavePayload);
  assert(saveSuccess === true, 'Game state saved to storage');

  // 2. Load and verify state integrity
  const loadedState = saveMgr.load();
  assert(loadedState !== null, 'Loaded save data from storage');
  assert(loadedState.saveVersion === '1.0.0', 'Save version verified (1.0.0)');
  assert(loadedState.player.position[0] === 14.5, 'Restored exact player position X (14.5)');
  assert(loadedState.player.position[2] === -8.2, 'Restored exact player position Z (-8.2)');
  assert(loadedState.player.health === 85, 'Restored player health (85)');
  assert(loadedState.player.isCrouching === true, 'Restored player crouching state (true)');
  assert(loadedState.quest.activeQuestId === 'test_quest', 'Restored active quest ID');

  // 3. Test missing save handling
  const emptySaveMgr = new SaveManager({ storageKey: 'non_existent_key_12345' });
  assert(emptySaveMgr.load() === null, 'Loading missing save data returns null without crashing');

  // 4. Test malformed/corrupted data handling
  emptySaveMgr.setItem('non_existent_key_12345', '{ bad-json-payload-corrupted... ');
  assert(emptySaveMgr.load() === null, 'Malformed JSON rejected safely without crashing');

  // 5. Test version mismatch handling
  emptySaveMgr.setItem('non_existent_key_12345', JSON.stringify({ saveVersion: '99.0.0', player: { position: [0,0,0] } }));
  assert(emptySaveMgr.load() === null, 'Incompatible major save version safely rejected');
  console.log('');

  // -------------------------------------------------------------
  // Test I: 60-Frame Headless Simulation Loop
  // -------------------------------------------------------------
  console.log('--- Test I: 60-Frame Headless Simulation Loop ---');
  for (let frame = 0; frame < 60; frame++) {
    gm.update(0.016);
    gm.render();
  }
  assert(gm.player.position !== null, '60 simulation frames executed without error');
  console.log('');

  // Clean up
  gm.dispose();
  engine.dispose();

  console.log('======================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
