// Check if BABYLON is loaded from global or imported
const canvas = document.getElementById('renderCanvas');
const statusEl = document.getElementById('status');
const fpsEl = document.getElementById('fps-display');
const loadTimeEl = document.getElementById('load-time');

// 1. Initialize Babylon Engine
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

// 2. Create Scene
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.04, 0.07, 0.12, 1.0);

    // 3. Setup ArcRotateCamera
    const camera = new BABYLON.ArcRotateCamera('camera1', -Math.PI / 2, Math.PI / 2.5, 5, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 50;

    // 4. Lighting
    const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.7;
    
    const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 1.2;

    // 5. Load glTF model with SceneLoader.ImportMesh
    const loadStart = performance.now();
    BABYLON.SceneLoader.ImportMesh(
        '',
        './',
        'model.gltf',
        scene,
        function (meshes) {
            const loadDuration = (performance.now() - loadStart).toFixed(2);
            console.log('Babylon.js scene loaded');
            console.log(`Babylon.js model load time: ${loadDuration} ms`);
            
            if (statusEl) statusEl.innerText = 'Babylon.js scene loaded';
            if (loadTimeEl) loadTimeEl.innerText = `${loadDuration} ms`;

            // Animate root mesh
            scene.onBeforeRenderObservable.add(() => {
                meshes.forEach((mesh) => {
                    mesh.rotation.y += 0.01;
                });
            });
        },
        null,
        function (scene, message, exception) {
            console.error('Babylon.js load error:', message, exception);
            if (statusEl) statusEl.innerText = 'Load error: ' + message;
        }
    );

    return scene;
};

const scene = createScene();

// 6. Benchmark & Render Loop
let fpsHistory = [];
const benchmarkStart = performance.now();
const benchmarkDuration = 5000;

engine.runRenderLoop(function () {
    scene.render();
    
    const currentFps = engine.getFps();
    if (fpsEl && currentFps > 0) {
        fpsEl.innerText = `${currentFps.toFixed(1)} FPS`;
    }

    const now = performance.now();
    if (currentFps > 0) {
        fpsHistory.push(currentFps);
    }

    if (now - benchmarkStart >= benchmarkDuration && fpsHistory.length > 0 && !window._benchmarkFinished) {
        window._benchmarkFinished = true;
        const avgFps = (fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length).toFixed(1);
        console.log(`[Babylon.js Benchmark Complete] Average FPS over 5s: ${avgFps}`);
    }
});

window.addEventListener('resize', function () {
    engine.resize();
});
