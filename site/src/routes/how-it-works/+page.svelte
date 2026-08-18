<script>
	import PipelineDiagram from '$lib/PipelineDiagram.svelte';
	import { CLI_STAGES } from '$lib/cliCommands.js';
</script>

<svelte:head>
	<title>How it works — ai-app-factory</title>
</svelte:head>

<article class="max-w-3xl">
	<h1 class="text-2xl font-semibold text-foreground">How it works</h1>
	<p class="mt-2 text-muted-foreground">
		ai-app-factory turns an idea into a real, working app -- built and hosted using GitHub. Nothing
		gets built without a person approving it first: the project owner approves the initial plan,
		then the requester themselves approves or rejects each change as the app gets built.
	</p>

	<section class="mt-8">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
			The workflow
		</h2>
		<div class="mt-3">
			<PipelineDiagram />
		</div>
	</section>

	<section class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
			Technical detail: the real commands
		</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Curious what actually runs behind each step above? Every command below is sourced from a file
			that exists in this repo today, grouped by stage.
		</p>

		<div class="mt-4 flex flex-col gap-3">
			{#each CLI_STAGES as group (group.stage)}
				<details class="rounded-lg border border-border bg-card" open>
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground"
					>
						<span>{group.stage}</span>
					</summary>
					<div class="flex flex-col gap-4 border-t border-border px-4 py-4">
						{#each group.commands as cmd (cmd.command)}
							<div>
								<code
									class="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground"
									>{cmd.command}</code
								>
								<p class="mt-1.5 text-sm text-foreground">
									<span class="font-medium">{cmd.who}</span> — {cmd.when}
								</p>
								<p class="mt-0.5 text-xs text-muted-foreground">Source: {cmd.source}</p>
							</div>
						{/each}
					</div>
				</details>
			{/each}
		</div>
	</section>
</article>
