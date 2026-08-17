/**
 * Named colour palettes. Ported from uk-wealth-tracker's `$lib/palette.js` (issue #126).
 *
 * A second theming axis *under* the light/dark toggle in `./theme.js`, not beside it: picking a
 * palette swaps which set of colours light and dark mode are drawn from, and the light/dark
 * choice still decides which of that palette's two variants is showing. `../app.css` holds a
 * `.palette-<name>` rule (light) and a `.dark.palette-<name>` rule (dark) per palette; this
 * module only ever toggles the one class on `<html>`, exactly as `./theme.js` toggles `.dark` and
 * `./typography.js` toggles `.font-serif`/`.text-scale-large`.
 *
 * Same SSR caveat as `./theme.js`: nothing here touches `document`/`localStorage` at import time,
 * so {@link palette} starts at {@link DEFAULT_PALETTE} on both server and client -- call
 * {@link refreshPalette} from `onMount` to read the real value in and apply it.
 *
 * FOUC: an inline script in `app.html` applies the stored palette class to `<html>` before Svelte
 * hydrates, duplicating {@link resolvePalette}'s key and validation because that file is static
 * markup and can't import this module. Keep the two in sync if this logic changes.
 *
 * Unlike theme there is no OS-level signal to default from (no `prefers-color-scheme` equivalent
 * for "preferred hue"), so an unset choice resolves to {@link DEFAULT_PALETTE} -- the neutral
 * near-black-on-white scheme the app has always had.
 */

import { writable } from 'svelte/store';

/** `localStorage` key holding the explicit palette choice, once one has been made. */
export const PALETTE_STORAGE_KEY = 'ai-app-factory:palette';

/**
 * @typedef {'default' | 'male' | 'female' | 'football' | 'cricket' | 'beach' | 'country' | 'city'}
 *   Palette
 */

/** The app's original neutral scheme -- what everyone saw before this preference existed. */
export const DEFAULT_PALETTE = /** @type {Palette} */ ('default');

/**
 * Every palette, in the order the Settings picker lists them, with the copy it renders.
 *
 * The `male`/`female` labels are the source issue's own naming and describe two colour
 * aesthetics, not two audiences -- hence the deliberately neutral descriptions, and their
 * position side by side at the top of the list with no default-by-anything implied.
 *
 * @type {{ value: Palette, label: string, description: string }[]}
 */
export const PALETTES = [
	{ value: 'default', label: 'Default', description: 'The original neutral black-and-white app.' },
	{ value: 'male', label: 'Male', description: 'Cool slate blues with a teal accent.' },
	{ value: 'female', label: 'Female', description: 'Warm plums and violets over blush.' },
	{ value: 'football', label: 'Football', description: 'Pitch green on white.' },
	{ value: 'cricket', label: 'Cricket', description: 'Pitch green over cream and leather.' },
	{ value: 'beach', label: 'Sunny beach', description: 'Warm sand with turquoise water.' },
	{
		value: 'country',
		label: 'UK country living',
		description: 'Muted olives, russet and parchment.'
	},
	{ value: 'city', label: 'UK city living', description: 'Cool concrete greys and steel blue.' }
];

/**
 * `<html>` class for each non-default palette; `'default'` needs none -- it's what `:root` already
 * declares. (`../app.css` does define a `.palette-default` rule, but only so the Settings picker
 * can draw a swatch for it on a page whose `<html>` carries a different palette; nothing puts that
 * class on `<html>` itself.)
 *
 * @type {Record<Palette, string | undefined>}
 */
const PALETTE_CLASSES = {
	default: undefined,
	male: 'palette-male',
	female: 'palette-female',
	football: 'palette-football',
	cricket: 'palette-cricket',
	beach: 'palette-beach',
	country: 'palette-country',
	city: 'palette-city'
};

/**
 * Accessing `localStorage` can *throw* rather than be undefined (Safari's "block all cookies",
 * some enterprise policies), so this is a try/catch guard rather than a `typeof` check alone.
 *
 * @returns {boolean}
 */
function hasLocalStorage() {
	try {
		return typeof localStorage !== 'undefined' && localStorage !== null;
	} catch {
		return false;
	}
}

/**
 * Whether `value` names a palette this build knows about -- the guard against a stored value
 * written by a future build, or hand-edited.
 *
 * @param {unknown} value
 * @returns {value is Palette}
 */
export function isPalette(value) {
	return typeof value === 'string' && Object.hasOwn(PALETTE_CLASSES, value);
}

/**
 * The explicit palette choice stored in this browser, if one has ever been made.
 *
 * @returns {Palette | undefined}
 */
export function getStoredPalette() {
	if (!hasLocalStorage()) return undefined;
	try {
		const value = localStorage.getItem(PALETTE_STORAGE_KEY);
		return isPalette(value) ? value : undefined;
	} catch {
		return undefined;
	}
}

/**
 * The palette that should be showing right now: the explicit choice if one exists, else the app's
 * original scheme.
 *
 * @returns {Palette}
 */
export function resolvePalette() {
	return getStoredPalette() ?? DEFAULT_PALETTE;
}

/**
 * @param {Palette} value
 */
function applyPalette(value) {
	try {
		const classList = document.documentElement.classList;
		for (const className of Object.values(PALETTE_CLASSES)) {
			if (className) classList.remove(className);
		}
		const className = PALETTE_CLASSES[value];
		if (className) classList.add(className);
	} catch {
		// No `document` (SSR) or a browser that refuses the write -- nothing further to do here;
		// the inline script in app.html and the next successful call are what actually matter.
	}
}

/**
 * The active palette, as a store so the Settings picker re-renders the moment it changes. Starts
 * at {@link DEFAULT_PALETTE} (storage isn't readable during SSR/prerender) -- call
 * {@link refreshPalette} once on mount, which {@link setPalette} also keeps in sync afterwards.
 *
 * @type {import('svelte/store').Writable<Palette>}
 */
export const palette = writable(DEFAULT_PALETTE);

/**
 * Re-resolve the palette from storage, apply it to `<html>`, and publish it to {@link palette}.
 *
 * @returns {Palette} The palette now applied.
 */
export function refreshPalette() {
	const resolved = resolvePalette();
	applyPalette(resolved);
	palette.set(resolved);
	return resolved;
}

/**
 * Set and persist an explicit palette choice.
 *
 * @param {Palette} value
 * @returns {Palette} `value`, unchanged -- returned so callers can chain it the same way
 *   `./theme.js`'s `setTheme` does.
 */
export function setPalette(value) {
	applyPalette(value);
	palette.set(value);
	if (hasLocalStorage()) {
		try {
			localStorage.setItem(PALETTE_STORAGE_KEY, value);
		} catch {
			// Best effort: the palette is already applied for this page view even if it can't be
			// remembered for the next one.
		}
	}
	return value;
}
