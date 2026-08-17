import { browser } from '$app/environment';

// Deliberately localStorage, not a cookie or server session: DESIGN.md's write path treats
// this PAT the same trust level as a local `gh auth login` -- it never leaves the browser
// except in calls straight to api.github.com (see github.js), and this repo has no server
// route to send it to (`site/` is 100% static, per CLAUDE.md).
const STORAGE_KEY = 'ai-app-factory:github-pat';

/** @returns {string} */
export function getStoredToken() {
	if (!browser) return '';
	return localStorage.getItem(STORAGE_KEY) ?? '';
}

/** @param {string} token */
export function setStoredToken(token) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredToken() {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}
