<script>
	import { resolve } from '$app/paths';
	import { getStoredToken, setStoredToken, clearStoredToken } from '$lib/githubToken.js';
	import Button from '$lib/ui/button.svelte';
	import ThemeSettings from '$lib/ThemeSettings.svelte';
	import PaletteSettings from '$lib/PaletteSettings.svelte';
	import TypographySettings from '$lib/TypographySettings.svelte';

	// $derived, not $state+$effect: getStoredToken() reads nothing reactive, so this only
	// runs once per component instance (client-side; this page is prerendered and
	// localStorage doesn't exist at build time). Svelte 5's overridable $derived lets the
	// form below still reassign it via bind:value.
	let token = $derived(getStoredToken());
	let saved = $state(false);
	let cleared = $state(false);

	/** @param {SubmitEvent} event */
	function save(event) {
		event.preventDefault();
		setStoredToken(token.trim());
		saved = true;
		cleared = false;
	}

	function clear() {
		clearStoredToken();
		token = '';
		cleared = true;
		saved = false;
	}
</script>

<svelte:head>
	<title>Settings — ai-app-factory</title>
</svelte:head>

<article class="max-w-2xl">
	<h1 class="text-2xl font-semibold text-foreground">Settings</h1>
	<p class="mt-2 text-muted-foreground">
		Paste a GitHub personal access token to enable the
		<a href={resolve('/new')} class="text-foreground underline hover:no-underline">New project</a>
		flow, which dispatches a GitHub Actions workflow on your behalf.
	</p>

	<div class="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
		<p>
			Use a <span class="text-foreground">fine-grained</span> token, scoped to this repository (<code
				class="text-foreground">mmorrow24work/ai-app-factory</code
			>) only, with
			<span class="text-foreground">Actions: Read and write</span> permission -- that's all the
			<code class="text-foreground">/new</code> flow needs to trigger a workflow run.
		</p>
		<p class="mt-2">
			The token is stored only in this browser's <code class="text-foreground">localStorage</code>
			and is sent only to <code class="text-foreground">api.github.com</code>, directly from your
			browser, when you use the <code class="text-foreground">/new</code> page. It is never sent anywhere
			else, never committed to this repo, and never logged.
		</p>
	</div>

	<form class="mt-6 flex flex-col gap-3" onsubmit={save}>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-foreground">GitHub personal access token</span>
			<input
				type="password"
				autocomplete="off"
				spellcheck="false"
				bind:value={token}
				placeholder="github_pat_..."
				class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
			/>
		</label>
		<div class="flex items-center gap-3">
			<Button type="submit">Save</Button>
			<Button type="button" variant="outline" onclick={clear}>Clear</Button>
			{#if saved}<span class="text-sm text-muted-foreground">Saved.</span>{/if}
			{#if cleared}<span class="text-sm text-muted-foreground">Cleared.</span>{/if}
		</div>
	</form>

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
