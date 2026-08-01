import { SceneSetup } from './core/SceneSetup.js';
import { CameraRig } from './core/CameraRig.js';
import { Tower, PLINTH_DEPTH } from './game/Tower.js';
import { BLOCK_H } from './game/Block.js';
import { DebrisField } from './game/Debris.js';
import { Difficulty } from './game/Difficulty.js';
import { Scoring } from './game/Scoring.js';
import { GameState, STATES } from './game/GameState.js';
import { Storage } from './systems/Storage.js';
import { Economy } from './systems/Economy.js';
import { AudioSystem } from './systems/Audio.js';
import { Input } from './systems/Input.js';
import { Overlay } from './ui/Overlay.js';
import { Menu } from './ui/Menu.js';
import { Shop } from './ui/Shop.js';
import { GameOver } from './ui/GameOver.js';
import { FloatingCoins } from './ui/FloatingCoins.js';

// ── Wiring ──────────────────────────────────────────────────
const canvas = document.getElementById('scene');

const storage = new Storage();
const economy = new Economy(storage);
const audio = new AudioSystem(storage);

const sceneSetup = new SceneSetup(canvas);
const rig = new CameraRig(sceneSetup.camera);
const debris = new DebrisField(sceneSetup.scene);
const tower = new Tower(sceneSetup.scene, debris);
const floatingCoins = new FloatingCoins(sceneSetup.camera);

const difficulty = new Difficulty();
const scoring = new Scoring();
const state = new GameState(STATES.MENU);

const overlay = new Overlay(() => {
	audio.unlock();
	const muted = audio.toggleMute();
	overlay.setSoundIcon(muted);
	menu.setSound(muted);
});
let shopReturn = STATES.MENU;
let lastTier = 0;

const menu = new Menu({
	onPlay: () => startRun(),
	onShop: () => openShop(STATES.MENU),
	onToggleSound: () => {
		audio.unlock();
		const muted = audio.toggleMute();
		overlay.setSoundIcon(muted);
		menu.setSound(muted);
	},
});

const gameOver = new GameOver({
	onAgain: () => startRun(),
	onMenu: () => goMenu(),
});

const shop = new Shop(economy, {
	onEquip: kind => {
		if (kind === 'backgrounds') sceneSetup.applyTheme(economy.equippedBackground());
		else if (!state.is(STATES.PLAYING)) buildIdleTower();
	},
	onClose: () => closeShop(),
	onSound: name => audio[name]?.(),
});

new Input(
	() => handleDrop(),
	() => audio.unlock(),
);

// ── Screens ─────────────────────────────────────────────────
function goMenu() {
	state.set(STATES.MENU);
	gameOver.hide();
	shop.show(false);
	overlay.show(false);
	menu.show(true);
	menu.setStats(storage.data.highScore, economy.coins);
	menu.setSound(audio.muted);
	overlay.setSoundIcon(audio.muted);
	buildIdleTower();
}

function openShop(from) {
	shopReturn = from;
	state.set(STATES.SHOP);
	menu.show(false);
	gameOver.hide();
	overlay.show(false);
	shop.show(true);
}

function closeShop() {
	shop.show(false);
	if (shopReturn === STATES.OVER) {
		state.set(STATES.OVER);
		gameOver.root.classList.remove('hidden');
	} else {
		goMenu();
	}
}

/** A slow, unplayable tower behind the menu so the screen is never dead. */
function buildIdleTower() {
	tower.reset(economy.equippedSkin());
	tower.setOutlineVisible(false);
	tower.spawnMoving({ speed: 2.1 });
	rig.followSpeed = 3.6;
	rig.snap(tower.topY);
	sceneSetup.setZoom(1);
}

// ── Run lifecycle ───────────────────────────────────────────
function startRun() {
	audio.unlock();
	menu.show(false);
	gameOver.hide();
	shop.show(false);

	debris.clear();
	floatingCoins.clear();
	scoring.reset();
	lastTier = 0;
	tower.reset(economy.equippedSkin());
	tower.setOutlineVisible(true);

	overlay.show(true);
	overlay.setScore(0);
	overlay.setCoins(0);
	overlay.setTier(0, 0);
	overlay.setWarning(false);
	overlay.setSoundIcon(audio.muted);

	rig.followSpeed = 3.6;
	rig.snap(tower.topY);
	sceneSetup.setZoom(1);
	state.set(STATES.PLAYING);
	spawnNext();
}

function spawnNext() {
	const h = tower.height;
	tower.spawnMoving({
		speed: difficulty.speedFor(h),
		startFar: difficulty.randomStartSide(h),
	});
}

function handleDrop() {
	if (!state.is(STATES.PLAYING) || !tower.moving) return;

	const heightBefore = tower.height;
	const result = tower.drop(difficulty.toleranceFor(heightBefore));

	if (result.type === 'miss' || result.type === 'crumbled') {
		endRun(result.type);
		return;
	}

	const reward = scoring.register(result.type, difficulty.coinMultiplier(heightBefore));

	if (result.type === 'perfect') {
		audio.perfect(scoring.combo);
		overlay.flash(0.05 + Math.min(0.2, scoring.combo * 0.03));
		overlay.combo(reward.streakBonus ? `${scoring.combo}× perfect  +${reward.coins}` : `${scoring.combo}× perfect`);
		if (reward.streakBonus) {
			audio.coin();
			floatingCoins.spawn(reward.coins, { x: tower.top.x + tower.top.w / 2 + 2.6, y: tower.topY + 1.8, z: tower.top.z });
		}
		tower.pulseOutline();
	} else {
		audio.place(0);
	}

	const height = tower.height;
	const tier = difficulty.tierFor(height);
	if (tier > lastTier) {
		lastTier = tier;
		overlay.levelUp(`Tier ${tier + 1}`);
		overlay.flash(0.12);
		audio.levelUp();
	}

	overlay.setScore(scoring.score);
	overlay.setCoins(scoring.coins);
	overlay.setTier(tier, difficulty.tierProgress(height));
	overlay.setWarning(Boolean(result.critical));

	rig.setTarget(tower.topY);
	spawnNext();
}

function endRun(cause) {
	state.set(STATES.OVER);
	audio.miss();
	overlay.show(false);
	tower.setOutlineVisible(false);

	const newBest = scoring.score > storage.data.highScore;
	if (newBest) storage.data.highScore = scoring.score;
	storage.data.stats.runs += 1;
	storage.data.stats.bestCombo = Math.max(storage.data.stats.bestCombo, scoring.bestCombo);
	storage.save();
	economy.addCoins(scoring.coins);

	// Cinematic pull-back so the whole tower is visible behind the end screen.
	// The plinth's bottom is the hard floor for the view — never pan/zoom past it
	// or the empty backdrop below the tower would show through.
	// Tweak REVEAL_PAN_SPEED / sceneSetup.zoomSpeed to change how fast this plays out.
	const REVEAL_PAN_SPEED = 2.2;
	const plinthBottomY = -(PLINTH_DEPTH + 0.5) * BLOCK_H;
	const zoom = sceneSetup.zoomToFit(tower.topY - plinthBottomY);
	rig.followSpeed = REVEAL_PAN_SPEED;
	rig.setTarget(plinthBottomY + sceneSetup.baseViewHalfH * zoom);
	sceneSetup.setTargetZoom(zoom);

	gameOver.show({
		score: scoring.score,
		best: storage.data.highScore,
		coins: scoring.coins,
		newBest,
		cause,
	});
}

// ── Loop ────────────────────────────────────────────────────
let last = performance.now();

function frame(now) {
	const dt = Math.min(0.05, (now - last) / 1000);
	last = now;

	if (state.is(STATES.PLAYING, STATES.MENU)) tower.update(dt);
	debris.update(dt);
	rig.update(dt);
	sceneSetup.setStarsY(rig.currentY);
	sceneSetup.updateZoom(dt);
	floatingCoins.update(dt);
	overlay.update(dt);
	sceneSetup.render();

	requestAnimationFrame(frame);
}

sceneSetup.applyTheme(economy.equippedBackground());
goMenu();
requestAnimationFrame(frame);
