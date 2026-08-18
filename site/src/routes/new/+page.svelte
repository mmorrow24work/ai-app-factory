<script>
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import { getStoredToken } from '$lib/githubToken.js';
	import { dispatchWorkflow, listWorkflowRunsForWorkflow } from '$lib/github.js';
	import Button from '$lib/ui/button.svelte';

	const REPO = 'mmorrow24work/ai-app-factory';
	const WORKFLOW_FILE = 'draft-design-doc.yml';
	const POLL_INTERVAL_MS = 8_000;
	const MAX_POLL_MS = 20 * 60_000;

	let projectName = $state('');
	let requirements = $state('');
	let requesterName = $state('');
	let requesterEmail = $state('');
	let requesterPhone = $state('');
	// Read once per component instance; nothing reactive on the way in, see the equivalent
	// comment on the Settings page's own `token`.
	let token = $derived(getStoredToken());

	/** @type {'idle' | 'dispatching' | 'watching' | 'success' | 'failure' | 'timeout' | 'error'} */
	let status = $state('idle');
	let errorMessage = $state('');
	let run = $state(/** @type {import('$lib/github.js').WorkflowRun | null} */ (null));

	let cancelled = false;
	onDestroy(() => {
		cancelled = true;
	});

	/** @param {number} ms */
	function sleep(ms) {
		return new Promise((done) => setTimeout(done, ms));
	}

	/**
	 * Polls this workflow's recent runs until one created after `dispatchedAt` shows up and
	 * completes. The dispatch API call itself returns no run id, so this is the only way to
	 * find "the run we just fired" -- matched by creation time since that's the one field the
	 * list endpoint and the dispatch call share.
	 *
	 * @param {Date} dispatchedAt
	 */
	async function watchRun(dispatchedAt) {
		const deadline = dispatchedAt.getTime() + MAX_POLL_MS;
		while (!cancelled) {
			try {
				const runs = await listWorkflowRunsForWorkflow(REPO, WORKFLOW_FILE, { token });
				const match = runs.find(
					(candidate) => new Date(candidate.created_at).getTime() >= dispatchedAt.getTime()
				);
				if (match) {
					run = match;
					if (match.status === 'completed') {
						status = match.conclusion === 'success' ? 'success' : 'failure';
						return;
					}
					status = 'watching';
				}
			} catch {
				// Transient network/rate-limit hiccup -- keep polling rather than failing the whole flow.
			}
			if (Date.now() >= deadline) {
				status = 'timeout';
				return;
			}
			await sleep(POLL_INTERVAL_MS);
		}
	}

	/** @param {SubmitEvent} event */
	async function submit(event) {
		event.preventDefault();
		if (!token) {
			status = 'error';
			errorMessage = 'Add a GitHub token in Settings first.';
			return;
		}

		status = 'dispatching';
		errorMessage = '';
		run = null;
		const dispatchedAt = new Date();
		try {
			await dispatchWorkflow(
				REPO,
				WORKFLOW_FILE,
				{
					project_name: projectName.trim(),
					requirements: requirements.trim(),
					requester_name: requesterName.trim(),
					requester_email: requesterEmail.trim(),
					requester_phone: requesterPhone.trim()
				},
				{ token }
			);
		} catch (err) {
			status = 'error';
			errorMessage = err instanceof Error ? err.message : String(err);
			return;
		}

		status = 'watching';
		watchRun(dispatchedAt);
	}

	function reset() {
		status = 'idle';
		errorMessage = '';
		run = null;
		projectName = '';
		requirements = '';
		requesterName = '';
		requesterEmail = '';
		requesterPhone = '';
	}
</script>

<svelte:head>
	<title>New project — ai-app-factory</title>
</svelte:head>

<article class="max-w-2xl">
	<h1 class="text-2xl font-semibold text-foreground">New project</h1>
	<p class="mt-2 text-muted-foreground">
		Describe the project, even vaguely -- Opus drafts a <code class="text-foreground"
			>DESIGN.md</code
		> and opens it as a pull request for you to review and edit.
	</p>
	<p class="mt-2 text-muted-foreground">
		Your name, email, and phone are recorded on the design doc PR and in the new repo's
		<code class="text-foreground">README.md</code> so it's always clear who requested the project.
	</p>

	{#if !token}
		<p class="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
			No GitHub token found. Add one on the
			<a href={resolve('/settings')} class="text-foreground underline hover:no-underline"
				>Settings</a
			> page before submitting.
		</p>
	{/if}

	{#if status === 'idle' || status === 'dispatching' || status === 'error'}
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-foreground">Project name</span>
				<input
					required
					bind:value={projectName}
					disabled={status === 'dispatching'}
					placeholder="e.g. cloud-nautobot-eval"
					class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				/>
			</label>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-foreground">Requirements</span>
				<textarea
					required
					bind:value={requirements}
					disabled={status === 'dispatching'}
					rows="6"
					placeholder="What should this project do? Rough notes are fine."
					class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				></textarea>
			</label>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-foreground">Your name</span>
				<input
					required
					bind:value={requesterName}
					disabled={status === 'dispatching'}
					placeholder="e.g. Jane Doe"
					class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				/>
			</label>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-foreground">Your email</span>
				<input
					required
					type="email"
					bind:value={requesterEmail}
					disabled={status === 'dispatching'}
					placeholder="e.g. jane@example.com"
					class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				/>
			</label>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-foreground">Your phone</span>
				<input
					required
					type="tel"
					bind:value={requesterPhone}
					disabled={status === 'dispatching'}
					placeholder="e.g. +1 555 0100"
					class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				/>
			</label>
			<div>
				<Button type="submit" disabled={status === 'dispatching' || !token}>
					{status === 'dispatching' ? 'Starting…' : 'Draft design doc'}
				</Button>
			</div>
			{#if status === 'error'}
				<p class="text-sm text-destructive">{errorMessage}</p>
			{/if}
		</form>
	{:else}
		<div class="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm">
			{#if status === 'watching'}
				<p class="text-foreground">
					Workflow run {run ? `#${run.run_number}` : ''} is in progress…
				</p>
				<p class="text-muted-foreground">
					Opus is drafting the design doc and will open a PR against
					<code class="text-foreground">main</code> once it's done.
				</p>
			{:else if status === 'success'}
				<p class="text-foreground">Design doc drafted.</p>
				<p class="text-muted-foreground">
					Find the PR in the repo's pull request list to review and edit it.
				</p>
			{:else if status === 'failure'}
				<p class="text-destructive">The workflow run failed.</p>
				<p class="text-muted-foreground">Check the run's logs for details.</p>
			{:else if status === 'timeout'}
				<p class="text-foreground">Still running after a while.</p>
				<p class="text-muted-foreground">
					Check the run directly -- it may just be a longer draft than usual.
				</p>
			{/if}

			<div class="flex flex-wrap items-center gap-3">
				{#if run}
					<a
						href={run.html_url}
						target="_blank"
						rel="noopener noreferrer external"
						class="text-sm text-foreground underline hover:no-underline"
					>
						View Actions run ↗
					</a>
				{/if}
				<a
					href={`https://github.com/${REPO}/pulls`}
					target="_blank"
					rel="noopener noreferrer external"
					class="text-sm text-foreground underline hover:no-underline"
				>
					View pull requests ↗
				</a>
				<Button type="button" variant="outline" className="ml-auto" onclick={reset}>
					Start another
				</Button>
			</div>
		</div>
	{/if}
</article>
