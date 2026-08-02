import { colorForLayer } from '../game/Block.js';

/**
 * Shop cards used to each carry a tiny live Three.js/WebGL render — cute, but
 * a real GPU cost multiplied by dozens of cards. This draws a cheap 2D
 * isometric block-stack illustration instead: three flat-shaded faces per
 * cube (top/left/right), tinted per material so metal/glass/neon skins still
 * read distinctly, all on plain Canvas2D with no GL context involved.
 */
const TAU = Math.PI * 2;

function lighten(color, amount) {
	return color.clone().offsetHSL(0, 0, amount);
}
function darken(color, amount) {
	return lighten(color, -amount);
}
function hex(color) {
	return `#${color.getHexString()}`;
}

/** Draws one iso cube face-by-face; `spin` gently reshades left/right faces to fake rotation. */
function drawCube(ctx, cx, topY, halfW, blockH, color, material, spin) {
	const halfD = halfW * 0.55;
	const top = { x: cx, y: topY };
	const right = { x: cx + halfW, y: topY + halfD };
	const bottom = { x: cx, y: topY + halfD * 2 };
	const left = { x: cx - halfW, y: topY + halfD };
	const wobble = Math.sin(spin) * 0.08;

	const glow = material === 'neon';
	if (glow) {
		ctx.save();
		ctx.shadowColor = hex(color);
		ctx.shadowBlur = 14;
	}

	ctx.globalAlpha = material === 'glass' ? 0.72 : 1;

	ctx.beginPath();
	ctx.moveTo(left.x, left.y);
	ctx.lineTo(bottom.x, bottom.y);
	ctx.lineTo(bottom.x, bottom.y + blockH);
	ctx.lineTo(left.x, left.y + blockH);
	ctx.closePath();
	ctx.fillStyle = hex(darken(color, 0.1 - wobble * 0.6));
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(right.x, right.y);
	ctx.lineTo(bottom.x, bottom.y);
	ctx.lineTo(bottom.x, bottom.y + blockH);
	ctx.lineTo(right.x, right.y + blockH);
	ctx.closePath();
	ctx.fillStyle = hex(darken(color, 0.28 + wobble * 0.6));
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(top.x, top.y);
	ctx.lineTo(right.x, right.y);
	ctx.lineTo(bottom.x, bottom.y);
	ctx.lineTo(left.x, left.y);
	ctx.closePath();
	ctx.fillStyle = hex(lighten(color, 0.22));
	ctx.fill();

	if (material === 'metal') {
		ctx.globalAlpha = 0.3;
		ctx.beginPath();
		ctx.moveTo(top.x, top.y);
		ctx.lineTo((top.x + right.x) / 2, (top.y + right.y) / 2);
		ctx.lineTo((bottom.x + right.x) / 2, (bottom.y + right.y) / 2);
		ctx.lineTo(bottom.x, bottom.y);
		ctx.closePath();
		ctx.fillStyle = '#ffffff';
		ctx.fill();
	} else if (material === 'glass') {
		ctx.globalAlpha = 0.5;
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(top.x, top.y);
		ctx.lineTo(right.x, right.y);
		ctx.lineTo(bottom.x, bottom.y);
		ctx.lineTo(left.x, left.y);
		ctx.closePath();
		ctx.stroke();
	}

	ctx.globalAlpha = 1;
	if (glow) ctx.restore();
}

/** A single card's cheap 2D illustration — owns no GL context, just a canvas. */
export class CardPreview {
	constructor(canvas, kind, item, { skin } = {}) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.running = false;
		this.kind = kind;
		this.item = item;
		this.skin = kind === 'backgrounds' ? skin : item;
		this.spin = Math.random() * TAU;
		this.bob = Math.random() * TAU;
	}

	start() {
		this.running = true;
	}
	stop() {
		this.running = false;
	}

	render(dt) {
		if (!this.running) return;
		this.spin += dt * 0.6;
		this.bob += dt * 1.4;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const rect = this.canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round((rect.width || 160) * dpr));
		const h = Math.max(1, Math.round((rect.height || 64) * dpr));
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
		}
		this.ctx.clearRect(0, 0, w, h);

		if (this.kind === 'backgrounds') this._drawBackground(w, h);
		else this._drawStack(w, h, this.item, 3, 0.42, 0.16, 0.92);
	}

	_drawBackground(w, h) {
		const ctx = this.ctx;
		const bg = this.item;

		ctx.globalAlpha = 0.85;
		ctx.fillStyle = bg.ground;
		ctx.beginPath();
		ctx.ellipse(w * 0.5, h * 0.86, w * 0.42, h * 0.16, 0, 0, TAU);
		ctx.fill();
		ctx.globalAlpha = 1;

		const starCfg = bg.stars || { count: 0, color: '#fff', opacity: 0 };
		const n = Math.min(18, Math.round(starCfg.count / 3));
		ctx.fillStyle = starCfg.color;
		for (let i = 0; i < n; i++) {
			const sx = (((i * 53) % 100) / 100) * w;
			const sy = (((i * 37) % 60) / 100) * h;
			ctx.globalAlpha = starCfg.opacity * (0.5 + 0.5 * Math.sin(this.spin + i));
			ctx.beginPath();
			ctx.arc(sx, sy, 1.2, 0, TAU);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		this._drawStack(w, h, this.skin, 2, 0.38, 0.2, 0.85);
	}

	/** Stacks `layers` cubes narrowing upward, coloured via the skin's palette walk. */
	_drawStack(w, h, skin, layers, halfWRatio, shrink, groundRatio) {
		const ctx = this.ctx;
		const cx = w * 0.5;
		const bobOffset = Math.sin(this.bob) * h * 0.02;
		// Sized off h (not w) so wide/short cards don't blow past the canvas height.
		const baseHalfW = h * halfWRatio;
		const blockH = h * 0.17;
		// Front vertex each block's footprint must land on — starts at the ground, then
		// becomes the front corner of the block below's top face so they sit flush.
		let contactY = h * groundRatio + bobOffset;
		for (let i = 0; i < layers; i++) {
			const halfW = baseHalfW * (1 - i * shrink);
			const halfD = halfW * 0.55;
			const topY = contactY - halfD * 2 - blockH;
			drawCube(ctx, cx, topY, halfW, blockH, colorForLayer(skin, i), skin.material, this.spin + i);
			contactY = topY + halfD * 2;
		}
	}

	dispose() {
		this.running = false;
	}
}
