# AFTERLIGHT — Atmospheric 3D Web Game

## 🚀 Quick Start Guide (Windows / Mac / Linux)

### Requirements
- **Node.js** v18+ (Download from [nodejs.org](https://nodejs.org/))
- **NPM** (comes bundled with Node.js)

---

### Step 1: Install Dependencies
Do not manually copy or paste loose `node_modules` folders. Instead, open your terminal (Command Prompt, PowerShell, or Git Bash) inside the project folder (`free-game-`) and run:

```bash
npm install
```

This will automatically download and link all required Babylon.js packages (`@babylonjs/core`, `@babylonjs/loaders`, `vite`, etc.).

---

### Step 2: Run the Game Dev Server

```bash
npm run dev
```

Then open your browser and navigate to:
👉 **`http://localhost:3000`**

---

### Controls & Features
- **Movement:** `W`, `A`, `S`, `D` or Arrow Keys
- **Camera Look:** Mouse orbit / Click canvas to lock pointer
- **Jump:** `Space`
- **Crouch:** `C` or `Ctrl`
- **Sprint:** `Shift`
- **Interact:** `E` (when near glowing Data Relay Terminal)
- **Telemetry Overlay:** `F3` (toggle FPS, Player Pos, Quality Presets)

---

### Run Automated Tests

```bash
npm test
```
