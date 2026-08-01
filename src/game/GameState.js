export const STATES = { MENU: 'menu', PLAYING: 'playing', OVER: 'over', SHOP: 'shop' };

/** Tiny observable state machine; UI subscribes, gameplay just reads. */
export class GameState {
  constructor(initial = STATES.MENU) {
    this.value = initial;
    this.previous = null;
    this.listeners = new Set();
  }

  set(next) {
    if (next === this.value) return;
    this.previous = this.value;
    this.value = next;
    this.listeners.forEach((fn) => fn(next, this.previous));
  }

  is(...states) {
    return states.includes(this.value);
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
