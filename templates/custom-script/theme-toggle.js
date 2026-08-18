/*
 * Framework-free light/dark toggle -- pairs with theme.css. Include this as a plain, blocking
 * <script src="theme-toggle.js"></script> in <head>, before any content -- not `defer`, not
 * `type="module"` -- so the stored choice applies before first paint (no flash of the wrong
 * theme). The click handler waits for DOMContentLoaded since it needs the toggle button to
 * exist first, but the theme application itself runs immediately at parse time.
 *
 * If the page doesn't already have a `<button id="theme-toggle">`, one is created and appended
 * to <body> automatically -- this file is meant to be a single drop-in include, no HTML
 * changes required.
 */
(function () {
	var STORAGE_KEY = 'theme';

	/** @param {string | null} value */
	function apply(value) {
		if (value === 'dark' || value === 'light') {
			document.documentElement.setAttribute('data-theme', value);
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
	}

	/** @returns {boolean} */
	function isDarkNow() {
		var explicit = document.documentElement.getAttribute('data-theme');
		if (explicit === 'dark') return true;
		if (explicit === 'light') return false;
		try {
			return matchMedia('(prefers-color-scheme: dark)').matches;
		} catch (e) {
			return false;
		}
	}

	// Apply the stored choice immediately, before first paint.
	var stored = null;
	try {
		stored = localStorage.getItem(STORAGE_KEY);
	} catch (e) {
		// Storage inaccessible (Safari "block all cookies", some enterprise policies) --
		// falls through to the system preference via the CSS media query instead.
	}
	apply(stored);

	function toggle() {
		var next = isDarkNow() ? 'light' : 'dark';
		apply(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch (e) {
			// Best effort: the theme is already applied for this page view even if it can't
			// be remembered for the next one.
		}
		var btn = document.getElementById('theme-toggle');
		if (btn) btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
	}

	document.addEventListener('DOMContentLoaded', function () {
		var btn = document.getElementById('theme-toggle');
		if (!btn) {
			btn = document.createElement('button');
			btn.id = 'theme-toggle';
			btn.type = 'button';
			document.body.appendChild(btn);
		}
		btn.textContent = isDarkNow() ? '☀️ Light' : '🌙 Dark';
		btn.setAttribute('aria-label', 'Toggle dark mode');
		btn.addEventListener('click', toggle);
	});
})();
