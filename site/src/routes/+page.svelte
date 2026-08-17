<script>
	import { PROJECTS } from '$lib/projects.js';
</script>

<svelte:head>
	<title>ai-app-factory</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-foreground">ai-app-factory</h1>
<p class="mt-2 text-muted-foreground">
	{PROJECTS.length} tracked project{PROJECTS.length === 1 ? '' : 's'}. Pick one from the sidebar.
</p>
