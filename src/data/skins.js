/**
 * Block skins are pure data so new ones cost nothing but an entry here.
 * `palette` is walked with a lerp as the tower rises, which is what gives
 * each layer its own colour the way the reference art does.
 * `material` maps to a Three.js material recipe in game/Block.js.
 */
export const SKINS = [
	{
		id: 'sunset',
		name: 'Sunset',
		price: 0,
		material: 'standard',
		palette: ['#ffb35c', '#ff8a5c', '#f2606b', '#c65f9b', '#7b4397'],
	},
	{
		id: 'meadow',
		name: 'Meadow',
		price: 250,
		material: 'standard',
		palette: ['#f6d365', '#c3e06a', '#66c07d', '#2f9e78', '#1d6b52'],
	},
	{
		id: 'sorbet',
		name: 'Sorbet',
		price: 330,
		material: 'standard',
		palette: ['#ffd9e8', '#ff9ec4', '#d99bf0', '#9ec7f5', '#7fe0e0'],
	},
	{
		id: 'tide',
		name: 'Tide',
		price: 430,
		material: 'standard',
		palette: ['#a8edea', '#5ec2d6', '#3b82b8', '#274d8f', '#16264f'],
	},
	{
		id: 'monolith',
		name: 'Monolith',
		price: 570,
		material: 'metal',
		palette: ['#eef1f6', '#b9c1cd', '#7d8798', '#4a5261', '#2c313c'],
	},
	{
		id: 'bullion',
		name: 'Bullion',
		price: 1290,
		material: 'metal',
		palette: ['#fff2c4', '#ffd66b', '#e0a02b', '#b7761c', '#8a5510'],
	},
	{
		id: 'prism',
		name: 'Prism',
		price: 6690,
		material: 'glass',
		palette: ['#dff6ff', '#b8d9ff', '#c8b6ff', '#ffc2f0', '#ffe0b8'],
	},
	{
		id: 'circuit',
		name: 'Circuit',
		price: 20000,
		material: 'neon',
		palette: ['#00f5d4', '#00bbf9', '#9b5de5', '#f15bb5', '#fee440'],
	},
	{
		id: 'dunes',
		name: 'Dunes',
		price: 2940,
		material: 'standard',
		palette: ['#f9e4b7', '#e8ba7a', '#d4914e', '#b56d3b', '#8b4e2d'],
	},
	{
		id: 'oasis',
		name: 'Oasis',
		price: 11570,
		material: 'standard',
		palette: ['#b8a892', '#7a9e7e', '#5c7a7a', '#4a5d6f', '#3a4557'],
	},
	{
		id: 'blueprint',
		name: 'Blueprint',
		price: 750,
		material: 'standard',
		palette: ['#2c4e80', '#3d5a8c', '#4d6699', '#5e72a6', '#6e7fb3'],
	},
	{
		id: 'honeycomb',
		name: 'Honeycomb',
		price: 1700,
		material: 'standard',
		palette: ['#ffc857', '#ffb347', '#ff9f3a', '#ff8b2d', '#ff7720'],
	},
	{
		id: 'matrix',
		name: 'Matrix',
		price: 5080,
		material: 'neon',
		palette: ['#00f5d4', '#00d9b8', '#00bd9c', '#00a180', '#008564'],
	},
	{
		id: 'retro',
		name: 'Retro Wave',
		price: 3870,
		material: 'standard',
		palette: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
	},
	{
		id: 'carbon',
		name: 'Carbon Fiber',
		price: 15220,
		material: 'metal',
		palette: ['#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#5a5a5a'],
	},
	{
		id: 'pixels',
		name: 'Pixels',
		price: 980,
		material: 'standard',
		palette: ['#e63946', '#f77f00', '#fcbf49', '#06d6a0', '#118ab2'],
	},
	{
		id: 'arcade',
		name: 'Arcade',
		price: 8800,
		material: 'neon',
		palette: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
	},
	{
		id: 'zen',
		name: 'Zen Garden',
		price: 2240,
		material: 'standard',
		palette: ['#dda15e', '#bc6c25', '#a17c6b', '#8b7d77', '#5c6b73'],
	},
];

export const DEFAULT_SKIN = SKINS[0].id;
export const getSkin = id => SKINS.find(s => s.id === id) || SKINS[0];
