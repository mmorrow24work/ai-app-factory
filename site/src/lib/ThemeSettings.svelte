<script>
	/**
	 * Settings page's "Appearance" section, ported from uk-wealth-tracker's `ThemeSettings.svelte`
	 * (issue #116) -- the fuller Light/Dark picker, styled as a two-button group. `./ThemeToggleButton
	 * .svelte` is the nav header's compact version of the same toggle; both read/write
	 * `$lib/theme.js`'s store, so this stays in sync with it with no wiring of its own.
	 */
	import { onMount } from 'svelte';

	import { setTheme, theme, refreshTheme } from '$lib/theme.js';
	import Button from './ui/button.svelte';
	import Card from './ui/card.svelte';

	onMount(refreshTheme);

	/** @type {{ value: import('$lib/theme.js').Theme, label: string }[]} */
	const OPTIONS = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];
</script>

<Card className="p-4">
	<h2 class="text-lg font-semibold mb-1">Appearance</h2>
	<p class="text-sm text-muted-foreground mb-3">
		Theme right now: <span class="font-medium">{$theme === 'dark' ? 'Dark' : 'Light'}</span>.
		Defaults to your browser's colour scheme on first visit; choosing one here remembers it in this
		browser from then on.
	</p>
	<div class="flex flex-wrap gap-2">
		{#each OPTIONS as option (option.value)}
			<Button
				type="button"
				variant={option.value === $theme ? 'default' : 'outline'}
				size="sm"
				onclick={() => setTheme(option.value)}
			>
				{option.label}
			</Button>
		{/each}
	</div>
</Card>
