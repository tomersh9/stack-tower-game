import * as THREE from 'three';

export const BLOCK_H = 0.62;

// One unit box, reused by every block — scale carries the size.
const GEO = new THREE.BoxGeometry(1, 1, 1);
export const BLOCK_GEOMETRY = GEO;

/** Walks the skin palette so each layer shifts colour as the tower rises. */
export function colorForLayer(skin, index) {
	const n = skin.palette.length;
	const t = (((index * 0.075) % 1) + 1) % 1;
	const f = t * n;
	const a = Math.floor(f) % n;
	const b = (a + 1) % n;
	return new THREE.Color(skin.palette[a]).lerp(new THREE.Color(skin.palette[b]), f - a);
}

function materialFor(skin, color) {
	switch (skin.material) {
		case 'metal':
			return new THREE.MeshStandardMaterial({ color, metalness: 0.94, roughness: 0.24 });
		case 'glass':
			return new THREE.MeshPhysicalMaterial({
				color,
				metalness: 0,
				roughness: 0.08,
				transmission: 0.82,
				thickness: 1.1,
				ior: 1.45,
				transparent: true,
				opacity: 0.96,
			});
		case 'neon':
			return new THREE.MeshStandardMaterial({
				color,
				roughness: 0.35,
				metalness: 0.1,
				emissive: color,
				emissiveIntensity: 0.55,
			});
		default:
			return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04 });
	}
}

// Base white so per-layer palette colour comes purely from InstancedMesh.instanceColor (multiplied in).
export function createInstancedSkinMaterial(skin) {
	const material = materialFor(skin, new THREE.Color(0xffffff));
	// instanceColor (Three's `vColor` varying) only multiplies material.color, not emissive.
	// Any skin with a non-zero emissive would otherwise show a flat, uncoloured glow on every
	// instance instead of that layer's tint — patch emissive to follow instanceColor too.
	material.onBeforeCompile = shader => {
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <emissivemap_fragment>',
			'#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n\ttotalEmissiveRadiance *= vColor;\n#endif',
		);
	};
	return material;
}

export function createBlock(w, d, skin, index) {
	const color = colorForLayer(skin, index);
	const mesh = new THREE.Mesh(GEO, materialFor(skin, color));
	mesh.scale.set(w, BLOCK_H, d);
	mesh.userData.color = color;
	return mesh;
}

export function disposeBlock(mesh) {
	mesh.material.dispose();
}

// Frame thickness, in unit-box space (outline sits on a 1x1 face before scaling). Tweak to taste.
const TARGET_OUTLINE_THICKNESS = 0.04;

// How much bigger than the landing block the outline sits (1 = exact fit). Tweak to taste.
export const TARGET_OUTLINE_SCALE = 1.15;

/** Thin outline marking the landing surface, like the reference art. */
export function createTargetOutline() {
	const t = TARGET_OUTLINE_THICKNESS;
	const half = 0.5;
	const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
	const group = new THREE.Group();

	// Two bars spanning the full width (top/bottom edges) and two spanning the inset height (left/right edges).
	const edges = [
		{ w: 1, d: t, x: 0, z: -half + t / 2 },
		{ w: 1, d: t, x: 0, z: half - t / 2 },
		{ w: t, d: 1 - t * 2, x: -half + t / 2, z: 0 },
		{ w: t, d: 1 - t * 2, x: half - t / 2, z: 0 },
	];
	for (const { w, d, x, z } of edges) {
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
		mesh.rotation.x = -Math.PI / 2;
		mesh.position.set(x, 0, z);
		group.add(mesh);
	}

	group.renderOrder = 2;
	return group;
}
