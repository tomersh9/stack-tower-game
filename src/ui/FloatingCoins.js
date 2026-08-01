import * as THREE from 'three';

const FLOAT_DISTANCE = 1.6; // world units the text drifts upward over its life
const LIFETIME = 1.1; // seconds

/** DOM text projected from a 3D world position each frame — used for streak-bonus coin pop-ups. */
export class FloatingCoins {
	constructor(camera) {
		this.camera = camera;
		this.container = document.getElementById('floating-coins');
		this.items = [];
		this._v = new THREE.Vector3();
	}

	/** @param {number} amount coins to show @param {{x:number,y:number,z:number}} origin world position */
	spawn(amount, origin) {
		const el = document.createElement('div');
		el.className = 'floating-coin';
		el.innerHTML = `<span class="coin-dot"></span>+${amount}`;
		this.container.appendChild(el);
		this.items.push({ el, origin: { ...origin }, life: 0 });
	}

	update(dt) {
		for (let i = this.items.length - 1; i >= 0; i--) {
			const it = this.items[i];
			it.life += dt;
			const t = it.life / LIFETIME;
			if (t >= 1) {
				it.el.remove();
				this.items.splice(i, 1);
				continue;
			}

			this._v.set(it.origin.x, it.origin.y + t * FLOAT_DISTANCE, it.origin.z);
			this._v.project(this.camera);
			const x = (this._v.x * 0.5 + 0.5) * window.innerWidth;
			const y = (1 - (this._v.y * 0.5 + 0.5)) * window.innerHeight;

			const pop = Math.min(1, t / 0.15);
			const fade = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;

			it.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${0.8 + 0.2 * pop})`;
			it.el.style.opacity = fade.toFixed(3);
		}
	}

	/** Clears any in-flight pop-ups — call when a run resets. */
	clear() {
		this.items.forEach(it => it.el.remove());
		this.items = [];
	}
}
