export const PERFECT_STREAK_BONUS_AT = 5; // every Nth perfect in a row pays extra

/** Score, combo and the coins a run has earned so far. No storage concerns. */
export class Scoring {
	constructor() {
		this.reset();
	}

	reset() {
		this.score = 0;
		this.combo = 0;
		this.bestCombo = 0;
		this.coins = 0;
		this.perfects = 0;
		this.placements = 0;
	}

	/**
	 * @param {'perfect'|'partial'} type
	 * @param {number} multiplier tier coin multiplier
	 * @returns {{coins:number, streakBonus:boolean}}
	 */
	register(type, multiplier) {
		this.score += 1;
		this.placements += 1;

		let coins = 1 * multiplier;
		let streakBonus = false;

		if (type === 'perfect') {
			this.combo += 1;
			this.perfects += 1;
			this.bestCombo = Math.max(this.bestCombo, this.combo);
			coins += 3 * multiplier;
			if (this.combo % PERFECT_STREAK_BONUS_AT === 0) {
				coins += 5 * multiplier;
				streakBonus = true;
			}
		} else {
			this.combo = 0;
		}

		coins = Math.round(coins);
		this.coins += coins;
		return { coins, streakBonus };
	}

	/** Share of placements that were not perfect — the genre's tension metric. */
	get missRate() {
		return this.placements ? 1 - this.perfects / this.placements : 0;
	}
}
