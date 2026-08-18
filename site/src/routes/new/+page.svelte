<script>
	import Button from '$lib/ui/button.svelte';

	const REPO = 'mmorrow24work/ai-app-factory';
	const INTAKE_LABEL = 'new-project-ask';

	let projectName = $state('');
	let requirements = $state('');

	/**
	 * Builds a pre-filled "New issue" link rather than calling any authenticated API -- no
	 * GitHub token of any kind is needed to submit an ask. draft-design-doc.yml triggers on
	 * `issues: opened` (filtered to the new-project-ask label) and reads the issue's title/body
	 * directly; the issue's author becomes the requester's identity, authenticated by GitHub's
	 * own login rather than typed into a form field. See DESIGN.md's "Write path" and
	 * "Requester PII is deliberately minimized".
	 *
	 * @returns {string}
	 */
	function intakeIssueUrl() {
		const params = new URLSearchParams({
			title: projectName.trim(),
			body: requirements.trim(),
			labels: INTAKE_LABEL
		});
		return `https://github.com/${REPO}/issues/new?${params.toString()}`;
	}

	/** @param {SubmitEvent} event */
	function submit(event) {
		event.preventDefault();
		window.location.href = intakeIssueUrl();
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
		> and opens it as a pull request for review.
	</p>
	<p class="mt-2 text-muted-foreground">
		Submitting takes you to GitHub to finish as an issue there -- no account setup on this site, no
		token to paste. Your GitHub account is the only thing recorded as the requester, so you'll need
		to be signed in to GitHub to submit.
	</p>

	<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-foreground">Project name</span>
			<input
				required
				bind:value={projectName}
				placeholder="e.g. cloud-nautobot-eval"
				class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
			/>
		</label>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-foreground">Requirements</span>
			<textarea
				required
				bind:value={requirements}
				rows="6"
				placeholder="What should this project do? Rough notes are fine."
				class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
			></textarea>
		</label>
		<div>
			<Button type="submit">Continue on GitHub →</Button>
		</div>
	</form>
</article>
