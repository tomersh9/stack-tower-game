# Stack Tower — Copilot Instructions

Ketchapp-"Stack"-style tower-builder game built with vanilla JS + [Three.js](https://threejs.org/), bundled with Vite. No framework, no TypeScript, no test runner — plain ES modules.

See [README.md](../README.md) for gameplay overview, tuning knobs, and save-data schema. Don't duplicate that content here — link to it.

## Architecture

- `src/main.js` — wiring + game loop only. Owns the run lifecycle (menu → playing → over → shop) and connects systems together. Avoid putting game logic here; delegate to the modules below.
- `src/core/` — rendering: `SceneSetup.js` (renderer, orthographic camera + `zoom`/`zoomSpeed` for the end-of-run reveal, lights, backdrop themes), `CameraRig.js` (height-follow camera; `followSpeed` controls pan speed and is temporarily lowered for the reveal pan, then restored on the next run/menu).
- `src/game/` — gameplay logic: `Tower.js` (stack state; `computePlacement()` is a **pure function with no Three.js dependency** — keep it that way so placement rules stay testable), `Block.js` (geometry/materials), `Debris.js` (falling/tumbling trimmed pieces), `Difficulty.js` (speed/tolerance/tier curves), `Scoring.js` (score/combo/coins), `GameState.js` (`menu | playing | over | shop` state machine).
- `src/systems/` — cross-cutting concerns: `Storage.js` (versioned `localStorage`, see `migrate()`), `Economy.js` (coins/ownership/equipped cosmetics), `Audio.js` (WebAudio synth, no audio asset files), `Input.js` (pointer/touch/space → single drop signal).
- `src/data/` — content tables: `skins.js`, `backgrounds.js`. Adding a skin/background is a single new entry here; both show up in the shop automatically.
- `src/ui/` — plain DOM overlays (`Menu.js`, `Overlay.js`, `Shop.js`, `GameOver.js`), styled via `src/styles/ui.css`.

Keep this separation: Three.js/rendering code stays in `core/`; game rules stay pure/testable in `game/`; persistence and platform concerns stay in `systems/`.

## Conventions

- ES modules only (`type: "module"` in [package.json](../package.json)); no bundless global scripts.
- No TypeScript, no test framework currently present — don't introduce build-config changes for these without confirming with the user first.
- **Color palette**: Custom warm coral (#ff6b5a) primary, teal (#2fb8ac) secondary — **never use purple/violet AI colors** (#6c47ff etc.) as they look generic/corporate, not playful game UI.
- Tuning constants (difficulty curves, block sizes, streak bonuses) live in `Difficulty.js`, `Tower.js`, and `Scoring.js` as named constants — prefer adjusting those over hardcoding magic numbers inline.
- When changing the save-data shape, add a migration case in `Storage.migrate()`; never break old saves.

## Landed blocks & camera reveal

- `Tower.js` renders every **landed** layer through a single `THREE.InstancedMesh` (`this.placed`, capacity `MAX_PLACED_LAYERS`) instead of one `Mesh` per block — keeps a tall tower at one draw call. The currently-falling block and the fixed 12-layer decorative plinth stay regular `Mesh`es (bounded counts, not worth instancing).
- **Must set `instancedMesh.frustumCulled = false`** on `this.placed`. `InstancedMesh` computes its culling bounding sphere around the origin from the base geometry only — it does **not** account for per-instance transforms in `instanceMatrix`. Since the camera pans away from the origin as the tower grows, leaving culling on makes the _entire_ stack vanish at once past a certain height while the moving block (a separate mesh) stays visible. This bit twice — if you touch instancing anywhere in this codebase, keep frustum culling disabled for it.
- Game-over triggers a cinematic pull-back (`main.js` → `endRun()`): `rig.followSpeed` is temporarily lowered and `sceneSetup.setTargetZoom(sceneSetup.zoomToFit(tower.topY))` zooms the orthographic frustum out to reveal the whole tower behind the end screen. `startRun()`/`buildIdleTower()` must reset `rig.followSpeed` and call `sceneSetup.setZoom(1)` (instant, not animated) so the next run/menu isn't left zoomed out. Reveal speed is tunable via `sceneSetup.zoomSpeed` and the `REVEAL_PAN_SPEED` constant in `main.js`.

## Build and Run

- `npm install` — install dependencies (only `three` + `vite`).
- `npm run dev` — Vite dev server at `http://localhost:5173`.
- `npm run build` — production build to `dist/`.
- `npm run preview` — preview the production build.
