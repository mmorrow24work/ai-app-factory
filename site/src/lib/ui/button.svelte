<script>
	/**
	 * Ported from uk-wealth-tracker's `src/components/ui/button.svelte` -- a shadcn-svelte style
	 * Button whose variants are pure semantic-token classes (`bg-primary`, `bg-destructive`,
	 * `bg-secondary`, ...) rather than one-off hardcoded colors, so every button in the app follows
	 * the active theme/palette automatically. Adapted to this project's Svelte 5 runes mode: the
	 * source component's `<slot />` becomes `{@render children?.()}`.
	 */
	import { cn } from '$lib/utils.js';

	/** @type {Record<string, string>} */
	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	/** @type {Record<string, string>} */
	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		lg: 'h-11 rounded-md px-8',
		icon: 'h-10 w-10'
	};

	let { variant = 'default', size = 'default', className = '', children, ...restProps } = $props();

	const baseClasses =
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
</script>

<button
	class={cn(baseClasses, variants[variant] ?? '', sizes[size] ?? '', className)}
	{...restProps}
>
	{@render children?.()}
</button>
