import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Setup DOM elements
const statusEl = document.getElementById('status');
const fpsEl = document.getElementById('fps-display');
const loadTimeEl = document.getElementById('load-time');

// 1. Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b111e);
scene.fog = new THREE.FogExp2(0x0b111e, 0.05);

// 2. Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// 3. Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 4. OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 5. Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x7dd3fc, 1.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xa855f7, 2, 20);
pointLight.position.set(-3, 2, -2);
scene.add(pointLight);

// 6. Grid helper for visual reference
const gridHelper = new THREE.GridHelper(20, 20, 0x38bdf8, 0x1e293b);
gridHelper.position.y = -1.5;
scene.add(gridHelper);

// 7. GLTF Loader
let loadedModel = null;
const loader = new GLTFLoader();
const loadStart = performance.now();

loader.load(
    './model.gltf',
    (gltf) => {
        const loadDuration = (performance.now() - loadStart).toFixed(2);
        loadedModel = gltf.scene;
        scene.add(loadedModel);
        
        console.log('Three.js scene loaded');
        console.log(`Three.js model load time: ${loadDuration} ms`);
        
        if (statusEl) statusEl.innerText = 'Three.js scene loaded';
        if (loadTimeEl) loadTimeEl.innerText = `${loadDuration} ms`;
    },
    (progress) => {
        console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
    },
    (error) => {
        console.error('An error happened loading Three.js glTF model:', error);
        if (statusEl) statusEl.innerText = 'Load error: ' + error.message;
    }
);

// 8. FPS Tracking & Render Loop
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fpsHistory = [];
const benchmarkDuration = 5000;
const benchmarkStart = performance.now();

function animate(time) {
    requestAnimationFrame(animate);

    if (loadedModel) {
        loadedModel.rotation.y += 0.01;
        loadedModel.rotation.x = Math.sin(time * 0.001) * 0.1;
    }

    controls.update();
    renderer.render(scene, camera);

    // Track FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
        const currentFps = (frameCount * 1000) / (now - lastFpsUpdate);
        fpsHistory.push(currentFps);
        if (fpsEl) fpsEl.innerText = `${currentFps.toFixed(1)} FPS`;
        frameCount = 0;
        lastFpsUpdate = now;
    }

    if (now - benchmarkStart >= benchmarkDuration && fpsHistory.length > 0 && !window._benchmarkFinished) {
        window._benchmarkFinished = true;
        const avgFps = (fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length).toFixed(1);
        console.log(`[Three.js Benchmark Complete] Average FPS over 5s: ${avgFps}`);
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
