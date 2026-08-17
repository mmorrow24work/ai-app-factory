<script>
	/**
	 * Nav-accessible quick-toggle, ported from uk-wealth-tracker's `ThemeToggleButton.svelte`
	 * (issue #116) -- sits in the header so switching theme never requires a trip to Settings.
	 * `./ThemeSettings.svelte` is the fuller Light/Dark picker on the Settings page; both
	 * read/write the same `$lib/theme.js` store, so flipping one updates the other immediately.
	 */
	import { onMount } from 'svelte';

	import { refreshTheme, theme, toggleTheme } from '$lib/theme.js';

	onMount(refreshTheme);

	const isDark = $derived($theme === 'dark');
	const label = $derived(isDark ? 'Switch to light mode' : 'Switch to dark mode');
</script>

<button
	type="button"
	class="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-sm hover:bg-accent hover:text-accent-foreground"
	onclick={toggleTheme}
	aria-pressed={isDark}
	title={label}
>
	<span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
	<span class="sr-only">{label}</span>
</button>
