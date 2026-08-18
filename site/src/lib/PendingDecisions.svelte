<script>
	import { listOpenPullRequests } from './github.js';

	// Plain styled <a> tags, not the Button component -- Button always renders a <button>, and
	// these need to be real links (no JS submit handler, just a navigable URL), so wrapping one
	// in an <a> would nest a button inside a link: invalid HTML and unreliable click behavior
	// across browsers. Classes copied from button.svelte's own default/outline variants so
	// these still read as buttons and stay on the same semantic-token theming.
	const approveClasses =
		'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors hover:bg-primary/90';
	const rejectClasses =
		'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-accent hover:text-accent-foreground';

	// 5 minutes, not 60s -- see the identical comment in SessionStatusBadge.svelte. These two
	// components are the main drivers of the unauthenticated 60-requests/hour-per-IP budget
	// getting exhausted on a project page left open for a while.
	const POLL_INTERVAL_MS = 5 * 60_000;

	let { repo } = $props();

	let prs = $state(/** @type {import('./github.js').PullRequest[]} */ ([]));
	let loaded = $state(false);
	let errored = $state(false);

	$effect(() => {
		let stopped = false;

		async function poll() {
			if (stopped) return;
			try {
				const open = await listOpenPullRequests(repo);
				if (stopped) return;
				prs = open;
				loaded = true;
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

	/**
	 * Pre-filled "New issue" deep link, same zero-credential mechanism as the site's own /new
	 * page -- no GitHub token touches the browser. review-decision.yml (in every generated
	 * project's own template) triggers on issues: opened filtered to this exact title prefix,
	 * and only actions the decision if the issue's author is the project's recorded requester
	 * or the repo owner -- see DESIGN.md's "PR review & merge".
	 *
	 * @param {'approve' | 'reject'} action
	 * @param {number} prNumber
	 * @returns {string}
	 */
	function decisionUrl(action, prNumber) {
		const title = `[review-${action}] PR #${prNumber}`;
		return `https://github.com/${repo}/issues/new?${new URLSearchParams({ title }).toString()}`;
	}
</script>

{#if loaded && prs.length > 0}
	<section class="mt-8">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
			Pending decisions
		</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			{prs.length} open pull request{prs.length === 1 ? '' : 's'} on this project. Approving or rejecting
			takes you to GitHub to finish as an issue there -- no account setup on this site, same as submitting
			a new project.
		</p>
		<div class="mt-4 flex flex-col gap-3">
			{#each prs as pr (pr.number)}
				<div class="rounded-lg border border-border bg-card p-4">
					<a
						href={pr.html_url}
						target="_blank"
						rel="noopener noreferrer external"
						class="text-sm font-semibold text-foreground underline hover:no-underline"
					>
						#{pr.number}
						{pr.title} ↗
					</a>
					<p class="mt-1 text-xs text-muted-foreground">Opened by {pr.user.login}</p>
					<div class="mt-3 flex flex-wrap gap-3">
						<a
							href={decisionUrl('approve', pr.number)}
							target="_blank"
							rel="noopener noreferrer external"
							class={approveClasses}
						>
							Approve
						</a>
						<a
							href={decisionUrl('reject', pr.number)}
							target="_blank"
							rel="noopener noreferrer external"
							class={rejectClasses}
						>
							Reject
						</a>
					</div>
				</div>
			{/each}
		</div>
	</section>
{:else if errored}
	<section class="mt-8">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
			Pending decisions
		</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Couldn't load open pull requests -- check <a
				href="https://github.com/{repo}/pulls"
				target="_blank"
				rel="noopener noreferrer external"
				class="text-foreground underline hover:no-underline">the repo directly ↗</a
			>.
		</p>
	</section>
{/if}
