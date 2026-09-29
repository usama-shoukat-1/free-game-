/**
 * HUD.js - Clean In-Game User Interface (Phase 1 Baseline)
 */
export class HUD {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onRespawn]
   */
  constructor(options = {}) {
    this.container = null;
    this.promptEl = null;
    this.objectiveEl = null;
    this.createDom();
  }

  createDom() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'phase1-hud';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      user-select: none;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #f8fafc;
      z-index: 100;
    `;

    this.container.innerHTML = `
      <!-- TOP LEFT: Active Objective Tracker -->
      <div id="hud-objective-panel" style="
        position: absolute;
        top: 20px; left: 24px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        border-left: 3px solid #38bdf8;
        padding: 10px 18px;
        border-radius: 0 6px 6px 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: 700;">Active Directive</div>
        <div id="hud-objective-text" style="font-size: 14px; font-weight: 500; margin-top: 3px; color: #f1f5f9;">Phase 1: Core Foundation</div>
      </div>

      <!-- CENTER: Reticle Crosshair -->
      <div id="hud-crosshair" style="
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 24px; height: 24px;
        pointer-events: none;
      ">
        <div style="position: absolute; top: 0; left: 11px; width: 2px; height: 6px; background: rgba(255,255,255,0.85);"></div>
        <div style="position: absolute; bottom: 0; left: 11px; width: 2px; height: 6px; background: rgba(255,255,255,0.85);"></div>
        <div style="position: absolute; left: 0; top: 11px; width: 6px; height: 2px; background: rgba(255,255,255,0.85);"></div>
        <div style="position: absolute; right: 0; top: 11px; width: 6px; height: 2px; background: rgba(255,255,255,0.85);"></div>
      </div>

      <!-- BOTTOM CENTER: Interaction Prompt Banner -->
      <div id="hud-interaction-prompt" style="
        position: absolute;
        bottom: 120px; left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #f8fafc;
        padding: 8px 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.5px;
        display: none;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      ">
        <span style="background: #38bdf8; color: #0f172a; font-weight: 700; padding: 2px 6px; border-radius: 3px; margin-right: 8px;">E</span>
        <span id="hud-interaction-label">Interact</span>
      </div>
    `;

    document.body.appendChild(this.container);
    this.promptEl = document.getElementById('hud-interaction-prompt');
    this.objectiveEl = document.getElementById('hud-objective-text');
  }

  setPrompt(text) {
    if (!this.promptEl) return;
    if (text) {
      const label = document.getElementById('hud-interaction-label');
      if (label) label.textContent = text;
      this.promptEl.style.display = 'block';
    } else {
      this.promptEl.style.display = 'none';
    }
  }

  update({ objective = null, isDead = false } = {}) {
    if (this.objectiveEl && objective) {
      this.objectiveEl.textContent = typeof objective === 'string' ? objective : (objective.title || objective.description || 'Active');
    }
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
