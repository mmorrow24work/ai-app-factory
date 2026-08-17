<script>
	import { pollClaudeStatus } from './claudeStatus.js';

	// Indicator colors are fixed Tailwind shades (not the border/muted/... design tokens)
	// on purpose -- a status dot needs to read the same red/yellow/green regardless of
	// theme, so it stays legible once the site grows a dark theme (app.css: only the
	// light palette is wired up yet).
	/** @type {Record<string, {dot: string, label: string}>} */
	const INDICATOR_META = {
		none: { dot: 'bg-green-500', label: 'Operational' },
		minor: { dot: 'bg-yellow-500', label: 'Degraded' },
		major: { dot: 'bg-orange-500', label: 'Partial outage' },
		critical: { dot: 'bg-red-600', label: 'Major outage' }
	};
	const UNKNOWN_META = { dot: 'bg-muted-foreground', label: 'Status unknown' };

	let indicator = $state(/** @type {string | null} */ (null));
	let description = $state('');
	let incidents = $state(/** @type {import('./claudeStatus.js').Incident[]} */ ([]));
	let errored = $state(false);
	let expanded = $state(false);

	$effect(() => {
		const stop = pollClaudeStatus({
			onUpdate: (snapshot) => {
				errored = false;
				indicator = snapshot.status.indicator;
				description = snapshot.status.description;
				incidents = snapshot.incidents;
			},
			onError: () => {
				errored = true;
			}
		});
		return stop;
	});

	let meta = $derived(
		errored || indicator === null ? UNKNOWN_META : (INDICATOR_META[indicator] ?? UNKNOWN_META)
	);
	let hasDetail = $derived(!errored && incidents.length > 0);

	function show() {
		expanded = true;
	}
	function hide() {
		expanded = false;
	}
</script>

<div class="relative inline-block" role="group" onmouseenter={show} onmouseleave={hide}>
	<a
		href="https://status.claude.com"
		target="_blank"
		rel="noopener noreferrer"
		class="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs text-foreground no-underline hover:bg-accent hover:text-accent-foreground"
		onfocus={show}
		onblur={hide}
		aria-describedby={hasDetail ? 'claude-status-detail' : undefined}
		title="Claude platform status: {errored ? UNKNOWN_META.label : description || meta.label}"
	>
		<span class="h-2 w-2 shrink-0 rounded-full {meta.dot}" aria-hidden="true"></span>
		<span>{errored ? UNKNOWN_META.label : meta.label}</span>
	</a>

	{#if expanded && (hasDetail || errored)}
		<div
			id="claude-status-detail"
			role="status"
			class="absolute right-0 z-10 mt-1 w-64 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"
		>
			{#if errored}
				<p>Could not reach status.claude.com. Click the badge to check directly.</p>
			{:else}
				<p class="font-semibold">{description}</p>
				<ul class="mt-2 flex list-none flex-col gap-1.5 m-0 p-0">
					{#each incidents as incident (incident.id)}
						<li>
							<span class="font-medium">{incident.name}</span>
							<span class="text-muted-foreground"> — {incident.impact}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
