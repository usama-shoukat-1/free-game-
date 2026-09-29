import { GameConfig } from '../config/GameConfig.js';

/**
 * SaveManager.js - Robust Save / Load System with Versioned Schema & Validation
 */
export class SaveManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.storageKey]
   * @param {string} [options.version]
   */
  constructor(options = {}) {
    this.storageKey = options.storageKey || GameConfig.saveKey;
    this.saveVersion = options.version || GameConfig.saveVersion;
    
    // Memory storage fallback when localStorage is unavailable (e.g., headless Node.js tests)
    this.memoryStore = new Map();
  }

  /**
   * Determines if browser localStorage is available
   * @returns {boolean}
   */
  hasLocalStorage() {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
    } catch {
      return false;
    }
  }

  /**
   * Internal storage getter
   * @param {string} key
   * @returns {string|null}
   */
  getItem(key) {
    if (this.hasLocalStorage()) {
      return window.localStorage.getItem(key);
    }
    return this.memoryStore.get(key) || null;
  }

  /**
   * Internal storage setter
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    if (this.hasLocalStorage()) {
      window.localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  /**
   * Internal storage remover
   * @param {string} key
   */
  removeItem(key) {
    if (this.hasLocalStorage()) {
      window.localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  /**
   * Validates save data integrity and schema
   * @param {any} data
   * @returns {{ valid: boolean, error?: string }}
   */
  validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Save data is null or not an object' };
    }

    if (!data.saveVersion || typeof data.saveVersion !== 'string') {
      return { valid: false, error: 'Missing or invalid saveVersion' };
    }

    // Version major check
    const saveMajor = data.saveVersion.split('.')[0];
    const currentMajor = this.saveVersion.split('.')[0];
    if (saveMajor !== currentMajor) {
      return { valid: false, error: `Incompatible save version: ${data.saveVersion} (expected major ${currentMajor})` };
    }

    if (!data.player || typeof data.player !== 'object') {
      return { valid: false, error: 'Missing player state block' };
    }

    if (!Array.isArray(data.player.position) || data.player.position.length !== 3) {
      return { valid: false, error: 'Invalid player position format' };
    }

    return { valid: true };
  }

  /**
   * Serializes and writes game state to storage
   * @param {Object} state - { player, quest, meta }
   * @returns {boolean} success
   */
  save(state) {
    try {
      if (!state || !state.player) {
        throw new Error('Save state must contain player data');
      }

      const payload = {
        saveVersion: this.saveVersion,
        timestamp: Date.now(),
        player: {
          position: Array.isArray(state.player.position) 
            ? state.player.position 
            : [state.player.position.x || 0, state.player.position.y || 0, state.player.position.z || 0],
          rotation: Array.isArray(state.player.rotation)
            ? state.player.rotation
            : [state.player.rotation?.x || 0, state.player.rotation?.y || 0, state.player.rotation?.z || 0, state.player.rotation?.w || 1],
          health: typeof state.player.health === 'number' ? state.player.health : 100,
          isCrouching: Boolean(state.player.isCrouching)
        },
        quest: state.quest || {
          activeQuestId: null,
          currentObjectiveIndex: 0,
          completed: false
        },
        meta: {
          savedAt: new Date().toISOString(),
          ...state.meta
        }
      };

      const validation = this.validateSaveData(payload);
      if (!validation.valid) {
        console.error('Save failed validation:', validation.error);
        return false;
      }

      const serialized = JSON.stringify(payload);
      this.setItem(this.storageKey, serialized);
      console.log(`[SaveManager] Saved game successfully (v${this.saveVersion})`);
      return true;
    } catch (err) {
      console.error('[SaveManager] Critical error during save:', err);
      return false;
    }
  }

  /**
   * Loads and validates game state from storage
   * @returns {Object|null}
   */
  load() {
    try {
      const raw = this.getItem(this.storageKey);
      if (!raw) {
        console.log('[SaveManager] No save data found');
        return null;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (jsonErr) {
        console.warn('[SaveManager] Corrupted JSON in save storage, discarding safely:', jsonErr.message);
        return null;
      }

      const validation = this.validateSaveData(parsed);
      if (!validation.valid) {
        console.warn('[SaveManager] Save data failed validation, rejecting:', validation.error);
        return null;
      }

      console.log(`[SaveManager] Successfully loaded save data from ${parsed.meta?.savedAt || 'unknown date'}`);
      return parsed;
    } catch (err) {
      console.error('[SaveManager] Unexpected error loading save data:', err);
      return null;
    }
  }

  /**
   * Checks if valid save exists
   * @returns {boolean}
   */
  hasSave() {
    return this.load() !== null;
  }

  /**
   * Deletes saved game data
   */
  clear() {
    this.removeItem(this.storageKey);
    console.log('[SaveManager] Save data cleared');
  }
}
