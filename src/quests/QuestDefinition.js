/**
 * QuestDefinition.js - Static Quest Definition Schema
 */
export class QuestDefinition {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.title
   * @param {string} data.description
   * @param {string[]} data.objectives
   */
  constructor({ id, title, description = '', objectives = [] }) {
    if (!id || typeof id !== 'string') {
      throw new Error('QuestDefinition requires a valid string id');
    }
    if (!title || typeof title !== 'string') {
      throw new Error('QuestDefinition requires a valid string title');
    }
    if (!Array.isArray(objectives) || objectives.length === 0) {
      throw new Error('QuestDefinition requires a non-empty array of objectives');
    }

    this.id = id;
    this.title = title;
    this.description = description;
    this.objectives = [...objectives];
  }

  /**
   * Returns objective count
   * @returns {number}
   */
  get objectiveCount() {
    return this.objectives.length;
  }

  /**
   * Returns objective text by index
   * @param {number} index
   * @returns {string|null}
   */
  getObjective(index) {
    if (index >= 0 && index < this.objectives.length) {
      return this.objectives[index];
    }
    return null;
  }
}
