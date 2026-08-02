// Picked by pickTitle() based on how the run compares to the player's best — never the raw miss/crumble cause.
const TITLES = {
	newBest: ['New Best!', 'Incredible!', 'Unstoppable!', 'Record Smashed!', "You're on Fire!", 'Legendary!'],
	close: ['So Close!', 'Almost There!', 'Nearly a Record!', 'Right There!'],
	great: ['Nice!', 'Excellent!', 'Great Stack!', 'Well Played!', 'Solid Run!', 'Looking Good!'],
	okay: ['Good Try!', 'Keep Stacking!', 'Nice Start!', 'Onward!'],
	low: ['Warm It Up!', 'Shake It Off!', 'Try Again!', 'One More Go!'],
};

function pickTitle({ score, best, newBest }) {
	let pool;
	if (newBest) pool = TITLES.newBest;
	else if (score === 0) pool = TITLES.low;
	else {
		const ratio = best > 0 ? score / best : 1;
		pool = ratio >= 0.85 ? TITLES.close : ratio >= 0.5 ? TITLES.great : TITLES.okay;
	}
	return pool[Math.floor(Math.random() * pool.length)];
}

export class GameOver {
	constructor({ onAgain, onMenu, onShop }) {
		this.root = document.getElementById('over');
		this.title = document.getElementById('over-title');
		this.scoreEl = document.getElementById('over-score');
		this.bestEl = document.getElementById('over-best');
		this.coinsEl = document.getElementById('over-coins');
		this.badge = document.getElementById('over-newbest');

		document.getElementById('btn-again').addEventListener('click', onAgain);
		document.getElementById('btn-over-shop').addEventListener('click', onShop);
		document.getElementById('btn-over-menu').addEventListener('click', onMenu);
	}

	show({ score, best, coins, newBest }) {
		this.title.textContent = pickTitle({ score, best, newBest });
		this.scoreEl.textContent = score;
		this.bestEl.textContent = best;
		this.coinsEl.innerHTML = `<span class="coin-dot"></span>${coins}`;
		this.badge.classList.toggle('hidden', !newBest);
		this.root.classList.remove('hidden');
	}

	hide() {
		this.root.classList.add('hidden');
	}
}
