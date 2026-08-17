/**
 * Font family and text size preferences. Ported from uk-wealth-tracker's `$lib/typography.js`
 * (issue #117), with the `accessible`/`handwritten`/`spooky` font options dropped -- those need
 * self-hosted `@fontsource` webfont packages bundled with the app; this site keeps the four
 * options that need no font file at all (`sans`/`serif`/`rounded`/`mono`), to avoid adding
 * webfont bundle weight to a factory dashboard for a cosmetic pick.
 *
 * Same shape as `./theme.js`'s dark-mode toggle: two independent choices, each persisted to
 * `localStorage` under their own key, applied as a class on `<html>`, and read back before Svelte
 * hydrates via a duplicated inline script in `app.html` to avoid a flash of the wrong font/size.
 *
 * Unlike theme, there is no OS-level preference to default from (no equivalent of
 * `prefers-color-scheme` for "font family" or "base text size"), so an unset choice simply
 * resolves to the app's existing default appearance ({@link DEFAULT_FONT_FAMILY} /
 * {@link DEFAULT_TEXT_SIZE}) rather than following a system signal.
 *
 * Both preferences are applied as a class on `<html>`, not inline styles or a class per
 * component: `../app.css` maps each class to CSS custom properties
 * (`--app-font-family`/`--text-scale`) that `body`'s `font-family` and `html`'s `font-size` read,
 * so every element that already uses `rem`-based Tailwind typography utilities (`text-sm`,
 * `text-lg`, ...) scales with the root font-size automatically -- no per-component overrides.
 */

import { writable } from 'svelte/store';

/** `localStorage` key holding the explicit font family choice, once one has been made. */
export const FONT_FAMILY_STORAGE_KEY = 'ai-app-factory:font-family';

/** `localStorage` key holding the explicit text size choice, once one has been made. */
export const TEXT_SIZE_STORAGE_KEY = 'ai-app-factory:text-size';

/** @typedef {'sans' | 'serif' | 'rounded' | 'mono'} FontFamily */
/** @typedef {'small' | 'medium' | 'large'} TextSize */

/** The app's existing appearance -- what everyone saw before this preference existed. */
export const DEFAULT_FONT_FAMILY = /** @type {FontFamily} */ ('sans');
export const DEFAULT_TEXT_SIZE = /** @type {TextSize} */ ('medium');

/** `<html>` class for each non-default font family; `'sans'` needs none -- it's the CSS default. */
const FONT_FAMILY_CLASSES = /** @type {Record<FontFamily, string | undefined>} */ ({
	sans: undefined,
	serif: 'font-serif',
	rounded: 'font-rounded',
	mono: 'font-mono'
});

/** `<html>` class for each non-default text size; `'medium'` needs none -- it's the CSS default. */
const TEXT_SIZE_CLASSES = /** @type {Record<TextSize, string | undefined>} */ ({
	small: 'text-scale-small',
	medium: undefined,
	large: 'text-scale-large'
});

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
 * The explicit font family choice stored in this browser, if one has ever been made.
 *
 * @returns {FontFamily | undefined}
 */
export function getStoredFontFamily() {
	if (!hasLocalStorage()) return undefined;
	try {
		const value = localStorage.getItem(FONT_FAMILY_STORAGE_KEY);
		return value === 'sans' || value === 'serif' || value === 'rounded' || value === 'mono'
			? value
			: undefined;
	} catch {
		return undefined;
	}
}

/**
 * The explicit text size choice stored in this browser, if one has ever been made.
 *
 * @returns {TextSize | undefined}
 */
export function getStoredTextSize() {
	if (!hasLocalStorage()) return undefined;
	try {
		const value = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
		return value === 'small' || value === 'medium' || value === 'large' ? value : undefined;
	} catch {
		return undefined;
	}
}

/**
 * The font family that should be showing right now: the explicit choice if one exists, else the
 * app's default.
 *
 * @returns {FontFamily}
 */
export function resolveFontFamily() {
	return getStoredFontFamily() ?? DEFAULT_FONT_FAMILY;
}

/**
 * The text size that should be showing right now: the explicit choice if one exists, else the
 * app's default.
 *
 * @returns {TextSize}
 */
export function resolveTextSize() {
	return getStoredTextSize() ?? DEFAULT_TEXT_SIZE;
}

/**
 * @param {Record<string, string | undefined>} classMap
 * @param {string} value
 */
function applyClass(classMap, value) {
	try {
		const classList = document.documentElement.classList;
		for (const className of Object.values(classMap)) {
			if (className) classList.remove(className);
		}
		const className = classMap[value];
		if (className) classList.add(className);
	} catch {
		// No `document` (SSR) or a browser that refuses the write -- nothing further to do here;
		// the inline script in app.html and the next successful call are what actually matter.
	}
}

/**
 * The active font family, as a store so the Settings picker re-renders the moment it changes.
 * Starts at {@link DEFAULT_FONT_FAMILY} (storage isn't readable during SSR/prerender) -- call
 * {@link refreshTypography} once on mount, which {@link setFontFamily} also keeps in sync
 * afterwards.
 *
 * @type {import('svelte/store').Writable<FontFamily>}
 */
export const fontFamily = writable(DEFAULT_FONT_FAMILY);

/**
 * The active text size, as a store so the Settings picker re-renders the moment it changes.
 * Same start-at-default caveat as {@link fontFamily}.
 *
 * @type {import('svelte/store').Writable<TextSize>}
 */
export const textSize = writable(DEFAULT_TEXT_SIZE);

/**
 * Re-resolve both preferences from storage, apply them to `<html>`, and publish them to
 * {@link fontFamily}/{@link textSize}.
 *
 * @returns {{ fontFamily: FontFamily, textSize: TextSize }} The preferences now applied.
 */
export function refreshTypography() {
	const resolvedFontFamily = resolveFontFamily();
	const resolvedTextSize = resolveTextSize();
	applyClass(FONT_FAMILY_CLASSES, resolvedFontFamily);
	applyClass(TEXT_SIZE_CLASSES, resolvedTextSize);
	fontFamily.set(resolvedFontFamily);
	textSize.set(resolvedTextSize);
	return { fontFamily: resolvedFontFamily, textSize: resolvedTextSize };
}

/**
 * Set and persist an explicit font family choice.
 *
 * @param {FontFamily} value
 * @returns {FontFamily} `value`, unchanged -- returned so callers can chain it the same way
 *   `./theme.js`'s `setTheme` does.
 */
export function setFontFamily(value) {
	applyClass(FONT_FAMILY_CLASSES, value);
	fontFamily.set(value);
	if (hasLocalStorage()) {
		try {
			localStorage.setItem(FONT_FAMILY_STORAGE_KEY, value);
		} catch {
			// Best effort: the font is already applied for this page view even if it can't be
			// remembered for the next one.
		}
	}
	return value;
}

/**
 * Set and persist an explicit text size choice.
 *
 * @param {TextSize} value
 * @returns {TextSize} `value`, unchanged.
 */
export function setTextSize(value) {
	applyClass(TEXT_SIZE_CLASSES, value);
	textSize.set(value);
	if (hasLocalStorage()) {
		try {
			localStorage.setItem(TEXT_SIZE_STORAGE_KEY, value);
		} catch {
			// Best effort, same as setFontFamily.
		}
	}
	return value;
}
