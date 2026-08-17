<script>
	import { fetchJournal } from './journal.js';

	// Sequential blue, single hue -- per the dataviz skill, magnitude gets one hue light->dark,
	// and a single series needs no legend box (the heading already names what's plotted).
	// Steps from the skill's reference palette (references/palette.md).
	const BAR_FILL = '#2a78d6';

	let { repo } = $props();

	let loadState = $state(/** @type {'loading' | 'ready' | 'empty' | 'error'} */ ('loading'));
	let entries = $state(/** @type {import('./journal.js').JournalEntry[]} */ ([]));
	let velocity = $state(/** @type {Record<string, string> | null} */ (null));
	let hovered = $state(/** @type {number | null} */ (null));

	$effect(() => {
		let cancelled = false;
		(async () => {
			loadState = 'loading';
			try {
				const journal = await fetchJournal(repo);
				if (cancelled) return;
				if (!journal || journal.entries.length === 0) {
					loadState = 'empty';
					return;
				}
				entries = journal.entries.filter((entry) => entry.outputTokens != null);
				velocity = journal.velocity;
				loadState = entries.length === 0 ? 'empty' : 'ready';
			} catch {
				if (!cancelled) loadState = 'error';
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	let max = $derived(Math.max(1, ...entries.map((entry) => entry.outputTokens ?? 0)));

	/** @param {number|null} n */
	function formatCompact(n) {
		if (n == null) return '—';
		if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return n.toLocaleString();
	}

	/** @param {number|null} cost */
	function formatCost(cost) {
		return cost == null ? '—' : `$${cost.toFixed(4)}`;
	}
</script>

<section class="rounded-lg border border-border p-4">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Token burn</h2>

	{#if loadState === 'loading'}
		<p class="mt-3 text-sm text-muted-foreground">Loading journal…</p>
	{:else if loadState === 'error'}
		<p class="mt-3 text-sm text-muted-foreground">Could not load docs/journal.md for {repo}.</p>
	{:else if loadState === 'empty'}
		<p class="mt-3 text-sm text-muted-foreground">No journal.md yet for this project.</p>
	{:else}
		{#if velocity}
			<p class="mt-1 text-xs text-muted-foreground">
				{velocity['Issues with recorded metrics'] ?? entries.length} issues tracked · mean {velocity[
					'Mean output tokens per issue'
				] ?? '—'} output tokens/issue · mean {velocity['Mean estimated cost per issue'] ?? '—'} per issue
			</p>
		{/if}

		<div
			class="mt-4 flex h-40 items-end gap-[2px] border-b border-border"
			role="img"
			aria-label="Output tokens per journaled issue, {entries.length} entries, from {entries[0]
				.date} to {entries[entries.length - 1].date}"
		>
			{#each entries as entry, i (`${entry.issueNumber}-${entry.date}-${i}`)}
				<div class="relative flex h-full min-w-[6px] flex-1 flex-col items-center justify-end">
					{#if hovered === i}
						<div
							class="absolute bottom-full z-10 mb-2 w-max max-w-48 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md"
							role="status"
						>
							<p class="font-semibold">{formatCompact(entry.outputTokens)} output tokens</p>
							<p class="text-muted-foreground">
								Issue #{entry.issueNumber} · {entry.date}
							</p>
							<p class="text-muted-foreground">
								{formatCost(entry.cost)}{entry.model ? ` · ${entry.model}` : ''}
							</p>
						</div>
					{/if}
					<button
						type="button"
						class="w-full max-w-6 rounded-t-[4px] border-0 p-0"
						style="height: {((entry.outputTokens ?? 0) / max) *
							100}%; background-color: {BAR_FILL};"
						aria-label="Issue #{entry.issueNumber}, {entry.date}: {formatCompact(
							entry.outputTokens
						)} output tokens, {formatCost(entry.cost)}"
						onmouseenter={() => (hovered = i)}
						onmouseleave={() => (hovered = null)}
						onfocus={() => (hovered = i)}
						onblur={() => (hovered = null)}
					></button>
				</div>
			{/each}
		</div>

		<table class="sr-only">
			<caption>Output tokens per journaled issue for {repo}</caption>
			<thead>
				<tr>
					<th scope="col">Date</th>
					<th scope="col">Issue</th>
					<th scope="col">Output tokens</th>
					<th scope="col">Estimated cost</th>
					<th scope="col">Model</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry, i (`${entry.issueNumber}-${entry.date}-row-${i}`)}
					<tr>
						<td>{entry.date}</td>
						<td>#{entry.issueNumber}</td>
						<td>{entry.outputTokens}</td>
						<td>{formatCost(entry.cost)}</td>
						<td>{entry.model ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>
