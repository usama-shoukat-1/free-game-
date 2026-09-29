import { GameManager } from './core/GameManager.js';

// Entry point bootstrap for AFTERLIGHT Phase 1 Baseline
const canvas = document.getElementById('renderCanvas');
const engineStatusEl = document.getElementById('engine-status');

async function bootstrap() {
  try {
    if (!canvas) {
      throw new Error('Canvas #renderCanvas not found');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gameManager = new GameManager({ canvas });
    await gameManager.init();

    if (gameManager.engine) {
      gameManager.engine.resize();
    }

    gameManager.start();

    if (engineStatusEl) {
      engineStatusEl.innerText = 'AFTERLIGHT Systems Online';
    }

    window.addEventListener('resize', () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      if (gameManager.engine) {
        gameManager.engine.resize();
      }
    });

    window.gameManager = gameManager;
    console.log('[AFTERLIGHT] Phase 1 Core Foundation running successfully');
  } catch (err) {
    console.error('Fatal initialization error:', err);
    if (engineStatusEl) {
      engineStatusEl.innerText = 'Boot Error: ' + err.message;
      engineStatusEl.style.color = '#ef4444';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
