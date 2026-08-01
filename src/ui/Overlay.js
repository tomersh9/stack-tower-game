import { TIER_SIZE } from '../game/Difficulty.js';

/** The in-run HUD: height, coins, combo, tier hairline, flash pulse. */
export class Overlay {
	constructor(onToggleSound) {
		this.root = document.getElementById('hud');
		this.scoreEl = document.getElementById('score');
		this.coinsEl = document.getElementById('run-coins');
		this.comboEl = document.getElementById('combo');
		this.tierBar = document.getElementById('tierbar');
		this.tierLabel = document.getElementById('tierlabel');
		this.warnEl = document.getElementById('warning');
		this.levelEl = document.getElementById('levelup');
		this.flashEl = document.getElementById('flash');
		this.flashAmount = 0;
		this.soundBtn = document.getElementById('hud-sound');
		this.soundBtn.addEventListener('click', onToggleSound);
	}

	setSoundIcon(muted) {
		this.soundBtn.textContent = muted ? '🔇' : '🔊';
		this.soundBtn.classList.toggle('is-muted', muted);
	}

	show(visible) {
		this.root.classList.toggle('hidden', !visible);
		if (!visible) {
			this.setWarning(false);
			this.comboEl.classList.remove('is-on');
			this.comboEl.textContent = '';
			this.levelEl.classList.remove('is-on');
			this.levelEl.textContent = '';
		}
	}

	setScore(n) {
		this.scoreEl.textContent = n;
	}

	setCoins(n) {
		this.coinsEl.textContent = n;
	}

	setTier(tier, progress) {
		this.tierBar.style.width = `${Math.round(progress * 100)}%`;
		this.tierLabel.textContent = `tier ${tier + 1} · ${TIER_SIZE - Math.round(progress * TIER_SIZE)} to go`;
	}

	setWarning(on) {
		this.warnEl.classList.toggle('hidden', !on);
	}

	combo(text) {
		this.comboEl.textContent = text;
		this.comboEl.classList.remove('is-on');
		void this.comboEl.offsetWidth; // restart the animation
		this.comboEl.classList.add('is-on');
	}

	levelUp(text) {
		this.levelEl.textContent = text;
		this.levelEl.classList.remove('is-on');
		void this.levelEl.offsetWidth;
		this.levelEl.classList.add('is-on');
	}

	/** Streak-scaled screen pulse; intensity decays in update(). */
	flash(amount) {
		this.flashAmount = Math.min(0.25, this.flashAmount + amount);
	}

	update(dt) {
		if (this.flashAmount <= 0.001) {
			if (this.flashEl.style.opacity !== '0') this.flashEl.style.opacity = '0';
			return;
		}
		this.flashAmount *= Math.exp(-dt * 5.5);
		this.flashEl.style.opacity = this.flashAmount.toFixed(3);
	}
}
