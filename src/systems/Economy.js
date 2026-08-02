import { SKINS, getSkin } from '../data/skins.js';
import { BACKGROUNDS, getBackground } from '../data/backgrounds.js';

const CATALOG = { skins: SKINS, backgrounds: BACKGROUNDS };

/** Coins, ownership and what's currently equipped. Persists through Storage. */
export class Economy {
	constructor(storage) {
		this.storage = storage;
	}

	get coins() {
		return this.storage.data.coins;
	}

	addCoins(n) {
		this.storage.data.coins += n;
		this.storage.save();
		return this.coins;
	}

	items(kind) {
		return CATALOG[kind];
	}

	owns(kind, id) {
		return this.storage.data.owned[kind].includes(id);
	}

	isEquipped(kind, id) {
		return this.equippedId(kind) === id;
	}

	equippedId(kind) {
		return this.storage.data.equipped[kind === 'skins' ? 'skin' : 'background'];
	}

	equippedSkin() {
		return getSkin(this.storage.data.equipped.skin);
	}

	equippedBackground() {
		return getBackground(this.storage.data.equipped.background);
	}

	/** @returns {{ok:boolean, reason?:string}} */
	buy(kind, id) {
		const item = CATALOG[kind].find(i => i.id === id);
		if (!item) return { ok: false, reason: 'No such item.' };
		if (this.owns(kind, id)) return { ok: false, reason: 'Already owned.' };
		if (this.coins < item.price) {
			return { ok: false, reason: `${item.price - this.coins} more coins needed.` };
		}
		this.storage.data.coins -= item.price;
		this.storage.data.owned[kind].push(id);
		this.storage.save();
		return { ok: true, item };
	}

	equip(kind, id) {
		if (!this.owns(kind, id)) return false;
		this.storage.data.equipped[kind === 'skins' ? 'skin' : 'background'] = id;
		this.storage.save();
		return true;
	}
}
