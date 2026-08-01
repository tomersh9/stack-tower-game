/**
 * Collapses pointer, touch and keyboard into one "drop" signal.
 * Anything inside the UI layer keeps its own click behaviour.
 */
export class Input {
	constructor(onDrop, onFirstGesture) {
		this.onDrop = onDrop;
		this.onFirstGesture = onFirstGesture;
		this.gestured = false;

		this._pointer = e => {
			if (e.target.closest('.panel, .btn, .card, .tab, .hud__sound')) return;
			this.fire();
		};
		this._key = e => {
			if (e.code !== 'Space' && e.code !== 'Enter') return;
			if (document.activeElement?.closest('.panel')) return;
			e.preventDefault();
			this.fire();
		};
		this._contextmenu = e => e.preventDefault();

		window.addEventListener('pointerdown', this._pointer);
		window.addEventListener('keydown', this._key);
		window.addEventListener('contextmenu', this._contextmenu);
	}

	fire() {
		if (!this.gestured) {
			this.gestured = true;
			this.onFirstGesture?.();
		}
		this.onDrop();
	}

	dispose() {
		window.removeEventListener('pointerdown', this._pointer);
		window.removeEventListener('keydown', this._key);
		window.removeEventListener('contextmenu', this._contextmenu);
	}
}
