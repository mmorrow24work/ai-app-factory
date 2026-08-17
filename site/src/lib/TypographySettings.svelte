<script>
	/**
	 * Settings page's "Typography" section, ported from uk-wealth-tracker's
	 * `TypographySettings.svelte` (issue #117) -- font family and text size, styled the same
	 * two-button-group way `./ThemeSettings.svelte` picks Light/Dark. Both preferences read and
	 * write `$lib/typography.js`'s stores directly.
	 *
	 * Only four font options, not seven: `$lib/typography.js`'s module doc explains why the
	 * `accessible`/`handwritten`/`spooky` options (which need self-hosted webfont packages) were
	 * dropped for this port.
	 */
	import { onMount } from 'svelte';

	import {
		fontFamily,
		refreshTypography,
		setFontFamily,
		setTextSize,
		textSize
	} from '$lib/typography.js';
	import Button from './ui/button.svelte';
	import Card from './ui/card.svelte';

	onMount(refreshTypography);

	/** @type {{ value: import('$lib/typography.js').FontFamily, label: string }[]} */
	const FONT_FAMILY_OPTIONS = [
		{ value: 'sans', label: 'Default' },
		{ value: 'serif', label: 'Serif' },
		{ value: 'rounded', label: 'Rounded' },
		{ value: 'mono', label: 'Monospace' }
	];

	/** @type {{ value: import('$lib/typography.js').TextSize, label: string }[]} */
	const TEXT_SIZE_OPTIONS = [
		{ value: 'small', label: 'Small' },
		{ value: 'medium', label: 'Default' },
		{ value: 'large', label: 'Large' }
	];
</script>

<Card className="p-4">
	<h2 class="text-lg font-semibold mb-1">Typography</h2>
	<p class="text-sm text-muted-foreground mb-3">
		Font and text size used throughout the app. Applied everywhere immediately, and remembered in
		this browser from then on.
	</p>

	<div class="mb-4">
		<h3 class="text-sm font-medium mb-2">Font</h3>
		<div class="flex flex-wrap gap-2">
			{#each FONT_FAMILY_OPTIONS as option (option.value)}
				<Button
					type="button"
					variant={option.value === $fontFamily ? 'default' : 'outline'}
					size="sm"
					onclick={() => setFontFamily(option.value)}
				>
					{option.label}
				</Button>
			{/each}
		</div>
	</div>

	<div>
		<h3 class="text-sm font-medium mb-2">Text size</h3>
		<div class="flex flex-wrap gap-2">
			{#each TEXT_SIZE_OPTIONS as option (option.value)}
				<Button
					type="button"
					variant={option.value === $textSize ? 'default' : 'outline'}
					size="sm"
					onclick={() => setTextSize(option.value)}
				>
					{option.label}
				</Button>
			{/each}
		</div>
	</div>
</Card>
