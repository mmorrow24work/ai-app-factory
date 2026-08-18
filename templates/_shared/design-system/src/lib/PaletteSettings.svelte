<script>
	/**
	 * Settings page's "Colour palette" section, ported from uk-wealth-tracker's
	 * `PaletteSettings.svelte` (issue #126) -- the named-palette picker, styled the same
	 * button-group way `./ThemeSettings.svelte` picks Light/Dark and `./TypographySettings.svelte`
	 * picks a font. Reads and writes `$lib/palette.js`'s store directly.
	 *
	 * Its own card rather than an addition to `ThemeSettings`: palette and light/dark are two axes
	 * of one appearance, but the picker is eight options with swatches and a caption, which would
	 * bury the two-button Light/Dark control it sits under.
	 *
	 * The swatches are the one thing here that isn't a plain button. Each is an element carrying
	 * its palette's own class, so `../app.css`'s `.palette-<name>` rule sets that palette's custom
	 * properties *on the swatch* and the inline `hsl(var(--...))` styles inside resolve to that
	 * palette's colours. `class:dark` is applied alongside it when the page is in dark mode so the
	 * swatch previews the variant the user would actually get; without it, every swatch would show
	 * its light variant on a dark page, since the `.dark.palette-<name>` rules need both classes on
	 * one element.
	 */
	import { onMount } from 'svelte';

	import { palette, PALETTES, refreshPalette, setPalette } from '$lib/palette.js';
	import { refreshTheme, theme } from '$lib/theme.js';
	import Button from './ui/button.svelte';
	import Card from './ui/card.svelte';

	onMount(() => {
		refreshPalette();
		refreshTheme();
	});

	const isDark = $derived($theme === 'dark');
	const active = $derived(PALETTES.find((option) => option.value === $palette) ?? PALETTES[0]);
</script>

<Card className="p-4">
	<h2 class="text-lg font-semibold mb-1">Colour palette</h2>
	<p class="text-sm text-muted-foreground mb-3">
		A set of colours for the whole app, on top of the light/dark choice above -- every palette has
		both a light and a dark version, so switching palette never overrides which one you're in.
		Palette right now: <span class="font-medium">{active.label}</span> -- {active.description}
	</p>
	<div class="flex flex-wrap gap-2">
		{#each PALETTES as option (option.value)}
			<Button
				type="button"
				variant={option.value === $palette ? 'default' : 'outline'}
				size="sm"
				className="gap-2"
				title={option.description}
				onclick={() => setPalette(option.value)}
			>
				<span
					class="palette-{option.value} inline-flex items-center gap-0.5 rounded-sm border px-1 py-0.5"
					class:dark={isDark}
					style="background: hsl(var(--background)); border-color: hsl(var(--border))"
					aria-hidden="true"
				>
					<span class="h-2.5 w-1.5 rounded-xs" style="background: hsl(var(--primary))"></span>
					<span class="h-2.5 w-1.5 rounded-xs" style="background: hsl(var(--chart-1))"></span>
					<span class="h-2.5 w-1.5 rounded-xs" style="background: hsl(var(--chart-2))"></span>
				</span>
				{option.label}
			</Button>
		{/each}
	</div>
</Card>
