<script>
	/**
	 * Ported from uk-wealth-tracker's `src/components/ui/card.svelte`. Adapted to this project's
	 * Svelte 5 runes mode: the source component's `<slot />` becomes `{@render children?.()}`.
	 */
	import { cn } from '$lib/utils.js';

	let { className = '', children } = $props();

	const baseClasses = 'rounded-lg border border-border bg-card text-card-foreground shadow-sm';
</script>

<div class={cn(baseClasses, className)}>
	{@render children?.()}
</div>
