import * as BABYLON from '@babylonjs/core';
import { GameConfig } from '../config/GameConfig.js';

/**
 * Interactable.js - Base Class / Interface for Interactive Scene Objects
 */
export class Interactable {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name]
   * @param {string} [options.promptText]
   * @param {number} [options.range]
   * @param {BABYLON.Vector3|{x: number, y: number, z: number}} [options.position]
   * @param {BABYLON.AbstractMesh} [options.mesh]
   * @param {Function} [options.onInteract]
   */
  constructor({
    id,
    name = 'Interactable Object',
    promptText = 'Press E to Interact',
    range = GameConfig.interaction?.defaultRange ?? 3.0,
    position = new BABYLON.Vector3(0, 0, 0),
    mesh = null,
    onInteract = null
  }) {
    if (!id) {
      throw new Error('Interactable requires a unique id');
    }

    this.id = id;
    this.name = name;
    this.promptText = promptText;
    this.range = range;
    this.mesh = mesh;
    this.customOnInteract = onInteract;
    this.enabled = true;
    this.isHighlighted = false;

    if (position instanceof BABYLON.Vector3) {
      this._position = position.clone();
    } else {
      this._position = new BABYLON.Vector3(position.x || 0, position.y || 0, position.z || 0);
    }

    if (this.mesh && this.mesh.computeWorldMatrix) {
      this.mesh.computeWorldMatrix(true);
    }
  }

  /**
   * Gets current world position of the interactable (from mesh or stored vector)
   * @returns {BABYLON.Vector3}
   */
  get position() {
    if (this.mesh) {
      if (typeof this.mesh.computeWorldMatrix === 'function') {
        this.mesh.computeWorldMatrix(true);
      }
      if (typeof this.mesh.getAbsolutePosition === 'function') {
        return this.mesh.getAbsolutePosition();
      }
      if (this.mesh.position) {
        return this.mesh.position;
      }
    }
    return this._position;
  }

  set position(val) {
    if (val instanceof BABYLON.Vector3) {
      this._position.copyFrom(val);
    } else {
      this._position.set(val.x || 0, val.y || 0, val.z || 0);
    }
    if (this.mesh) {
      this.mesh.position.copyFrom(this._position);
      if (this.mesh.computeWorldMatrix) {
        this.mesh.computeWorldMatrix(true);
      }
    }
  }

  /**
   * Determines if the player can interact with this object
   * @param {any} [player]
   * @returns {boolean}
   */
  canInteract(player) {
    return this.enabled;
  }

  /**
   * Executes interaction logic
   * @param {any} player
   * @returns {boolean}
   */
  interact(player) {
    if (!this.canInteract(player)) return false;
    if (typeof this.customOnInteract === 'function') {
      return Boolean(this.customOnInteract(player));
    }
    return true;
  }

  /**
   * Highlight visual feedback when player enters/exits range
   * @param {boolean} highlight
   */
  onHighlight(highlight) {
    this.isHighlighted = highlight;
    if (this.mesh && this.mesh.material) {
      if (highlight) {
        if (!this._origEmissive && this.mesh.material.emissiveColor) {
          this._origEmissive = this.mesh.material.emissiveColor.clone();
        }
        if (this.mesh.material.emissiveColor) {
          this.mesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1.0);
        }
      } else {
        if (this._origEmissive && this.mesh.material.emissiveColor) {
          this.mesh.material.emissiveColor = this._origEmissive.clone();
        }
      }
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
