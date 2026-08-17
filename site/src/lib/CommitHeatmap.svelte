<script>
	import { getCommitActivity } from './github.js';

	// Sequential blue, light->dark -- magnitude of daily commit count. Steps from the dataviz
	// skill's reference palette (references/palette.md); index 0 is "no commits" and uses the
	// gridline gray instead of the lightest blue step so an empty day reads as empty, not as
	// the smallest nonzero bucket.
	const NO_ACTIVITY_FILL = '#e1e0d9';
	const LEVEL_FILL = ['#cde2fb', '#6da7ec', '#2a78d6', '#104281'];

	let { repo } = $props();

	let loadState = $state(
		/** @type {'loading' | 'ready' | 'pending' | 'empty' | 'error'} */ ('loading')
	);
	let weeks = $state(/** @type {import('./github.js').CommitActivityWeek[]} */ ([]));

	$effect(() => {
		let cancelled = false;
		(async () => {
			loadState = 'loading';
			try {
				const result = await getCommitActivity(repo);
				if (cancelled) return;
				if (!result.ready) {
					loadState = 'pending';
					return;
				}
				weeks = result.weeks;
				loadState = weeks.length === 0 ? 'empty' : 'ready';
			} catch {
				if (!cancelled) loadState = 'error';
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	const DAY_MS = 24 * 60 * 60 * 1000;

	/** @param {import('./github.js').CommitActivityWeek[]} weeks */
	function buildCells(weeks) {
		/** @type {{key: string, date: string, count: number}[]} */
		const cells = [];
		for (const week of weeks) {
			const weekStartMs = week.week * 1000;
			for (let day = 0; day < 7; day++) {
				cells.push({
					key: `${week.week}-${day}`,
					date: new Date(weekStartMs + day * DAY_MS).toISOString().slice(0, 10),
					count: week.days?.[day] ?? 0
				});
			}
		}
		return cells;
	}

	let cells = $derived(buildCells(weeks));
	let max = $derived(Math.max(0, ...cells.map((cell) => cell.count)));

	/**
	 * @param {number} count
	 * @param {number} max
	 */
	function fillFor(count, max) {
		if (count === 0 || max === 0) return NO_ACTIVITY_FILL;
		const ratio = count / max;
		const level = ratio > 0.75 ? 3 : ratio > 0.5 ? 2 : ratio > 0.25 ? 1 : 0;
		return LEVEL_FILL[level];
	}
</script>

<section class="rounded-lg border border-border p-4">
	<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
		Commit activity
	</h2>

	{#if loadState === 'loading'}
		<p class="mt-3 text-sm text-muted-foreground">Loading commit history…</p>
	{:else if loadState === 'pending'}
		<p class="mt-3 text-sm text-muted-foreground">
			GitHub is still computing commit stats for this repository for the first time — check back in
			a bit.
		</p>
	{:else if loadState === 'error'}
		<p class="mt-3 text-sm text-muted-foreground">Could not load commit activity for {repo}.</p>
	{:else if loadState === 'empty'}
		<p class="mt-3 text-sm text-muted-foreground">No commits yet.</p>
	{:else}
		<div class="mt-4 overflow-x-auto pb-1">
			<div
				class="grid w-max grid-flow-col grid-rows-7 gap-[2px]"
				role="img"
				aria-label="Commit activity heatmap, 52 weeks ending {cells[cells.length - 1]?.date}"
			>
				{#each cells as cell (cell.key)}
					<div
						class="h-[10px] w-[10px] rounded-[2px]"
						style="background-color: {fillFor(cell.count, max)};"
						role="img"
						title="{cell.date}: {cell.count} commit{cell.count === 1 ? '' : 's'}"
						aria-label="{cell.date}: {cell.count} commit{cell.count === 1 ? '' : 's'}"
					></div>
				{/each}
			</div>
		</div>

		<div class="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
			<span>Less</span>
			<span class="h-[10px] w-[10px] rounded-[2px]" style="background-color: {NO_ACTIVITY_FILL};"
			></span>
			{#each LEVEL_FILL as fill (fill)}
				<span class="h-[10px] w-[10px] rounded-[2px]" style="background-color: {fill};"></span>
			{/each}
			<span>More</span>
		</div>
	{/if}
</section>
