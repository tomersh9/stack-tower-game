export const TIER_SIZE = 10;

const CONFIG = {
	baseSpeed: 3.4,
	speedGrowth: 1.55,
	maxSpeed: 11.5,
	baseTolerance: 0.2,
	minTolerance: 0.06,
	toleranceDecay: 0.0095,
	maxCoinMultiplier: 5,
};

/**
 * Everything that ramps with height lives here, so tuning the curve never
 * means touching gameplay code.
 */
export class Difficulty {
	constructor(cfg = {}) {
		this.cfg = { ...CONFIG, ...cfg };
	}

	/** Smooth log ramp with a hard ceiling — fast, but never impossible. */
	speedFor(height) {
		const { baseSpeed, speedGrowth, maxSpeed } = this.cfg;
		return Math.min(maxSpeed, baseSpeed + speedGrowth * Math.log(1 + height));
	}

	/** The window that still counts as a perfect placement, tightening slowly. */
	toleranceFor(height) {
		const { baseTolerance, minTolerance, toleranceDecay } = this.cfg;
		return Math.max(minTolerance, baseTolerance - toleranceDecay * Math.log(1 + height));
	}

	tierFor(height) {
		return Math.floor(height / TIER_SIZE);
	}

	/** Progress through the current tier, 0..1 — drives the HUD hairline. */
	tierProgress(height) {
		return (height % TIER_SIZE) / TIER_SIZE;
	}

	coinMultiplier(height) {
		return Math.min(this.cfg.maxCoinMultiplier, 1 + this.tierFor(height));
	}

	/** From tier 2 the block may start on either side — no rhythm to memorise. */
	randomStartSide(height) {
		return this.tierFor(height) >= 2 && Math.random() < 0.5;
	}
}
