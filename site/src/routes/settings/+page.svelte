<script>
	import { resolve } from '$app/paths';
	import ThemeSettings from '$lib/ThemeSettings.svelte';
	import PaletteSettings from '$lib/PaletteSettings.svelte';
	import TypographySettings from '$lib/TypographySettings.svelte';
</script>

<svelte:head>
	<title>Settings — ai-app-factory</title>
</svelte:head>

<article class="max-w-2xl">
	<h1 class="text-2xl font-semibold text-foreground">Settings</h1>
	<p class="mt-2 text-muted-foreground">
		Nothing here requires a GitHub token -- submitting a new project on the
		<a href={resolve('/new')} class="text-foreground underline hover:no-underline">New project</a> page
		takes you to GitHub itself to finish as an issue there.
	</p>

	<h2 class="mt-10 text-lg font-semibold text-foreground">Appearance &amp; typography</h2>
	<p class="mt-2 text-muted-foreground">
		Display preferences below are stored only in this browser's <code class="text-foreground"
			>localStorage</code
		> and apply immediately, app-wide.
	</p>
	<div class="mt-4 flex flex-col gap-4">
		<ThemeSettings />
		<PaletteSettings />
		<TypographySettings />
	</div>
</article>
