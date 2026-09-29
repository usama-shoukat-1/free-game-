import { InputManager } from '../input/InputManager.js';

/**
 * PlayerController.js - Adapter wrapping InputManager for Phase 1 Baseline
 */
export class PlayerController extends InputManager {
  constructor(options = {}) {
    super(options);
  }
}
