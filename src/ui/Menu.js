export class Menu {
	constructor({ onPlay, onShop, onToggleSound }) {
		this.root = document.getElementById('menu');
		this.bestEl = document.getElementById('best');
		this.coinsEl = document.getElementById('coins');
		this.soundBtn = document.getElementById('btn-sound');

		document.getElementById('btn-shop').addEventListener('click', onShop);
		this.soundBtn.addEventListener('click', onToggleSound);
	}

	show(visible) {
		this.root.classList.toggle('hidden', !visible);
	}

	setStats(best, coins) {
		this.bestEl.textContent = best;
		this.coinsEl.innerHTML = `<span class="coin-dot"></span>${coins}`;
	}

	setSound(muted) {
		this.soundBtn.textContent = muted ? 'Sound off' : 'Sound on';
	}
}
