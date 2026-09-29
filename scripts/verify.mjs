import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

console.log('=== Running Phase 0 Scaffolding Verification ===');

try {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.03, 0.05, 0.09, 1.0);

  const camera = new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 2.6, 8, new BABYLON.Vector3(0, 1.2, 0), scene);
  const hemiLight = new BABYLON.HemisphericLight('Hemi', new BABYLON.Vector3(0, 1, 0), scene);
  const keyLight = new BABYLON.DirectionalLight('Key', new BABYLON.Vector3(-1, -2, -1), scene);
  const ground = BABYLON.MeshBuilder.CreateGround('Ground', { width: 30, height: 30 }, scene);
  const monolith = BABYLON.MeshBuilder.CreatePolyhedron('Monolith', { type: 1, size: 1.2 }, scene);

  console.log(`- Scene meshes: ${scene.meshes.length}`);
  console.log(`- Scene lights: ${scene.lights.length}`);
  console.log(`- Active camera: ${scene.activeCamera ? scene.activeCamera.name : 'none'}`);

  console.log('Running 60 simulation frames...');
  for (let i = 0; i < 60; i++) {
    monolith.rotation.y += 0.01;
    scene.render();
  }

  console.log('Engine Babylon.js initialized');
  console.log('Verification SUCCESS: 60 frames rendered without error.');
  process.exit(0);
} catch (err) {
  console.error('Verification FAILED:', err);
  process.exit(1);
}
