<script>
	// Plain-language, 6-step version of the workflow for a non-technical audience. The exact
	// mechanics (workflow filenames, trigger names, gh commands) live in the CLI command
	// reference section below this diagram on the how-it-works page, for anyone who wants that
	// level of detail -- this component intentionally never names a file, a label, or a script.
	const steps = [
		{
			title: 'Request a new app',
			body: 'Describe what you want, along with your name, email, and phone.'
		},
		{
			title: 'Approve it',
			body: 'The project owner reviews the plan and approves it before anything gets built.'
		},
		{
			title: 'AI agent builds it',
			body: 'An AI coding agent works with GitHub to write the code and open pull requests.'
		},
		{
			title: 'Host it on GitHub',
			body: 'The finished app is published and hosted using GitHub.'
		},
		{
			title: 'Fork it to make changes',
			body: 'Anyone who wants to extend or customize the app forks it on GitHub -- it’s theirs from there.'
		},
		{
			title: 'Original archived after 7 days',
			body: 'The project owner manually archives or deletes the original app about a week later.'
		}
	];
</script>

<ol class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each steps as step, i (step.title)}
		<li class="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
			<span
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
			>
				{i + 1}
			</span>
			<div>
				<p class="text-sm font-semibold text-foreground">{step.title}</p>
				<p class="mt-1 text-xs text-muted-foreground">{step.body}</p>
			</div>
		</li>
	{/each}
</ol>
