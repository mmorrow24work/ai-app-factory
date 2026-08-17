<script>
	import { listWorkflowRuns, findLatestWorkflowRun } from './github.js';

	const POLL_INTERVAL_MS = 60_000;

	let { repo, workflowPath = '.github/workflows/claude.yml' } = $props();

	// Fixed dot colors (not the border/muted/... design tokens), matching ClaudeStatusBadge --
	// a status dot needs to read the same regardless of theme.
	/** @type {Record<string, {dot: string, label: string}>} */
	const STATE_META = {
		queued: { dot: 'bg-yellow-500', label: 'Queued' },
		waiting: { dot: 'bg-yellow-500', label: 'Queued' },
		in_progress: { dot: 'bg-yellow-500', label: 'Running' },
		success: { dot: 'bg-green-500', label: 'Success' },
		failure: { dot: 'bg-red-600', label: 'Failed' },
		other: { dot: 'bg-orange-500', label: 'Needs attention' },
		none: { dot: 'bg-muted-foreground', label: 'No runs yet' }
	};
	const UNKNOWN_META = { dot: 'bg-muted-foreground', label: 'Status unavailable' };

	let run = $state(/** @type {import('./github.js').WorkflowRun | null} */ (null));
	let errored = $state(false);

	$effect(() => {
		let stopped = false;

		async function poll() {
			if (stopped) return;
			try {
				const runs = await listWorkflowRuns(repo);
				if (stopped) return;
				run = findLatestWorkflowRun(runs, workflowPath);
				errored = false;
			} catch {
				if (!stopped) errored = true;
			}
		}

		poll();
		const interval = setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			stopped = true;
			clearInterval(interval);
		};
	});

	/** @param {import('./github.js').WorkflowRun | null} run */
	function statusKey(run) {
		if (!run) return 'none';
		if (run.status !== 'completed') return run.status in STATE_META ? run.status : 'other';
		if (run.conclusion === 'success') return 'success';
		if (run.conclusion === 'failure' || run.conclusion === 'timed_out') return 'failure';
		return 'other';
	}

	let meta = $derived(errored ? UNKNOWN_META : (STATE_META[statusKey(run)] ?? UNKNOWN_META));
	let href = $derived(run?.html_url ?? `https://github.com/${repo}/actions`);
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer external"
	class="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs text-foreground no-underline hover:bg-accent hover:text-accent-foreground"
	title={errored
		? UNKNOWN_META.label
		: `Latest ${workflowPath} run: ${meta.label}${run ? ` (run #${run.run_number})` : ''}`}
>
	<span class="h-2 w-2 shrink-0 rounded-full {meta.dot}" aria-hidden="true"></span>
	<span>{meta.label}</span>
</a>
