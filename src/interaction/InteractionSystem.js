import * as BABYLON from '@babylonjs/core';
import { Interactable } from './Interactable.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * InteractionSystem.js - Proximity Tracking & Interaction Handler
 */
export class InteractionSystem {
  /**
   * @param {Object} [options]
   * @param {string} [options.interactionKey]
   */
  constructor(options = {}) {
    /** @type {Map<string, Interactable>} */
    this.interactables = new Map();
    /** @type {Interactable|null} */
    this.currentCandidate = null;
    this.interactionKey = options.interactionKey || 'KeyE';

    this.isKeyPressed = false;
    this.keyProcessed = false;
    this.onPromptChange = null;

    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);

    this.bindEvents();
  }

  /**
   * Binds browser keyboard listeners
   */
  bindEvents() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }
  }

  /**
   * Unbinds browser keyboard listeners
   */
  unbindEvents() {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }
  }

  _handleKeyDown(event) {
    if (event.code === this.interactionKey) {
      if (!this.isKeyPressed) {
        this.isKeyPressed = true;
        this.keyProcessed = false;
      }
    }
  }

  _handleKeyUp(event) {
    if (event.code === this.interactionKey) {
      this.isKeyPressed = false;
      this.keyProcessed = false;
    }
  }

  /**
   * Registers an interactable in the system
   * @param {Interactable} interactable
   */
  register(interactable) {
    if (!(interactable instanceof Interactable)) {
      throw new Error('Object must be an instance of Interactable');
    }
    this.interactables.set(interactable.id, interactable);
  }

  /**
   * Unregisters an interactable
   * @param {string} id
   */
  unregister(id) {
    const interactable = this.interactables.get(id);
    if (interactable && interactable.isHighlighted) {
      interactable.onHighlight(false);
    }
    this.interactables.delete(id);
    if (this.currentCandidate?.id === id) {
      this.currentCandidate = null;
      if (this.onPromptChange) this.onPromptChange(null);
    }
  }

  /**
   * Clears all registered interactables
   */
  clear() {
    for (const interactable of this.interactables.values()) {
      interactable.onHighlight(false);
    }
    this.interactables.clear();
    this.currentCandidate = null;
    if (this.onPromptChange) this.onPromptChange(null);
  }

  /**
   * Returns currently focused interactable candidate
   */
  getCandidate() {
    return this.currentCandidate;
  }

  /**
   * Checks proximity between player and all registered interactables
   * @param {any} player
   * @returns {Interactable|null} nearest interactable within range
   */
  update(player) {
    if (!player || !player.position) return null;

    const playerPos = player.position;
    let closestCandidate = null;
    let minDistanceSq = Infinity;

    for (const interactable of this.interactables.values()) {
      if (!interactable.canInteract(player)) {
        continue;
      }

      const itemPos = interactable.position;
      const dx = playerPos.x - itemPos.x;
      const dy = playerPos.y - itemPos.y;
      const dz = playerPos.z - itemPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const rangeSq = interactable.range * interactable.range;

      if (distSq <= rangeSq && distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestCandidate = interactable;
      }
    }

    // Highlight state management
    if (closestCandidate !== this.currentCandidate) {
      if (this.currentCandidate) {
        this.currentCandidate.onHighlight(false);
      }
      if (closestCandidate) {
        closestCandidate.onHighlight(true);
      }
      this.currentCandidate = closestCandidate;
      if (this.onPromptChange) {
        this.onPromptChange(this.currentCandidate ? this.currentCandidate.promptText : null);
      }
    }

    // Process interaction trigger
    if (this.isKeyPressed && !this.keyProcessed) {
      this.keyProcessed = true;
      if (this.currentCandidate) {
        this.currentCandidate.interact(player);
      }
    }

    return this.currentCandidate;
  }

  /**
   * Programmatic interaction trigger
   * @param {any} player
   * @returns {boolean} whether interaction succeeded
   */
  triggerInteraction(player) {
    if (!player || !player.position) return false;

    // Scan for nearest candidate
    this.update(player);

    if (this.currentCandidate) {
      return Boolean(this.currentCandidate.interact(player));
    }

    return false;
  }

  dispose() {
    this.unbindEvents();
    this.clear();
  }
}
