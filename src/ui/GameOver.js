const COPY = {
	miss: { title: 'Missed', reason: 'The block found nothing to land on.' },
	crumbled: { title: 'Too narrow', reason: 'What was left was too thin to build on.' },
};

export class GameOver {
	constructor({ onAgain, onMenu }) {
		this.root = document.getElementById('over');
		this.title = document.getElementById('over-title');
		this.reason = document.getElementById('over-reason');
		this.scoreEl = document.getElementById('over-score');
		this.bestEl = document.getElementById('over-best');
		this.coinsEl = document.getElementById('over-coins');
		this.badge = document.getElementById('over-newbest');

		document.getElementById('btn-again').addEventListener('click', onAgain);
		document.getElementById('btn-over-menu').addEventListener('click', onMenu);
	}

	show({ score, best, coins, newBest, cause }) {
		const copy = COPY[cause] || COPY.miss;
		this.title.textContent = copy.title;
		this.reason.textContent = copy.reason;
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
