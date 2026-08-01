/**
 * All sound is synthesised at runtime — no asset files, no loading.
 * Placements walk up a pentatonic ladder as the perfect-streak grows,
 * then drop back to the root when the streak breaks.
 */
const LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
const ROOT = 196; // G3

export class AudioSystem {
  constructor(storage) {
    this.storage = storage;
    this.ctx = null;
    this.master = null;
  }

  get muted() {
    return this.storage.data.muted;
  }

  toggleMute() {
    this.storage.update({ muted: !this.muted });
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  }

  /** Must be called from a user gesture — browsers require it. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone({ freq, type = 'triangle', dur = 0.18, gain = 0.16, slideTo = null, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  note(step, opts = {}) {
    const semis = LADDER[Math.min(step, LADDER.length - 1)];
    this.tone({ freq: ROOT * Math.pow(2, semis / 12), ...opts });
  }

  place(streak) {
    this.note(streak, { type: 'triangle', dur: 0.16, gain: 0.15 });
  }

  perfect(streak) {
    this.note(streak, { type: 'triangle', dur: 0.2, gain: 0.17 });
    this.note(streak + 3, { type: 'sine', dur: 0.28, gain: 0.1, delay: 0.045 });
  }

  coin() {
    this.tone({ freq: 1180, type: 'square', dur: 0.06, gain: 0.05 });
    this.tone({ freq: 1560, type: 'square', dur: 0.09, gain: 0.045, delay: 0.055 });
  }

  levelUp() {
    [0, 4, 7, 11].forEach((s, i) =>
      this.tone({ freq: 330 * Math.pow(2, s / 12), type: 'sine', dur: 0.3, gain: 0.11, delay: i * 0.07 })
    );
  }

  miss() {
    this.tone({ freq: 180, type: 'sawtooth', dur: 0.5, gain: 0.16, slideTo: 48 });
    this.tone({ freq: 92, type: 'square', dur: 0.42, gain: 0.1, slideTo: 34, delay: 0.02 });
  }

  purchase() {
    [0, 7, 12].forEach((s, i) =>
      this.tone({ freq: 392 * Math.pow(2, s / 12), type: 'triangle', dur: 0.26, gain: 0.12, delay: i * 0.06 })
    );
  }

  equip() {
    this.tone({ freq: 660, type: 'sine', dur: 0.14, gain: 0.11 });
  }

  deny() {
    this.tone({ freq: 150, type: 'square', dur: 0.16, gain: 0.1, slideTo: 110 });
  }
}
