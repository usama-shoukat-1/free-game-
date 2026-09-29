/**
 * QuestState.js - Runtime State of an Active/Completed Quest
 */
export class QuestState {
  /**
   * @param {string} questId
   * @param {number} [currentObjectiveIndex=0]
   * @param {boolean} [started=false]
   * @param {boolean} [completed=false]
   */
  constructor(questId, currentObjectiveIndex = 0, started = false, completed = false) {
    this.questId = questId;
    this.currentObjectiveIndex = currentObjectiveIndex;
    this.started = started;
    this.completed = completed;
    this.startTime = started ? Date.now() : null;
    this.completionTime = completed ? Date.now() : null;
  }

  /**
   * Serializes runtime state for saving
   * @returns {Object}
   */
  serialize() {
    return {
      questId: this.questId,
      currentObjectiveIndex: this.currentObjectiveIndex,
      started: this.started,
      completed: this.completed,
      startTime: this.startTime,
      completionTime: this.completionTime
    };
  }

  /**
   * Rehydrates runtime state from serialized data
   * @param {Object} data
   * @returns {QuestState}
   */
  static deserialize(data) {
    if (!data || !data.questId) {
      throw new Error('Invalid quest state data for deserialization');
    }
    const state = new QuestState(
      data.questId,
      typeof data.currentObjectiveIndex === 'number' ? data.currentObjectiveIndex : 0,
      Boolean(data.started),
      Boolean(data.completed)
    );
    state.startTime = data.startTime || null;
    state.completionTime = data.completionTime || null;
    return state;
  }
}
