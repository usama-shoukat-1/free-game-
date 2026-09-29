/**
 * DebugOverlay.js - Lightweight Real-Time Performance & Gameplay Telemetry
 */
export class DebugOverlay {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.container]
   * @param {Function} [options.onQualityChange]
   * @param {Function} [options.onSave]
   * @param {Function} [options.onLoad]
   */
  constructor(options = {}) {
    this.container = options.container || null;
    this.onQualityChange = options.onQualityChange || null;
    this.onSave = options.onSave || null;
    this.onLoad = options.onLoad || null;

    this.visible = true;
    this.elements = {};

    this.createUI();
    this.bindEvents();
  }

  createUI() {
    if (typeof document === 'undefined') return;

    let root = document.getElementById('debug-telemetry-panel');
    if (!root) {
      root = document.createElement('div');
      root.id = 'debug-telemetry-panel';
      root.className = 'debug-panel';
      document.body.appendChild(root);
    }
    this.root = root;

    this.root.innerHTML = `
      <div class="debug-header">
        <span class="debug-title">AFTERLIGHT TELEMETRY</span>
        <span class="debug-toggle" title="Toggle overlay (F3)">[F3]</span>
      </div>
      <div class="debug-body">
        <div class="debug-row"><span class="k">FPS:</span> <span id="dbg-fps" class="v">--</span></div>
        <div class="debug-row"><span class="k">Frame Time:</span> <span id="dbg-frametime" class="v">-- ms</span></div>
        <div class="debug-row"><span class="k">Player Pos:</span> <span id="dbg-pos" class="v">X:0.0 Y:0.0 Z:0.0</span></div>
        <div class="debug-row"><span class="k">Player State:</span> <span id="dbg-state" class="v">Grounded</span></div>
        <div class="debug-row"><span class="k">Active Quest:</span> <span id="dbg-quest" class="v">None</span></div>
        <div class="debug-row"><span class="k">Objective:</span> <span id="dbg-obj" class="v">--</span></div>
        <div class="debug-row"><span class="k">Quality:</span>
          <select id="dbg-quality-select" class="debug-select">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High" selected>High</option>
          </select>
        </div>
      </div>
      <div class="debug-actions">
        <button id="dbg-btn-save" class="dbg-btn">Save State</button>
        <button id="dbg-btn-load" class="dbg-btn">Load State</button>
      </div>
      <div id="dbg-interaction-prompt" class="interaction-prompt hidden">
        <span class="key-badge">E</span> <span id="dbg-prompt-text">Interact</span>
      </div>
    `;

    this.elements = {
      fps: document.getElementById('dbg-fps'),
      frameTime: document.getElementById('dbg-frametime'),
      playerPos: document.getElementById('dbg-pos'),
      playerState: document.getElementById('dbg-state'),
      quest: document.getElementById('dbg-quest'),
      objective: document.getElementById('dbg-obj'),
      qualitySelect: document.getElementById('dbg-quality-select'),
      promptBox: document.getElementById('dbg-interaction-prompt'),
      promptText: document.getElementById('dbg-prompt-text'),
      btnSave: document.getElementById('dbg-btn-save'),
      btnLoad: document.getElementById('dbg-btn-load')
    };

    if (this.elements.qualitySelect && this.onQualityChange) {
      this.elements.qualitySelect.addEventListener('change', (e) => {
        this.onQualityChange(e.target.value);
      });
    }

    if (this.elements.btnSave && this.onSave) {
      this.elements.btnSave.addEventListener('click', () => this.onSave());
    }

    if (this.elements.btnLoad && this.onLoad) {
      this.elements.btnLoad.addEventListener('click', () => this.onLoad());
    }
  }

  bindEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    if (this.root) {
      this.root.style.display = this.visible ? 'block' : 'none';
    }
  }

  /**
   * Updates telemetry readout values
   * @param {Object} data
   */
  update(data = {}) {
    if (!this.visible || typeof document === 'undefined') return;

    if (this.elements.fps && data.fps !== undefined) {
      this.elements.fps.innerText = `${data.fps}`;
    }

    if (this.elements.frameTime && data.frameTime !== undefined) {
      this.elements.frameTime.innerText = `${data.frameTime.toFixed(1)} ms`;
    }

    if (this.elements.playerPos && data.playerPos) {
      this.elements.playerPos.innerText = `X:${data.playerPos.x.toFixed(1)} Y:${data.playerPos.y.toFixed(1)} Z:${data.playerPos.z.toFixed(1)}`;
    }

    if (this.elements.playerState && data.playerState) {
      this.elements.playerState.innerText = data.playerState;
    }

    if (this.elements.quest && data.questTitle !== undefined) {
      this.elements.quest.innerText = data.questTitle || 'None';
    }

    if (this.elements.objective && data.objectiveText !== undefined) {
      this.elements.objective.innerText = data.objectiveText || '--';
    }
  }

  /**
   * Sets interaction prompt on screen
   * @param {string|null} text
   */
  setInteractionPrompt(text) {
    if (!this.elements.promptBox || !this.elements.promptText) return;

    if (text) {
      this.elements.promptText.innerText = text;
      this.elements.promptBox.classList.remove('hidden');
    } else {
      this.elements.promptBox.classList.add('hidden');
    }
  }

  dispose() {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}
