import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Vertical gradient rendered to a canvas and used as the scene background. */
function gradientTexture(stops) {
	const c = document.createElement('canvas');
	c.width = 8;
	c.height = 512;
	const ctx = c.getContext('2d');
	const g = ctx.createLinearGradient(0, 0, 0, c.height);
	stops.forEach(([pos, color]) => g.addColorStop(pos, color));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, c.width, c.height);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

function starField(max = 2000) {
	// Matches CameraRig's fixed camera offset direction — the view axis never changes since
	// the rig only pans vertically, always looking from this same diagonal.
	const VIEW_DIR = new THREE.Vector3(30, 26, 30).normalize();
	const WORLD_UP = new THREE.Vector3(0, 1, 0);
	const right = new THREE.Vector3().crossVectors(VIEW_DIR, WORLD_UP).normalize();
	const up = new THREE.Vector3().crossVectors(right, VIEW_DIR).normalize();

	// Scatter stars directly in the camera's screen plane (within a generous multiple of the
	// visible frustum) instead of over a huge sphere. Spherical placement mostly lands stars far
	// outside what's actually on screen — only the ones whose position happened to line up near
	// the view axis were ever visible, which is why hundreds were needed before even one showed up.
	const SPREAD_X = 20;
	const SPREAD_Y = 24;
	const DEPTH = 60; // fixed distance behind the tower along the view axis, so stars never render in front of it

	const pos = new Float32Array(max * 3);
	const p = new THREE.Vector3();
	for (let i = 0; i < max; i++) {
		const sx = THREE.MathUtils.randFloatSpread(SPREAD_X * 2);
		const sy = THREE.MathUtils.randFloatSpread(SPREAD_Y * 2);
		p.set(0, 0, 0).addScaledVector(right, sx).addScaledVector(up, sy).addScaledVector(VIEW_DIR, -DEPTH);

		pos[i * 3] = p.x;
		pos[i * 3 + 1] = p.y;
		pos[i * 3 + 2] = p.z;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const mat = new THREE.PointsMaterial({
		size: 2.4,
		sizeAttenuation: false,
		transparent: true,
		depthWrite: false,
		fog: false,
	});
	const points = new THREE.Points(geo, mat);
	points.frustumCulled = false;
	return points;
}

export class SceneSetup {
	constructor(canvas) {
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.05;

		// Orthographic keeps the isometric read of the reference art.
		this.baseViewHalfW = 6.2;
		this.baseViewHalfH = 7.4;
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
		this.camera.position.set(30, 26, 30);
		this.camera.lookAt(0, 0, 0);

		this.hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.15);
		this.key = new THREE.DirectionalLight(0xffffff, 1.9);
		this.key.position.set(14, 22, 9);
		this.fill = new THREE.DirectionalLight(0xffffff, 0.45);
		this.fill.position.set(-16, 7, -12);
		this.scene.add(this.hemi, this.key, this.fill);

		// Cheap IBL so metal and glass skins read as metal and glass.
		const pmrem = new THREE.PMREMGenerator(this.renderer);
		this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		this.scene.environmentIntensity = 0.4;
		pmrem.dispose();

		this.starGroup = new THREE.Group();
		this.stars = starField();
		this.starGroup.add(this.stars);
		this.scene.add(this.starGroup);

		this.zoom = 1;
		this.targetZoom = 1;
		this.zoomSpeed = 3.2; // higher = snappier zoom-out/in lerp; tweak freely per-instance

		this._onResize = () => this.resize();
		window.addEventListener('resize', this._onResize);
		this.resize();
	}

	applyTheme(bg) {
		if (this.scene.background?.dispose) this.scene.background.dispose();
		this.scene.background = gradientTexture(bg.stops);
		this.scene.fog = new THREE.Fog(new THREE.Color(bg.fog), 34, 130);
		this.hemi.color.set(bg.sky);
		this.hemi.groundColor.set(bg.ground);
		this.key.color.set(bg.key);

		const s = bg.stars || { count: 0, color: '#fff', opacity: 0 };
		this.stars.geometry.setDrawRange(0, s.count);
		this.stars.material.color.set(s.color);
		this.stars.material.opacity = s.opacity;
		this.stars.visible = s.count > 0;

		document.body.dataset.ui = bg.ui;
	}

	/** Keeps the star shell centred on whatever the camera is looking at. */
	setStarsY(y) {
		this.starGroup.position.y = y;
	}

	/** Frustum half-height (world units, at zoom 1) needed to fit a given world-space height. */
	zoomToFit(worldHeight, margin = 1.25) {
		return Math.max(1, (worldHeight * margin) / (this.baseViewHalfH * 2));
	}

	setTargetZoom(zoom) {
		this.targetZoom = zoom;
	}

	/** Snaps zoom immediately, skipping the lerp — used when starting a fresh run. */
	setZoom(zoom) {
		this.zoom = zoom;
		this.targetZoom = zoom;
		this.resize();
	}

	updateZoom(dt) {
		if (Math.abs(this.zoom - this.targetZoom) < 0.001) return;
		this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * this.zoomSpeed);
		this.resize();
	}

	resize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const aspect = w / h;

		// Scale down frustum on smaller screens to make tiles appear bigger
		let scale = 1.0;
		if (w < 480) {
			scale = 0.7; // Mobile: significantly zoomed in
		} else if (w < 768) {
			scale = 0.82; // Tablet: moderately zoomed in
		}
		scale *= this.zoom;

		const viewHalfW = this.baseViewHalfW * scale;
		const viewHalfH = this.baseViewHalfH * scale;

		const halfH = Math.max(viewHalfH, viewHalfW / aspect);
		const halfW = halfH * aspect;
		this.camera.left = -halfW;
		this.camera.right = halfW;
		this.camera.top = halfH;
		this.camera.bottom = -halfH;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
	}

	render() {
		this.renderer.render(this.scene, this.camera);
	}
}
