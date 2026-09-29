import { GameConfig } from '../config/GameConfig.js';

/**
 * InputManager.js - Core Input System & Mobile-Aware Abstraction
 * Supports keyboard/mouse, pointer lock, and mobile virtual stick/button bindings.
 */
export class InputManager {
  /**
   * @param {Object} [options]
   * @param {HTMLCanvasElement} [options.canvas]
   */
  constructor(options = {}) {
    this.canvas = options.canvas || null;

    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isCrouching = false;
    this.synthetic = null;
    this.triggers = {
      jump: false,
      interact: false
    };

    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onCanvasClick = this._handleCanvasClick.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);

    if (this.canvas && typeof this.canvas.addEventListener === 'function') {
      this.canvas.addEventListener('click', this._onCanvasClick);
    }
  }

  unbindEvents() {
    if (typeof window === 'undefined' || !window.removeEventListener) return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);

    if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
      this.canvas.removeEventListener('click', this._onCanvasClick);
    }
  }

  _handleCanvasClick() {
    if (this.canvas && this.canvas.requestPointerLock && document.pointerLockElement !== this.canvas) {
      try {
        this.canvas.requestPointerLock();
      } catch (e) {
        // Pointer lock rejected or not supported
      }
    }
  }

  _handleKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === 'Space') {
      this.triggers.jump = true;
      e.preventDefault();
    }
    if (e.code === 'KeyC' || e.code === 'ControlLeft') {
      this.isCrouching = !this.isCrouching;
    }
    if (e.code === 'KeyE') {
      this.triggers.interact = true;
    }
  }

  _handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  _handleMouseMove(e) {
    if (typeof document !== 'undefined' && document.pointerLockElement === this.canvas) {
      this.mouseDelta.x += e.movementX || 0;
      this.mouseDelta.y += e.movementY || 0;
    }
  }

  setSyntheticInput(overrides) {
    this.synthetic = overrides;
    if (overrides) {
      if (overrides.crouch !== undefined) {
        this.isCrouching = Boolean(overrides.crouch);
      }
      if (overrides.jump) {
        this.triggers.jump = true;
      }
    }
  }

  getMoveInput() {
    if (this.synthetic) {
      let x = 0;
      let z = 0;
      if (this.synthetic.forward) z += 1;
      if (this.synthetic.backward) z -= 1;
      if (this.synthetic.left) x -= 1;
      if (this.synthetic.right) x += 1;
      return { x, z };
    }

    let x = 0;
    let z = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    return { x, z };
  }

  isSprintActive() {
    if (this.synthetic && this.synthetic.sprint !== undefined) {
      return Boolean(this.synthetic.sprint);
    }
    return Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
  }

  consumeLookDelta() {
    const delta = { ...this.mouseDelta };
    this.mouseDelta = { x: 0, y: 0 };
    return delta;
  }

  consumeTrigger(name) {
    if (this.synthetic && this.synthetic[name] !== undefined) {
      const val = Boolean(this.synthetic[name]);
      this.synthetic[name] = false;
      return val;
    }
    const val = Boolean(this.triggers[name]);
    this.triggers[name] = false;
    return val;
  }

  consumeJump() {
    return this.consumeTrigger('jump');
  }

  isCrouchActive() {
    if (this.synthetic && this.synthetic.crouch !== undefined) {
      return Boolean(this.synthetic.crouch);
    }
    return this.isCrouching;
  }

  dispose() {
    this.unbindEvents();
  }
}
