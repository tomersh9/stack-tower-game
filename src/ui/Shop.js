import { cssGradient } from '../data/backgrounds.js';
import { CardPreview } from './CardPreview.js';

const swatchStyle = (kind, item) => (kind === 'backgrounds' ? cssGradient(item) : `linear-gradient(135deg, ${item.palette.join(', ')})`);

/** Price → rarity tier, purely cosmetic but drives the card's colour language. */
function rarityFor(price) {
	if (price === 0) return { key: 'starter', label: 'Starter' };
	if (price < 200) return { key: 'common', label: 'Common' };
	if (price < 500) return { key: 'rare', label: 'Rare' };
	if (price < 800) return { key: 'epic', label: 'Epic' };
	return { key: 'legendary', label: 'Legendary' };
}

export class Shop {
	constructor(economy, { onEquip, onClose, onSound }) {
		this.economy = economy;
		this.onEquip = onEquip;
		this.onSound = onSound;
		this.kind = 'skins';
		this.previews = [];
		this._raf = null;

		this.root = document.getElementById('shop');
		this.grid = document.getElementById('shop-grid');
		this.coinsEl = document.getElementById('shop-coins');
		this.msg = document.getElementById('shop-msg');
		this.tabs = [...document.querySelectorAll('.tab')];

		this.tabs.forEach(tab =>
			tab.addEventListener('click', () => {
				this.kind = tab.dataset.tab;
				this.tabs.forEach(t => t.classList.toggle('is-active', t === tab));
				this.msg.textContent = '';
				this.render();
			}),
		);
		document.getElementById('btn-shop-close').addEventListener('click', onClose);

		this.grid.addEventListener('click', e => {
			const card = e.target.closest('.card');
			if (card) this.select(card.dataset.id);
		});

		// Subtle pointer-tilt on cards — a small "toy in your hands" feel.
		this.grid.addEventListener('pointermove', e => {
			const card = e.target.closest('.card');
			if (!card) return;
			const rect = card.getBoundingClientRect();
			const px = (e.clientX - rect.left) / rect.width - 0.5;
			const py = (e.clientY - rect.top) / rect.height - 0.5;
			card.style.setProperty('--tilt-x', `${(-py * 8).toFixed(2)}deg`);
			card.style.setProperty('--tilt-y', `${(px * 8).toFixed(2)}deg`);
		});
		this.grid.addEventListener(
			'pointerleave',
			() => {
				this.grid.querySelectorAll('.card').forEach(card => {
					card.style.setProperty('--tilt-x', '0deg');
					card.style.setProperty('--tilt-y', '0deg');
				});
			},
			true,
		);
	}

	show(visible) {
		this.root.classList.toggle('hidden', !visible);
		if (visible) {
			this.msg.textContent = '';
			this.render();
			this._startLoop();
		} else {
			this._stopLoop();
			this._disposePreviews();
		}
	}

	select(id) {
		const kind = this.kind;
		if (!this.economy.owns(kind, id)) {
			const res = this.economy.buy(kind, id);
			if (!res.ok) {
				this.msg.textContent = res.reason;
				this.onSound?.('deny');
				return;
			}
			this.onSound?.('purchase');
		} else {
			this.onSound?.('equip');
		}
		this.economy.equip(kind, id);
		this.onEquip(kind, id);
		this.msg.textContent = '';
		this.render();
		this._celebrate(id);
	}

	render() {
		const kind = this.kind;
		this.coinsEl.textContent = this.economy.coins;
		this._disposePreviews();
		this.grid.innerHTML = '';

		const equippedSkin = this.economy.equippedSkin();

		this.economy.items(kind).forEach(item => {
			const owned = this.economy.owns(kind, item.id);
			const equipped = this.economy.isEquipped(kind, item.id);
			const canAfford = this.economy.coins >= item.price;
			const rarity = rarityFor(item.price);
			const locked = !owned && !canAfford;

			const card = document.createElement('button');
			card.className = `card card--${rarity.key}${equipped ? ' is-equipped' : ''}${locked ? ' is-locked' : ''}`;
			card.dataset.id = item.id;
			card.setAttribute('aria-pressed', String(equipped));

			const meta = equipped ? '<span class="card__check">✓</span> Equipped' : owned ? 'Tap to equip' : `<span class="coin-dot"></span>${item.price}`;

			card.innerHTML =
				`<span class="card__rarity">${rarity.label}</span>` +
				(equipped ? '<span class="card__badge">Equipped</span>' : '') +
				`<div class="card__swatch-wrap">` +
				`<canvas class="card__swatch" style="background:${swatchStyle(kind, item)}"></canvas>` +
				(locked ? '<span class="card__lock">🔒</span>' : '') +
				`</div>` +
				`<div class="card__name">${item.name}</div>` +
				`<div class="card__meta${!owned && !canAfford ? ' is-short' : ''}">${meta}</div>`;
			this.grid.appendChild(card);

			const canvas = card.querySelector('.card__swatch');
			const preview = new CardPreview(canvas, kind, item, { skin: equippedSkin });
			preview.start();
			this.previews.push(preview);
		});
	}

	_celebrate(id) {
		const card = this.grid.querySelector(`.card[data-id="${id}"]`);
		if (!card) return;
		card.classList.add('is-fresh');
		card.addEventListener('animationend', () => card.classList.remove('is-fresh'), { once: true });
	}

	_startLoop() {
		if (this._raf) return;
		let last = performance.now();
		const tick = now => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			this.previews.forEach(p => p.render(dt));
			this._raf = requestAnimationFrame(tick);
		};
		this._raf = requestAnimationFrame(tick);
	}

	_stopLoop() {
		if (this._raf) cancelAnimationFrame(this._raf);
		this._raf = null;
	}

	_disposePreviews() {
		this.previews.forEach(p => p.dispose());
		this.previews = [];
	}
}
