<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { groupProjectsByStatus } from '$lib/projects.js';
	import ClaudeStatusBadge from '$lib/ClaudeStatusBadge.svelte';
	import '../app.css';

	let { children } = $props();

	const groups = groupProjectsByStatus();

	/**
	 * @param {string} pathname
	 * @param {string} repo
	 */
	function isActiveProject(pathname, repo) {
		return pathname === `/projects/${encodeURIComponent(repo)}`;
	}
</script>

<div class="flex flex-col min-h-screen">
	<header class="flex items-center gap-3 px-4 py-3 border-b border-border">
		<a href={resolve('/')} class="font-semibold text-foreground no-underline">ai-app-factory</a>
		<div class="ml-auto">
			<ClaudeStatusBadge />
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
							<li>
								<a
									href={resolve(`/projects/${encodeURIComponent(project.repo)}`)}
									aria-current={active ? 'page' : undefined}
									class="block px-3 py-1.5 rounded text-foreground no-underline text-sm hover:bg-accent hover:text-accent-foreground {active
										? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
										: ''}"
								>
									{project.repo}
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
