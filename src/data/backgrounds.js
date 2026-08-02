/**
 * Backdrop themes. `stops` builds the vertical gradient texture used as the
 * scene background; `sky`/`ground`/`key` drive the lights so the blocks sit in
 * the same light as the backdrop. `ui` picks light or dark HUD ink.
 */
export const BACKGROUNDS = [
	{
		id: 'sunset',
		name: 'Sunset',
		price: 0,
		ui: 'light',
		stops: [
			[0, '#2b1055'],
			[0.45, '#a53a7a'],
			[0.78, '#ff8a5c'],
			[1, '#ffd2a1'],
		],
		fog: '#c86a86',
		sky: '#ffd9c0',
		ground: '#4a2a6b',
		key: '#fff2e0',
		stars: { count: 70, color: '#ffffff', opacity: 0.75 },
	},
	{
		id: 'meadow',
		name: 'Meadow',
		price: 350,
		ui: 'dark',
		stops: [
			[0, '#2f6b4f'],
			[0.5, '#7fb87a'],
			[1, '#f4e7a1'],
		],
		fog: '#8fbf83',
		sky: '#f3f0cf',
		ground: '#2f6b4f',
		key: '#ffffff',
		stars: { count: 34, color: '#ffffff', opacity: 0.5 },
	},
	{
		id: 'dawn',
		name: 'Dawn',
		price: 710,
		ui: 'dark',
		stops: [
			[0, '#f4f6e2'],
			[0.42, '#dff0ef'],
			[0.75, '#a8d8ea'],
			[1, '#f3c7dd'],
		],
		fog: '#cfe4ec',
		sky: '#ffffff',
		ground: '#a8d8ea',
		key: '#fff8f0',
		stars: { count: 26, color: '#ffffff', opacity: 0.55 },
	},
	{
		id: 'neon',
		name: 'Neon Night',
		price: 1440,
		ui: 'light',
		stops: [
			[0, '#1b0630'],
			[0.4, '#4a1273'],
			[0.72, '#a51f6d'],
			[1, '#ff8a3d'],
		],
		fog: '#5a1a6b',
		sky: '#c9a6ff',
		ground: '#1b0630',
		key: '#ffd6f5',
		stars: { count: 190, color: '#ffffff', opacity: 0.95 },
	},
	{
		id: 'desert-sun',
		name: 'Desert Sun',
		price: 2920,
		ui: 'dark',
		stops: [
			[0, '#fff5e1'],
			[0.35, '#ffe4b5'],
			[0.65, '#f4d4a3'],
			[1, '#e8c292'],
		],
		fog: '#f4ddc4',
		sky: '#fffaf0',
		ground: '#e8c292',
		key: '#ffffff',
		stars: { count: 12, color: '#ffffff', opacity: 0.3 },
	},
	{
		id: 'desert-night',
		name: 'Desert Night',
		price: 5920,
		ui: 'light',
		stops: [
			[0, '#1e3a5f'],
			[0.4, '#4a5c7a'],
			[0.7, '#8b6f8f'],
			[1, '#c98474'],
		],
		fog: '#5d6d8a',
		sky: '#a8b5d4',
		ground: '#1e3a5f',
		key: '#e8d4c9',
		stars: { count: 140, color: '#ffe5b4', opacity: 0.85 },
	},
	{
		id: 'blackout',
		name: 'Blackout',
		price: 12000,
		ui: 'light',
		stops: [
			[0, '#161821'],
			[0.6, '#242736'],
			[1, '#3a3f52'],
		],
		fog: '#2a2d3a',
		sky: '#4a4f63',
		ground: '#1c1e29',
		key: '#e8e8e8',
		stars: { count: 2000, color: '#ffffff', opacity: 1 },
	},
];

export const DEFAULT_BACKGROUND = BACKGROUNDS[0].id;
export const getBackground = id => BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];

/** CSS gradient string for shop swatches — same stops, different renderer. */
export const cssGradient = bg => `linear-gradient(180deg, ${bg.stops.map(([p, c]) => `${c} ${Math.round(p * 100)}%`).join(', ')})`;
