<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { groupProjectsByStatus, elapsedSince } from '$lib/projects.js';
	import ClaudeStatusBadge from '$lib/ClaudeStatusBadge.svelte';
	import ThemeToggleButton from '$lib/ThemeToggleButton.svelte';
	import '../app.css';

	let { children } = $props();

	const groups = groupProjectsByStatus();

	/**
	 * @param {string} pathname
	 * @param {string} repo
	 */
	function isActiveProject(pathname, repo) {
		return pathname === `/projects/${repo}`;
	}

	// Elapsed-since-creation per project, keyed by repo -- gives the sidebar an at-a-glance
	// "how long has this been running" signal without a click through to the detail page.
	// Deliberately NOT a live Actions-run status dot here: that needs one GitHub API call per
	// tracked project, and the layout renders on every navigation -- SessionStatusBadge's own
	// comment (site/src/lib/SessionStatusBadge.svelte) documents that even ONE such poller
	// per page can exhaust the unauthenticated 60-requests/hour-per-IP budget on its own.
	// Fanning that out to every project in the sidebar, on every page, would reproduce that
	// same rate-limit exhaustion far worse. elapsedSince needs no network call at all -- it's
	// pure client-side math over projects.json's already-static createdAt.
	/** @type {Record<string, string>} */
	let elapsed = $state({});

	$effect(() => {
		const update = () => {
			/** @type {Record<string, string>} */
			const next = {};
			for (const { projects } of groups) {
				for (const project of projects) {
					next[project.repo] = elapsedSince(project.createdAt);
				}
			}
			elapsed = next;
		};
		update();
		const interval = setInterval(update, 60_000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col min-h-screen">
	<header class="flex items-center gap-3 px-4 py-3 border-b border-border">
		<a href={resolve('/')} class="font-semibold text-foreground no-underline">ai-app-factory</a>
		<div class="ml-auto flex items-center gap-3">
			<ClaudeStatusBadge />
			<ThemeToggleButton />
		</div>
	</header>

	<div class="flex flex-1 flex-col md:flex-row">
		<nav
			aria-label="Projects"
			class="flex flex-col gap-6 border-b border-border px-4 py-4 md:sticky md:top-0 md:max-h-screen md:w-64 md:shrink-0 md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:py-6"
		>
			{#each groups as { status, label, projects } (status)}
				<div>
					<h2 class="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{label}
					</h2>
					<ul class="flex flex-col gap-1 list-none m-0 p-0">
						{#each projects as project (project.repo)}
							{@const active = isActiveProject(page.url.pathname, project.repo)}
							{@const [owner, name] = project.repo.split('/')}
							<li>
								<a
									href={resolve('/projects/[owner]/[name]', { owner, name })}
									aria-current={active ? 'page' : undefined}
									class="flex flex-col gap-0.5 px-3 py-1.5 rounded text-foreground no-underline text-sm hover:bg-accent hover:text-accent-foreground {active
										? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
										: ''}"
								>
									<span>{project.repo}</span>
									{#if elapsed[project.repo]}
										<span
											class="text-xs {active
												? 'text-primary-foreground/70'
												: 'text-muted-foreground'}"
										>
											{elapsed[project.repo]} old
										</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}

			<div class="mt-auto border-t border-border pt-4 flex flex-col gap-1">
				<a
					href={resolve('/new')}
					aria-current={page.url.pathname === resolve('/new') ? 'page' : undefined}
					class="block px-3 py-1.5 rounded text-sm text-muted-foreground no-underline hover:bg-accent hover:text-accent-foreground"
				>
					New project
				</a>
				<a
					href={resolve('/how-it-works')}
					aria-current={page.url.pathname === resolve('/how-it-works') ? 'page' : undefined}
					class="block px-3 py-1.5 rounded text-sm text-muted-foreground no-underline hover:bg-accent hover:text-accent-foreground"
				>
					How it works
				</a>
				<a
					href={resolve('/settings')}
					aria-current={page.url.pathname === resolve('/settings') ? 'page' : undefined}
					class="block px-3 py-1.5 rounded text-sm text-muted-foreground no-underline hover:bg-accent hover:text-accent-foreground"
				>
					Settings
				</a>
			</div>
		</nav>

		<main class="flex-1 min-w-0 px-4 py-6">
			{@render children()}
		</main>
	</div>
</div>
