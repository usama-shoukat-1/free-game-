// PlayCanvas Feasibility Gate
const canvas = document.getElementById('application-canvas');
const statusEl = document.getElementById('status');
const fpsEl = document.getElementById('fps-display');
const loadTimeEl = document.getElementById('load-time');

// 1. Initialize PlayCanvas Application
const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    keyboard: new pc.Keyboard(window)
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.start();

// 2. Setup Camera
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
    clearColor: new pc.Color(0.04, 0.07, 0.12),
    fov: 60
});
app.root.addChild(camera);
camera.setPosition(0, 2, 5);
camera.lookAt(0, 0, 0);

// 3. Setup Directional Light
const light = new pc.Entity('light');
light.addComponent('light', {
    type: 'directional',
    color: new pc.Color(0.5, 0.8, 1.0),
    intensity: 1.5
});
app.root.addChild(light);
light.setEulerAngles(45, 30, 0);

// 4. Load glTF model via pc.Asset
const loadStart = performance.now();
const modelAsset = new pc.Asset('model', 'container', {
    url: './model.gltf'
});

app.assets.on('load:' + modelAsset.id, function (asset) {
    const loadDuration = (performance.now() - loadStart).toFixed(2);
    console.log('PlayCanvas scene loaded');
    console.log(`PlayCanvas model load time: ${loadDuration} ms`);

    if (statusEl) statusEl.innerText = 'PlayCanvas scene loaded';
    if (loadTimeEl) loadTimeEl.innerText = `${loadDuration} ms`;

    if (asset.resource && asset.resource.instantiateModelEntity) {
        const modelEntity = asset.resource.instantiateModelEntity();
        app.root.addChild(modelEntity);

        // Rotate model
        app.on('update', function (dt) {
            modelEntity.rotate(0, 50 * dt, 0);
        });
    }
});

app.assets.on('error:' + modelAsset.id, function (err) {
    console.error('PlayCanvas load error:', err);
    if (statusEl) statusEl.innerText = 'Load error: ' + err;
});

app.assets.add(modelAsset);
app.assets.load(modelAsset);

// 5. FPS Tracking & Render Loop
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fpsHistory = [];
const benchmarkDuration = 5000;
const benchmarkStart = performance.now();

app.on('update', function (dt) {
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
        console.log(`[PlayCanvas Benchmark Complete] Average FPS over 5s: ${avgFps}`);
    }
});

window.addEventListener('resize', function () {
    app.resizeCanvas();
});
