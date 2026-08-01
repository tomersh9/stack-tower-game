import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { colorForLayer, createSkinMaterial } from '../game/Block.js';

/**
 * Every shop card gets a tiny live Three.js render instead of a flat CSS
 * swatch. To avoid burning a WebGL context per card (browsers cap this
 * around 16, and the game itself already owns one), all previews share a
 * single off-screen renderer: each card renders into that shared canvas,
 * then blits the result onto its own 2D `<canvas>` via `drawImage`.
 */
const RENDER_W = 320;
const RENDER_H = 128;

let shared = null;

function getShared() {
	if (shared) return shared;
	const canvas = document.createElement('canvas');
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(1);
	renderer.setSize(RENDER_W, RENDER_H, false);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;

	const pmrem = new THREE.PMREMGenerator(renderer);
	const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	pmrem.dispose();

	shared = { renderer, envTexture };
	return shared;
}

/** Small vertical-gradient texture, same recipe as the real backdrop. */
function gradientTexture(stops) {
	const c = document.createElement('canvas');
	c.width = 8;
	c.height = 128;
	const ctx = c.getContext('2d');
	const g = ctx.createLinearGradient(0, 0, 0, c.height);
	stops.forEach(([pos, color]) => g.addColorStop(pos, color));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, c.width, c.height);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

function disposeObject(obj) {
	obj.traverse(child => {
		child.geometry?.dispose();
		if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
		else child.material?.dispose();
		if (child.material?.map) child.material.map.dispose();
	});
}

/** A single card's mini scene. Owns no GL context — draws via the shared one. */
export class CardPreview {
	constructor(canvas, kind, item, { skin } = {}) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.running = false;
		this.spin = Math.random() * Math.PI * 2;

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.5, -1.5, 0.1, 30);
		camera.position.set(2.6, 2.15, 2.6);
		camera.lookAt(0, 0.05, 0);

		const hemi = new THREE.HemisphereLight(0xffffff, 0x33334d, 1.2);
		const key = new THREE.DirectionalLight(0xffffff, 1.9);
		key.position.set(3, 4.5, 2.2);
		scene.add(hemi, key);
		scene.environment = getShared().envTexture;
		scene.environmentIntensity = 0.45;

		this.spinGroup = new THREE.Group();
		scene.add(this.spinGroup);

		this.scene = scene;
		this.camera = camera;
		this.hemi = hemi;

		if (kind === 'backgrounds') this._buildBackground(item, skin);
		else this._buildSkin(item);
	}

	_buildSkin(skin) {
		const layers = 3;
		for (let i = 0; i < layers; i++) {
			const color = colorForLayer(skin, i);
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.62, 1), createSkinMaterial(skin, color));
			const scale = 1 - i * 0.15;
			mesh.scale.x = scale;
			mesh.scale.z = scale;
			mesh.position.y = i * 0.62 - 0.62;
			this.spinGroup.add(mesh);
		}
	}

	_buildBackground(bg, skin) {
		this.hemi.color.set(bg.sky);
		this.hemi.groundColor.set(bg.ground);

		const backdrop = new THREE.Mesh(
			new THREE.PlaneGeometry(7, 4),
			new THREE.MeshBasicMaterial({ map: gradientTexture(bg.stops), depthWrite: false, fog: false }),
		);
		backdrop.position.set(0, 0.5, -2.1);
		this.scene.add(backdrop);

		const ground = new THREE.Mesh(new THREE.CircleGeometry(1.9, 28), new THREE.MeshStandardMaterial({ color: bg.ground, roughness: 0.95, metalness: 0 }));
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = -0.62;
		this.scene.add(ground);

		for (let i = 0; i < 2; i++) {
			const color = colorForLayer(skin, i);
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.62, 1), createSkinMaterial(skin, color));
			const scale = 1 - i * 0.2;
			mesh.scale.x = scale;
			mesh.scale.z = scale;
			mesh.position.y = i * 0.62 - 0.62;
			this.spinGroup.add(mesh);
		}

		const cfg = bg.stars || { count: 0 };
		const n = Math.min(50, cfg.count);
		if (n > 0) {
			const pos = new Float32Array(n * 3);
			for (let i = 0; i < n; i++) {
				pos[i * 3] = (Math.random() - 0.5) * 6;
				pos[i * 3 + 1] = 0.6 + Math.random() * 2.2;
				pos[i * 3 + 2] = -1.4 - Math.random() * 1.2;
			}
			const geo = new THREE.BufferGeometry();
			geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
			const mat = new THREE.PointsMaterial({
				color: cfg.color,
				size: 3,
				sizeAttenuation: false,
				transparent: true,
				opacity: cfg.opacity,
				depthWrite: false,
				fog: false,
			});
			this.scene.add(new THREE.Points(geo, mat));
		}
	}

	start() {
		this.running = true;
	}
	stop() {
		this.running = false;
	}

	/** Renders this card's scene into the shared GL canvas, then blits it. */
	render(dt) {
		if (!this.running) return;
		const { renderer } = getShared();

		this.spin += dt * 0.55;
		this.spinGroup.rotation.y = this.spin;

		renderer.render(this.scene, this.camera);

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const rect = this.canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round((rect.width || RENDER_W / 2) * dpr));
		const h = Math.max(1, Math.round((rect.height || RENDER_H / 2) * dpr));
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
		}
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(renderer.domElement, 0, 0, this.canvas.width, this.canvas.height);
	}

	dispose() {
		this.running = false;
		disposeObject(this.scene);
	}
}
