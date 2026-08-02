const COMBO_WINDOW = 0.4; // max seconds between the two "J" presses
const SAMPLE_INTERVAL = 0.5; // seconds between FPS recalculations

/** Hidden diagnostics panel — double-tap "J" to toggle. Shows FPS and device info. */
export class DevTools {
	constructor() {
		this.root = document.createElement('div');
		this.root.className = 'devtools hidden';
		document.body.appendChild(this.root);

		this.visible = false;
		this.frames = 0;
		this.sampleTimer = 0;
		this.fps = 0;
		this.lastJTime = -Infinity;
		this.gpu = this._readGPU();

		this._key = e => {
			if (e.code !== 'KeyJ' || e.repeat) return;
			if (document.activeElement?.closest('.panel, input, textarea')) return;
			const now = performance.now() / 1000;
			if (now - this.lastJTime <= COMBO_WINDOW) {
				this.lastJTime = -Infinity;
				this.toggle();
			} else {
				this.lastJTime = now;
			}
		};
		window.addEventListener('keydown', this._key);
	}

	toggle() {
		this.visible = !this.visible;
		this.root.classList.toggle('hidden', !this.visible);
		if (this.visible) this._render();
	}

	update(dt) {
		if (!this.visible) return;
		this.frames += 1;
		this.sampleTimer += dt;
		if (this.sampleTimer < SAMPLE_INTERVAL) return;
		this.fps = Math.round(this.frames / this.sampleTimer);
		this.frames = 0;
		this.sampleTimer = 0;
		this._render();
	}

	_readGPU() {
		try {
			const gl = document.createElement('canvas').getContext('webgl');
			const info = gl?.getExtension('WEBGL_debug_renderer_info');
			return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'n/a';
		} catch {
			return 'n/a';
		}
	}

	_render() {
		const nav = navigator;
		const rows = [
			['Platform', nav.platform || 'n/a'],
			['Cores', nav.hardwareConcurrency ?? 'n/a'],
			['Memory', nav.deviceMemory ? `${nav.deviceMemory} GB` : 'n/a'],
			['Connection', nav.connection?.effectiveType ?? 'n/a'],
			['Language', nav.language],
			['Pixel ratio', window.devicePixelRatio],
			['Screen', `${window.screen.width}×${window.screen.height}`],
			['Viewport', `${window.innerWidth}×${window.innerHeight}`],
			['GPU', this.gpu],
			['UA', nav.userAgent],
		];

		const rowsHtml = rows.map(([label, value]) => `<div class="devtools__row"><b>${label}</b><span>${value}</span></div>`).join('');
		this.root.innerHTML = `<div class="devtools__fps">${this.fps} fps</div>${rowsHtml}`;
	}

	dispose() {
		window.removeEventListener('keydown', this._key);
		this.root.remove();
	}
}
