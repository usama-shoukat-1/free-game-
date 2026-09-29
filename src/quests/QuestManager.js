import { QuestDefinition } from './QuestDefinition.js';
import { QuestState } from './QuestState.js';

/**
 * QuestManager.js - Central Quest & Scenario Progression Coordinator
 */
export class QuestManager {
  constructor() {
    /** @type {Map<string, QuestDefinition>} */
    this.definitions = new Map();
    /** @type {Map<string, QuestState>} */
    this.states = new Map();
    /** @type {string|null} */
    this.activeQuestId = null;
    /** @type {Array<Function>} */
    this.listeners = [];

    this.registerDefaultQuests();
  }

  registerDefaultQuests() {
    // 1. Foundation Test Quest (Preserved for Phase 1 tests)
    const testQuest = new QuestDefinition({
      id: 'test_quest',
      title: 'Test Quest',
      description: 'Verify core movement and interaction gameplay foundation.',
      objectives: [
        'Reach the test location',
        'Interact with the test object'
      ]
    });
    this.registerQuest(testQuest);

    // 2. Step 2 Vertical Slice Main Scenario Quest
    const blackoutQuest = new QuestDefinition({
      id: 'operation_blackout',
      title: 'Operation: Blackout Protocol',
      description: 'Investigate grid failure across Old City, salvage supplies and restore emergency power.',
      objectives: [
        'Exit the Safehouse and explore the darkened district',
        'Turn on Flashlight [F] and search the alley supply crate',
        'Investigate the Emergency Power Terminal at the Substation',
        'Test the Patrol Rover and return to Safehouse perimeter'
      ]
    });
    this.registerQuest(blackoutQuest);
  }

  registerQuest(questDef) {
    if (!(questDef instanceof QuestDefinition)) {
      throw new Error('Quest definition must be an instance of QuestDefinition');
    }
    this.definitions.set(questDef.id, questDef);
  }

  startQuest(questId) {
    const def = this.definitions.get(questId);
    if (!def) {
      throw new Error(`Cannot start unknown quest ID: "${questId}"`);
    }

    const state = new QuestState(questId, 0, true, false);
    this.states.set(questId, state);
    this.activeQuestId = questId;

    this.notify({ type: 'QUEST_STARTED', questId, state, def });
    return state;
  }

  getActiveQuest() {
    if (!this.activeQuestId) return null;
    const def = this.definitions.get(this.activeQuestId);
    const state = this.states.get(this.activeQuestId);
    if (!def || !state) return null;
    return { definition: def, state };
  }

  getQuestState(questId) {
    return this.states.get(questId) || null;
  }

  getQuestDefinition(questId) {
    return this.definitions.get(questId) || null;
  }

  advanceObjective(questId) {
    const def = this.definitions.get(questId);
    const state = this.states.get(questId);

    if (!def || !state) {
      throw new Error(`Cannot advance unknown or unstarted quest: "${questId}"`);
    }

    if (state.completed) {
      throw new Error(`Cannot advance already completed quest: "${questId}"`);
    }

    const nextIndex = state.currentObjectiveIndex + 1;

    if (nextIndex >= def.objectiveCount) {
      state.currentObjectiveIndex = def.objectiveCount - 1;
      state.completed = true;
      state.completionTime = Date.now();
      if (this.activeQuestId === questId) {
        this.activeQuestId = null;
      }
      this.notify({ type: 'QUEST_COMPLETED', questId, state, def });
      console.log(`[Quest] "${def.title}" COMPLETED!`);
    } else {
      state.currentObjectiveIndex = nextIndex;
      this.notify({ type: 'OBJECTIVE_ADVANCED', questId, state, def, currentObjectiveIndex: nextIndex });
      console.log(`[Quest] Advanced "${def.title}" to: ${def.getObjective(nextIndex)}`);
    }

    return state;
  }

  completeQuest(questId) {
    const def = this.definitions.get(questId);
    const state = this.states.get(questId);

    if (!def || !state) {
      throw new Error(`Cannot complete unknown or unstarted quest: "${questId}"`);
    }

    if (state.completed) return state;

    state.currentObjectiveIndex = def.objectiveCount - 1;
    state.completed = true;
    state.completionTime = Date.now();
    if (this.activeQuestId === questId) {
      this.activeQuestId = null;
    }

    this.notify({ type: 'QUEST_COMPLETED', questId, state, def });
    return state;
  }

  isQuestCompleted(questId) {
    const state = this.states.get(questId);
    return state ? state.completed : false;
  }

  serialize() {
    const active = this.getActiveQuest();
    const statesArray = [];
    for (const [id, state] of this.states.entries()) {
      statesArray.push(state.serialize());
    }

    return {
      activeQuestId: this.activeQuestId,
      currentObjectiveIndex: active ? active.state.currentObjectiveIndex : 0,
      completed: active ? active.state.completed : false,
      states: statesArray
    };
  }

  deserialize(data) {
    if (!data) return;

    this.states.clear();
    this.activeQuestId = data.activeQuestId || null;

    if (Array.isArray(data.states)) {
      for (const item of data.states) {
        const state = QuestState.deserialize(item);
        this.states.set(state.questId, state);
      }
    } else if (data.activeQuestId) {
      const state = new QuestState(
        data.activeQuestId,
        data.currentObjectiveIndex || 0,
        true,
        Boolean(data.completed)
      );
      this.states.set(data.activeQuestId, state);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in quest listener:', err);
      }
    }
  }
}
