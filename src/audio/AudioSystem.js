/**
 * AudioSystem.js - Procedural Web Audio Engine & Audio Hooks
 * Zero external audio assets required; synthesizes clean spatial/stereo SFX.
 */
export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.enabled = false;

    this.initContext();
  }

  initContext() {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
      } catch {
        this.enabled = false;
      }
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Footstep sound
   * @param {boolean} isRunning
   */
  playFootstep(isRunning = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isRunning ? 95 : 75, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(isRunning ? 0.25 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Jump sound
   */
  playJump() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Landing sound
   */
  playLand() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Flashlight click
   */
  playFlashlight(state) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(state ? 1200 : 800, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Item pickup chime
   */
  playPickup() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    [587.33, 880.0].forEach((freq, i) => { // D5 -> A5
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);

      gain.gain.setValueAtTime(0.2, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.22);
    });
  }

  /**
   * Gunshot sound
   */
  playGunshot() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // 1. Noise transient (gunshot crack)
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // 2. Low-frequency boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  /**
   * Reload sound
   */
  playReload() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    [300, 450, 600].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.25);

      gain.gain.setValueAtTime(0.15, t + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.25);
      osc.stop(t + i * 0.25 + 0.12);
    });
  }

  /**
   * Enemy alert / screech
   */
  playEnemyAlert() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(750, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Damage / Hit sound
   */
  playDamage() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  /**
   * Door open/close sound
   */
  playDoor() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }
}
