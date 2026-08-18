<script>
	import { elapsedSince, formatCreatedAt } from '$lib/projects.js';
	import TokenBurnChart from '$lib/TokenBurnChart.svelte';
	import SessionStatusBadge from '$lib/SessionStatusBadge.svelte';
	import CommitHeatmap from '$lib/CommitHeatmap.svelte';
	import PendingDecisions from '$lib/PendingDecisions.svelte';

	let { data } = $props();
	let project = $derived(data.project);

	let elapsed = $state('');

	// Elapsed time must reflect the visitor's clock, not the build's -- this page is
	// prerendered at build time, so computing it during render would freeze it at the
	// commit's build time and go stale the moment the static HTML is served. $effect (not
	// onMount) so navigating between two project pages re-derives it for the new project too.
	$effect(() => {
		const update = () => {
			elapsed = elapsedSince(project.createdAt);
		};
		update();
		const interval = setInterval(update, 60_000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{project.repo} — ai-app-factory</title>
</svelte:head>

<article class="max-w-2xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold text-foreground">{project.repo}</h1>
		<SessionStatusBadge repo={project.repo} />
	</div>
	<dl class="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
		<dt class="text-muted-foreground">Type</dt>
		<dd class="text-foreground">{project.type}</dd>

		<dt class="text-muted-foreground">Status</dt>
		<dd class="text-foreground capitalize">{project.status}</dd>

		<dt class="text-muted-foreground">Created</dt>
		<dd class="text-foreground">{formatCreatedAt(project.createdAt)}</dd>

		<dt class="text-muted-foreground">Elapsed</dt>
		<dd class="text-foreground">{elapsed || '…'}</dd>
	</dl>

	<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ask</h2>
	<p class="mt-2 text-foreground whitespace-pre-wrap">{project.ask}</p>

	<PendingDecisions repo={project.repo} />

	<a
		href="https://github.com/{project.repo}"
		target="_blank"
		rel="noopener noreferrer"
		class="mt-8 inline-block text-sm text-foreground underline hover:no-underline"
	>
		View repository on GitHub ↗
	</a>

	<div class="mt-8 flex flex-col gap-6">
		<TokenBurnChart repo={project.repo} />
		<CommitHeatmap repo={project.repo} />
	</div>
</article>
