import { DEFAULT_SKIN } from '../data/skins.js';
import { DEFAULT_BACKGROUND } from '../data/backgrounds.js';

const KEY = 'stacktower.save';
export const SCHEMA_VERSION = 1;

const defaults = () => ({
  schemaVersion: SCHEMA_VERSION,
  highScore: 0,
  coins: 0,
  owned: { skins: [DEFAULT_SKIN], backgrounds: [DEFAULT_BACKGROUND] },
  equipped: { skin: DEFAULT_SKIN, background: DEFAULT_BACKGROUND },
  muted: false,
  stats: { runs: 0, bestCombo: 0 }
});

/**
 * Versioned localStorage wrapper. Add a case to `migrate` when the shape
 * changes and old saves keep working.
 */
export class Storage {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      return this.migrate(JSON.parse(raw));
    } catch {
      return defaults();
    }
  }

  migrate(data) {
    const base = defaults();
    if (!data || typeof data !== 'object') return base;
    // switch (data.schemaVersion) { case 1: ... } — future migrations land here.
    return {
      ...base,
      ...data,
      schemaVersion: SCHEMA_VERSION,
      owned: { ...base.owned, ...(data.owned || {}) },
      equipped: { ...base.equipped, ...(data.equipped || {}) },
      stats: { ...base.stats, ...(data.stats || {}) }
    };
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* private mode / quota — the game still plays, it just forgets. */
    }
  }

  update(patch) {
    Object.assign(this.data, patch);
    this.save();
  }

  reset() {
    this.data = defaults();
    this.save();
  }
}
